import { configDotenv } from "dotenv";
configDotenv();
import "./test-config.js";

import { Client, IntentsBitField } from "discord.js";

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.DirectMessages,
	],
});

import { pool } from "./db.js";
client.db = pool;

import { setEvents } from "./event-handler/events.js";
await setEvents(client);

import { setCommands } from "./event-handler/commands.js";
await setCommands(client);

client.login(process.env.TOKEN);
