import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { injectable } from 'inversify'
import Command from '../structs/command.js'

@injectable()
export default class Ping implements Command {
  readonly builder = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Responds with current ping in milliseconds')
  readonly features = []

  async handle(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: `${interaction.client.ws.ping}ms`, ephemeral: true })
  }
}
