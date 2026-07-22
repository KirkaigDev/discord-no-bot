import { configDotenv } from "dotenv";
configDotenv();
import "#src/config";

export class TranslationCache {
	private cache = new Map<string, string>();
	private currentSizeBytes = 0;
	private readonly maxSizeBytes: number;

	constructor(maxMiB: number) {
		this.maxSizeBytes = Math.floor(maxMiB * 1024 * 1024);
	}

	private calculateSize(str: string): number {
		return new TextEncoder().encode(str).length;
	}

	public get(text: string): string | undefined {
		const translation = this.cache.get(text);
		if (!translation) return;

		this.cache.delete(text);
		this.cache.set(text, translation);

		return translation;
	}

	public store(text: string, translated: string): void {
		if (this.cache.has(text)) {
			const oldVal = this.cache.get(text)!;
			this.currentSizeBytes -= (this.calculateSize(text) + this.calculateSize(oldVal));
			this.cache.delete(text);
		}

		const entrySize = this.calculateSize(text) + this.calculateSize(translated);

		while (this.currentSizeBytes + entrySize > this.maxSizeBytes) {
			const oldestKey = this.cache.keys().next().value;
			if (!oldestKey) break;
			const oldestValue = this.cache.get(oldestKey)!;

			this.currentSizeBytes -= (this.calculateSize(oldestKey) + this.calculateSize(oldestValue));
			this.cache.delete(oldestKey);
		}

		this.cache.set(text, translated);
		this.currentSizeBytes += entrySize;
	}
};

// I found this on a forum and it seems like the popular answer,
// feel free to improve upon it if you can even comprehend it with the poorly named variables
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
// this is something I made for the game so that fractions still have effect whilst using integer values
Math.percentRounding = function (num) {
	const fraction = num - Math.floor(num);
	return (Math.random() < fraction) ? Math.ceil(num) : Math.floor(num);
};

import { Client, IntentsBitField } from "discord.js";

import { pool } from "#src/db";

export interface CustomClient extends Client {
	db: typeof pool;
	recountingIsOn: boolean;
	recountedChannelIds: string[];
	translationCache: TranslationCache;
};

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.DirectMessages,
	],
}) as CustomClient;
client.db = pool;
client.recountingIsOn = false;
client.recountedChannelIds = [];
client.translationCache = new TranslationCache(10);

import { setEvents } from "#src/event-handler/events";
await setEvents(client);

import { setCommands } from "#src/event-handler/commands";
await setCommands(client);

client.login(process.env.TOKEN);
