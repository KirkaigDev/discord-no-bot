import { DiscordAPIError, FetchMessagesOptions, RateLimitError, SlashCommandBuilder, TextChannel } from "discord.js"
import { scorePoints, updateLeaderboardRoles } from "#src/events/messageCreate/no-counter";
import type { CommandInteractionFix, CommandInterface } from "#src/event-handler/types.d";
import type { CustomClient } from "#src/index";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FetchReturn {
	occuredErrors: boolean;
	hitErrorLimit: boolean;
}
async function fetchChannelMessages(
	channel: TextChannel,
	interaction: CommandInteractionFix,
	client: CustomClient,
): Promise<FetchReturn> {
	let occuredErrors = false;
	let lastMessageId: string | null = null;
	let rateLimited: boolean = false;

	const fetchOptions: FetchMessagesOptions = { limit: 100 };
	let continuousErrorCount: number = 0;
	// how many back to back errors trigger function return
	const quitOnErrorAmount:number = 5;

	while (true) {
		try {
			if (lastMessageId) fetchOptions.before = lastMessageId;
			if (rateLimited) {
				await channel.send("Was rate limited, trying again...");
				rateLimited = false;
			};

			const channelMessages = await channel.messages.fetch(fetchOptions);

			for (const msg of channelMessages.values()) {
				try {
					if (msg.author.bot) {
						lastMessageId = msg.id;
						continue;
					}

					await scorePoints({
						text: msg.content,
						user: msg.guild.members.cache.get(msg.author.id) || await msg.guild.members.fetch(msg.author.id),
						pool: client.db,
						translationStatus: interaction.options.getBoolean("translation-toggle")
					});

					lastMessageId = msg.id;
				} catch(err) {
					if (err instanceof RateLimitError) {
						console.log("Command 'recount-all-messages' was rate limited");
						rateLimited = true;

						await sleep(err.retryAfter);
						break;
					} else if ((err instanceof DiscordAPIError) && (err.code === 10007)) {
						// Don't log unknown member errors
						continue;
					} else{
						console.error((err instanceof Error) ? err.stack : err);
						occuredErrors = true;
						if (++continuousErrorCount === quitOnErrorAmount) {
							console.error(`Hit continuous error limit during recount for all messages`);
							return { occuredErrors: true, hitErrorLimit: true };
						};
					};
				}
			};

			if (
				((fetchOptions.limit) && (channelMessages.size < fetchOptions.limit)) ||
				(channelMessages.size === 0)
			) return { occuredErrors: occuredErrors, hitErrorLimit: false };

			continuousErrorCount = 0;
		} catch(err) {
			if (err instanceof RateLimitError) {
				console.log("Command 'recount-all-messages' was rate limited");
				rateLimited = true;

				await sleep(err.retryAfter);
			} else {
				occuredErrors = true;
				console.error((err instanceof Error) ? err.stack : err);
				if (++continuousErrorCount === quitOnErrorAmount) return { occuredErrors: true, hitErrorLimit: true };
			};
		};
	};
};

export default {
	data: new SlashCommandBuilder().setName("recount-all-messages")
	.setDescription("Recounts all messages for times the bot was offline.")
	.addBooleanOption((opt) => opt.setName("translation-toggle")
					  .setDescription("Choose whether or not the translator gets used")
					  .setRequired(true)
	),

	exec: async ({ interaction, client }: CommandInterface) => {
		if (!projConf.discord.devs.includes(interaction.user.id)) {
			await interaction.reply({
				content: "This is only available for the devs",
				ephemeral: true,
			});
			return;
		}

		const replyPromise = interaction.deferReply();

		try {
			if (!interaction.guildId) throw new Error("guild is null");

			const interactionChannelFetchPromise = client.channels.fetch(interaction.channelId);
			const guild = await client.guilds.fetch(interaction.guildId);
			const channels = guild.channels.fetch();

			await replyPromise;
			const editReplyPromise = interaction.editReply("Starting...");

			const tableDeletePromise = client.db.query(
				"DELETE FROM `user_points` WHERE guild_id = ?",
				[interaction.guildId]
			);

			const interactionChannel = await interactionChannelFetchPromise as TextChannel;

			await tableDeletePromise;
			await interactionChannel.send("Cleared database table entries of this guild");
			let fetchSuccess = true;
			for (const [, channel] of await channels) {
				if (!(channel instanceof TextChannel)) continue;

				await editReplyPromise;

				if (!channel) continue;

				client.recountingChannelId = channel.id;

				const scanMsgsPromise = interactionChannel.send(`Scanning #${channel.name}...`);
				const fetchMessagesPromise = fetchChannelMessages(channel, interaction, client);

				await scanMsgsPromise;
				try {
					if ((await fetchMessagesPromise).occuredErrors) fetchSuccess = false;
					client.recountingChannelId = "";
					await interactionChannel.send(`Fetched all messages from ${channel.name}!`);
				} catch(e) {
					client.recountingChannelId = "";
					await interactionChannel.send(`Failed to fetch messages of #${channel.name}, error: ${e}`)
				};
			};

			await updateLeaderboardRoles({ guild: guild, pool: client.db });
			if (fetchSuccess) {
				await interactionChannel.send("Command finished successfully")
			} else {
				await interactionChannel.send("Command finished with some errors")
			};
		} catch(err) {
			console.error((err instanceof Error) ? err.stack : err);

			try {
				await replyPromise;
				await interaction.editReply(`An error has occured: ${err}`);
			} catch(err) {
				console.error("Could not send error in discord: " + ((err instanceof Error) ? err.stack : err))
			};
		};

	},
};
