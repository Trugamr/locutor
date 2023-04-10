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

enum VoiceStateEventType {
  Joined,
  Left,
  Changed,
  Unchanged,
}

function getVoiceStateEventType(prev: VoiceState, next: VoiceState) {
  if (!prev.channel && next.channel) {
    invariant(next.member, 'member must be defined')
    return {
      type: VoiceStateEventType.Joined,
      member: next.member,
    } as const
  } else if (prev.channel && !next.channel) {
    invariant(prev.member, 'member must be defined')
    return {
      type: VoiceStateEventType.Left,
      member: prev.member,
    } as const
  } else if (prev.channel && next.channel) {
    invariant(next.member, 'member must be defined')
    return {
      type: VoiceStateEventType.Changed,
      member: next.member,
    } as const
  }
  return {
    type: VoiceStateEventType.Unchanged,
  } as const
}

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
    // Bot user must be defined on client
    const me = this.client.user
    invariant(me, 'client user must be defined')

    // Don't do anything if bot is not the in one of the voice channels
    if (![prev.channel, next.channel].some(c => c?.members.find(m => m.id === me.id))) {
      return
    }

    // Don't do anything if bot is not in any voice channel
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

    // TODO: Make messages user configurable

    // Build message to play
    const event = getVoiceStateEventType(prev, next)
    if (event.type === VoiceStateEventType.Joined) {
      url.searchParams.set('q', `${event.member.displayName} चैनल में आ चुके है`)
    } else if (event.type === VoiceStateEventType.Left) {
      url.searchParams.set('q', `${event.member.displayName} चैनल छोड़ कर चले गए है`)
    } else if (event.type === VoiceStateEventType.Changed) {
      url.searchParams.set('q', `${event.member.displayName} ने चैनल बदल लिया है`)
    } else {
      return
    }

    const resource = createAudioResource(url.href, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    })
    invariant(resource.volume, 'resource volume must be defined')
    resource.volume.setVolume(0.5)

    player.play(resource)
  }
}
