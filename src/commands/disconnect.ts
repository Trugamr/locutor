import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { inject, injectable } from 'inversify'
import invariant from 'tiny-invariant'
import { Voice } from '../services/voice'
import Command from '../structs/command'
import TYPES from '../types'

@injectable()
export class Disconnect implements Command {
  readonly builder = new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnect from voice channel')
  readonly features = []

  constructor(@inject(TYPES.Voice) private readonly voice: Voice) {}

  async handle(interaction: ChatInputCommandInteraction) {
    // TODO: Get already narrowed down type
    invariant(interaction.guild, 'guild should exist on disconnect interaction')

    const connection = this.voice.get(interaction.guild.id)
    if (!connection) {
      await interaction.reply('No voice channel is currently joined')
      return
    }
    connection.destroy()

    // TODO: Await state change
    await interaction.reply('Disconnected from voice channel')
  }
}
