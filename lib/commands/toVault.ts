import getStdin from 'get-stdin'
import yaml from 'js-yaml'
import ora from 'ora'
import * as op from '../op'
import showHelp from '../showHelp'
import {CliCommand} from '../types'

const toVault: CliCommand = {
  description: 'Create/update 1Password vault items based on secret manifests',
  args: '<vault>',

  async handler(config, [vault], params) {
    if (!vault) {
      showHelp('Vault name must be specified')
      return
    }

    const inputYaml = await getStdin()
    const doc = yaml.safeLoad(inputYaml)

    const secrets = doc.items || [doc]

    const spinner = ora({
      text: `${vault}: writing ${secrets.length} secrets`,
      color: 'yellow',
    })

    spinner.start()

    await Promise.all(
      secrets.map((secret: any) => op.writeSecret({vault, secret}))
    )

    spinner.succeed(`${vault}: wrote ${secrets.length} secrets`)
  },
}

export default toVault
