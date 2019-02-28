import {CliCommand} from '../types'
import fromVault from './fromVault'
import toVault from './toVault'

const commands: {[commandName: string]: CliCommand} = {
  'from-vault': fromVault,
  'to-vault': toVault,
}

export default commands
