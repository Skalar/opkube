import chalk from 'chalk'
import {basename} from 'path'
import commands from './commands'

const executableName = basename(process.argv[1])

export default async function showHelp(error?: string) {
  if (error) {
    console.log([chalk.red.bold('ERROR'), error].join(' '))
  }

  console.log(chalk.blueBright('\nOPKUBE USAGE\n'))
  for (const [commandName, command] of Object.entries(commands)) {
    console.log('# ' + command.description)

    const cmdComponents = [
      chalk.greenBright.bold('$'),
      chalk.bold.blue(executableName),
      chalk.yellow(commandName),
      chalk.white(command.args || ''),
    ]

    console.log(cmdComponents.join(' ') + '\n')
  }

  console.log(`# Autocompletion for bash, zsh, fish`)
  console.log(`opkube --install-completion`)
  console.log(`opkube --uninstall-completion\n`)
}
