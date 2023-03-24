import { Events, VoiceState } from 'discord.js'
import { inject, injectable } from 'inversify'
import { Logger } from '../services/logger'
import Event from '../structs/event'
import TYPES from '../types'

@injectable()
export default class VoiceStateUpdate implements Event<Events.VoiceStateUpdate> {
  readonly type = Events.VoiceStateUpdate
  readonly once = false

  constructor(@inject(TYPES.Logger) private readonly logger: Logger) {}

  readonly listener = async (prev: VoiceState, next: VoiceState) => {
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
  }
}
