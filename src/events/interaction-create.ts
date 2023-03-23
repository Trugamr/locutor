import { Collection, Events, Interaction } from 'discord.js'
import { injectable, multiInject } from 'inversify'
import invariant from 'tiny-invariant'
import Command from '../structs/command'
import Event from '../structs/event'
import TYPES from '../types'

@injectable()
export default class InteractionCreate implements Event<Events.InteractionCreate> {
  private readonly commandsByName = new Collection<string, Command>()
  readonly type = Events.InteractionCreate
  readonly once = false

  constructor(@multiInject(TYPES.Command) private readonly commands: Command[]) {
    for (const command of this.commands) {
      invariant(command.builder.name, 'command name is required')
      this.commandsByName.set(command.builder.name, command)
    }
  }

  readonly listener = async (interaction: Interaction) => {
    if (interaction.isCommand()) {
      const command = this.commandsByName.get(interaction.commandName)
      if (!command) {
        return
      }

      // TODO: Send error message
      invariant(interaction.guild, 'Commands can only be used in guild')

      await command.handle(interaction)
    }
  }
}
