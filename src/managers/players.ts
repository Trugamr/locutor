import { VoiceConnection } from '@discordjs/voice'
import { Collection, Snowflake } from 'discord.js'
import { injectable } from 'inversify'
import invariant from 'tiny-invariant'
import Player from '../services/player'

@injectable()
export default class Players {
  private readonly players = new Collection<Snowflake, Player>()

  get(connection: VoiceConnection) {
    const id = connection.joinConfig.guildId
    // Create new player if one doesn't exist
    if (!this.players.has(id)) {
      const player = new Player(connection)
      this.players.set(id, player)
    }
    // If player exists but the connection is different
    const player = this.players.get(id)
    invariant(player, 'player should exist for guild')
    // Attach player to connection if it's new
    player.attach(connection)
    return player
  }
}
