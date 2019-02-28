import {exec as execCb} from 'child_process'
import {randomBytes} from 'crypto'
import {mkdir as mkdirCb, writeFile as writeFileCb} from 'fs'
import {tmpdir} from 'os'
import {join} from 'path'
import {promisify} from 'util'

const exec = promisify(execCb)
const mkdir = promisify(mkdirCb)
const writeFile = promisify(writeFileCb)

export async function invoke(args: string, parse = true) {
  let attempt = 0

  while (attempt < 10) {
    attempt++

    try {
      const {stdout} = await exec(`op ${args}`)

      return parse ? JSON.parse(stdout) : stdout
    } catch (error) {
      if (error.toString().includes('409: Conflict')) {
        continue
      }

      throw error
    }
  }
}

export async function getDocument(ref: string) {
  return await invoke(`get document ${ref}`, false)
}

export async function getItem(vault: string, ref: string) {
  return await invoke(`get item ${ref} --vault="${vault}"`)
}

export async function writeItem(params: {
  vault: string
  title: string
  tags?: string
  data: any
}) {
  // Secure Note
  const {vault, title, tags, data: itemData} = params

  const data = {notesPlain: 'opkube', sections: [], ...itemData}
  const {stdout: encodedItem} = await exec(
    `echo '${JSON.stringify(data)}' | op encode`
  )

  const allTags = ['secret', ...(tags ? tags.split(',') : [])]

  await exec(
    `op create item "Secure Note" ${encodedItem.trim()} --title="${title}" --vault="${vault}" --tags="${allTags.join(
      ','
    )}"`
  )
}

export async function writeSecret(params: {
  vault: string
  secret: {
    type: string
    metadata: {
      name: string
      annotations: {[key: string]: string}
      labels: {[key: string]: string}
    }
    data: {[key: string]: string}
  }
}) {
  const {vault, secret} = params

  if (secret.type !== 'Opaque') {
    throw new Error(`Only opaque secrets supported for now`)
  }

  let existingItem: any

  try {
    existingItem = await getItem(vault, secret.metadata.name)

    if (
      !existingItem.overview.tags ||
      !existingItem.overview.tags.includes('secret')
    ) {
      existingItem = undefined
    }
  } catch (error) {
    // Not found?
  }

  const inlineData: {[key: string]: string} = {}
  const referencedData: {[key: string]: string} = {}
  for (const [key, base64Value] of Object.entries(secret.data)) {
    const value = Buffer.from(base64Value, 'base64').toString()
    if (value.length > 100 || value.includes('\n')) {
      const document = await createDocument({
        vault,
        title: `${secret.metadata.name}__${key}`,
        body: value,
        filename: key,
      })
      referencedData[key] = document.uuid
    } else {
      inlineData[key] = value
    }
  }

  await writeItem({
    vault,
    title: secret.metadata.name,
    tags: Object.keys(secret.metadata.labels || {}).join(','),
    data: {
      notesPlain: secret.metadata.annotations
        ? secret.metadata.annotations.notes
        : '',
      sections: [
        {
          fields: Object.entries(referencedData).map(([k, v]) => {
            return {
              k: 'reference',
              t: k,
              v,
            }
          }),
          name: 'linked items',
          title: 'Related Items',
        },
        {
          fields: Object.entries(inlineData).map(([k, v]) => {
            return {
              k: 'string',
              t: k,
              v,
            }
          }),
          title: 'data',
        },
      ],
    },
  })

  if (existingItem) {
    const linkedSection = existingItem.details.sections.find(
      (s: any) => s.name === 'linked items'
    )

    if (linkedSection.fields) {
      await Promise.all(
        linkedSection.fields.map((field: any) => {
          return invoke(`delete item ${field.v} --vault="${vault}"`, false)
        })
      )
    }

    await invoke(`delete item ${existingItem.uuid} --vault="${vault}" `, false)
  }
}

export async function createDocument(params: {
  vault: string
  title: string
  filename: string
  body: Buffer | string
}) {
  const {vault, title, filename, body} = params

  const tempdir = join(tmpdir(), `opkube-${randomBytes(8).toString('hex')}`)
  const filePath = join(tempdir, filename)
  await mkdir(tempdir)
  await writeFile(filePath, body)
  const document = await invoke(
    `create document ${filePath} --title="${title}" --vault="${vault}" --tags="secret-data"`
  )

  return document
}
