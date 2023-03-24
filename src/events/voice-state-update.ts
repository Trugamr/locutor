import { StreamType, createAudioResource } from '@discordjs/voice'
import { ChannelType, Client, Events, VoiceState } from 'discord.js'
import { inject, injectable } from 'inversify'
import invariant from 'tiny-invariant'
import Players from '../managers/players'
import Config from '../services/config'
import { Logger } from '../services/logger'
import { Voice } from '../services/voice'
import Event from '../structs/event'
import TYPES from '../types'

@injectable()
export default class VoiceStateUpdate implements Event<Events.VoiceStateUpdate> {
  readonly type = Events.VoiceStateUpdate
  readonly once = false

  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.Client) private readonly client: Client,
    @inject(TYPES.Voice) private readonly voice: Voice,
    @inject(TYPES.Players) private readonly players: Players,
    @inject(TYPES.Config) private readonly config: Config,
  ) {}

  readonly listener = async (prev: VoiceState, next: VoiceState) => {
    // TODO: Only play if user is joining or leaving same channel as bot
    if (!prev.channel && next.channel) {
      // User joined a voice channel
      this.logger.debug(
        `User ${next.member?.user.username} joined voice channel ${next.channelId}`,
      )
    } else if (prev.channel && !next.channel) {
      // User left a voice channel
      this.logger.debug(
        `User ${prev.member?.user.username} left voice channel ${prev.channelId}`,
      )
    } else if (prev.channel && next.channel) {
      // User changed voice channel
      this.logger.debug(
        `User ${next.member?.user.username} changed voice channel from ${prev.channelId} to ${next.channelId}`,
      )
    }

    const me = this.client.user
    invariant(me, 'client user must be defined')

    // Find the voice channel the bot is currently in
    const channel = this.client.channels.cache.find(channel => {
      if (channel.type === ChannelType.GuildVoice) {
        return channel.members.find(member => member.id === me.id)
      }
      return false
    })

    if (!channel) {
      return
    }
    invariant(channel.type === ChannelType.GuildVoice, 'channel must be voice channel')

    const connection = this.voice.get(channel.guild.id)
    invariant(connection, 'connection must be defined')

    const player = this.players.get(connection)

    // Generate audio url
    const url = new URL('/translate_tts', this.config.get('TTS_API_URL'))
    url.searchParams.set('ie', 'UTF-8')
    url.searchParams.set('tl', 'hi-IN')
    url.searchParams.set('client', 'tw-ob')
    url.searchParams.set('q', 'bop')

    const resource = createAudioResource(url.href, {
      inputType: StreamType.Arbitrary,
    })

    player.play(resource)
  }
}
