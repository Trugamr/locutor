import { Client, Events, GatewayIntentBits, REST } from 'discord.js'
import { Container } from 'inversify'
import Bot from './bot'
import { Disconnect } from './commands/disconnect'
import Join from './commands/join'
import Ping from './commands/ping'
import ClientReady from './events/client-ready'
import InteractionCreate from './events/interaction-create'
import VoiceStateUpdate from './events/voice-state-update'
import Config from './services/config'
import { Logger, logger } from './services/logger'
import { Voice } from './services/voice'
import Command from './structs/command'
import Event from './structs/event'
import TYPES from './types'

const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]

const container = new Container()

// Logger
container.bind<Logger>(TYPES.Logger).toConstantValue(logger)

// Config
container.bind<Config>(TYPES.Config).to(Config).inSingletonScope()

// Services
container.bind<Voice>(TYPES.Voice).to(Voice).inSingletonScope()

// Bot
const config = container.get<Config>(TYPES.Config)
container
  .bind<REST>(TYPES.Rest)
  .toConstantValue(new REST({ version: '10' }).setToken(config.get('DISCORD_BOT_TOKEN')))
container.bind<Client>(TYPES.Client).toConstantValue(new Client({ intents }))
container.bind<Bot>(TYPES.Bot).to(Bot).inSingletonScope()

// Events
container.bind<Event<Events.ClientReady>>(TYPES.Event).to(ClientReady).inSingletonScope()
container
  .bind<Event<Events.InteractionCreate>>(TYPES.Event)
  .to(InteractionCreate)
  .inSingletonScope()
container
  .bind<Event<Events.VoiceStateUpdate>>(TYPES.Event)
  .to(VoiceStateUpdate)
  .inSingletonScope()

// Commands
const commands = [Ping, Join, Disconnect]
for (const command of commands) {
  container.bind<Command>(TYPES.Command).to(command).inSingletonScope()
}

export default container
