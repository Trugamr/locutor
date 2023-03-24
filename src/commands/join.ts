import { ChatInputCommandInteraction, SlashCommandBuilder, ChannelType } from 'discord.js'
import { inject, injectable } from 'inversify'
import invariant from 'tiny-invariant'
import { Voice } from '../services/voice.js'
import Command from '../structs/command.js'
import TYPES from '../types.js'

@injectable()
export default class Join implements Command {
  readonly builder = new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins your current voice channel')

  constructor(@inject(TYPES.Voice) private readonly voice: Voice) {}

  async handle(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    invariant(interaction.guild, 'interaction must be in guild')

    let connection = this.voice.get(interaction.guild.id)
    if (connection) {
      // TODO: Don't destroy connection if user is already in the same channel
      // Destroy existing connection
      connection.destroy()
    }

    // Check if user is currently in a voice channel
    const channel = interaction.guild.channels.cache.find(channel => {
      if (channel.type === ChannelType.GuildVoice) {
        return channel.members.find(member => member.id === interaction.user.id)
      }
      return false
    })
    if (!channel) {
      await interaction.editReply('You must be in voice channel')
      return
    }
    invariant(channel.type === ChannelType.GuildVoice, 'channel must be voice channel')

    // Join voice channel
    connection = this.voice.join(channel)

    await interaction.editReply('Joined voice channel')
  }
}
