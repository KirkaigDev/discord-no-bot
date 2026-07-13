import { configDotenv } from "dotenv";
configDotenv();
import "./test-config.js";

Math.bankersRounding = function (num, decimalPlaces) {
	var d = decimalPlaces || 0;
	var m = Math.pow(10, d);
	var n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
	var i = Math.floor(n), f = n - i;
	var e = 1e-8; // Allow for rounding errors in f
	var r = (f > 0.5 - e && f < 0.5 + e) ?
		((i % 2 == 0) ? i : i + 1) : Math.round(n);
	return d ? r / m : r;
};
Math.percentRounding = function (num) {
	const fraction = num - Math.floor(num);
	return (Math.random() < fraction) ? Math.ceil(num) : Math.floor(num);
};

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
