import parseArgs from 'minimist'

import commands from './commands'
import showHelp from './showHelp'

export default async function cli() {
  const {_: args, ...params} = parseArgs(process.argv.slice(2))
  const commandName = args.shift()

  if (!commandName) {
    showHelp()
    return
  }

  const command = commands[commandName]

  if (!command) {
    showHelp()
    return
  }

  if (params.help || args[0] === 'help') {
    showHelp()
    return
  }

  await command.handler({}, args, params)
}
