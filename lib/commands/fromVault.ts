import ora from 'ora'
import * as op from '../op'
import resolveNestedPromises from '../resolveNestedPromises'
import showHelp from '../showHelp'
import {CliCommand, OPItem} from '../types'

const fromVault: CliCommand = {
  description: 'Generate secret manifests from 1Password vault items',
  args: '<vault> [--tags tag1,tag2]',

  async handler(config, [vault], params: any) {
    if (!vault) {
      showHelp('Vault name must be specified')
      return
    }

    const spinner = ora({
      text: `${vault}: fetching item list`,
      color: 'yellow',
    })

    spinner.start()

    const tags = params.tags ? params.tags.split(',') : null
    const vaultItems: OPItem[] = await op.invoke(`list items --vault=${vault}`)

    const secretListItems = vaultItems.filter(
      item =>
        item.overview.tags &&
        item.overview.tags.includes('secret') &&
        (!tags || item.overview.tags.find(t => tags.includes(t)))
    )

    spinner.text = `${vault}: fetching data for ${
      secretListItems.length
    } secrets`

    const secretItems: OPItem[] = await Promise.all(
      secretListItems.map(item => op.getItem(vault, item.uuid))
    )

    const secrets = []

    for (const secret of secretItems) {
      const data: {[key: string]: string | Promise<string>} = {}
      for (const section of secret.details.sections) {
        if (section.title === 'data') {
          for (const {t: title, v: value} of section.fields) {
            data[title] = Buffer.from(value).toString('base64')
          }
        } else if (section.name === 'linked items') {
          if (section.fields) {
            for (const {v: linkedDocumentUUID, t: title} of section.fields) {
              if (linkedDocumentUUID) {
                data[title] = op
                  .getDocument(linkedDocumentUUID)
                  .then(v => Buffer.from(v).toString('base64'))
              }
            }
          }
        }
      }
      secrets.push({
        name: secret.overview.title,
        data,
        notes: secret.details.notesPlain,
        labels: secret.overview.tags.filter(t => t !== 'secret'),
      })
    }

    const resolvedSecrets = await resolveNestedPromises(secrets, {}, 4)

    spinner.stop()

    for (const {name, data, notes, labels} of resolvedSecrets) {
      const secretJSON = JSON.stringify(
        {
          apiVersion: 'v1',
          kind: 'Secret',
          type: 'Opaque',
          metadata: {
            name,
            annotations: {
              notes,
            },
            labels: labels.reduce(
              (m: any, l: string) => ({...m, [l]: 'true'}),
              {}
            ),
          },
          data,
        },
        null,
        2
      )
      console.log('---\n')
      console.log('#')
      console.log(`# ${name} (vault: ${vault})`)
      console.log('#')
      console.log(`\n${secretJSON}\n`)
    }
  },
}

export default fromVault
