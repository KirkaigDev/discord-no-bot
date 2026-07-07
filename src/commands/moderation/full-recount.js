import { SlashCommandBuilder } from "discord.js"
import path from "path";
import { scorePoints, updateLeaderboardRoles } from "#src/events/messageCreate/no-counter";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
	data: new SlashCommandBuilder().setName("recount-all-messages")
	.setDescription("Recounts all messages for times the bot was offline."),

	exec: async ({ interaction, client }) => {
		if (!projConf.discord.devs.includes(interaction.user.id)) {
			await interaction.reply({
				content: "This is only available for the devs",
				ephemeral: true,
			});
			return;
		}

		async function fetchAllMessages(channel) {
			let lastMessageId = null;

			while (true) {
				try {
					const options = { limit: 100 };
					if (lastMessageId) options.before = lastMessageId;

					const messages = await channel.messages.fetch(options);
					if (messages.size === 0) break;

					for (const msg of messages.values()) {

						if (msg.author.bot) continue;

						await scorePoints({
							text: msg.content,
							user: await msg.guild.members.fetch(msg.author.id),
							pool: client.db
						})
					}

					lastMessageId = messages.last().id;
					await sleep(1000);
				} catch (error) {
					if (error.status === 429) {
						const retryAfter = error.response?.headers?.get('retry-after') ?? 5;
						console.log(`Rate limited. Retrying after ${retryAfter}s...`);
						await sleep(retryAfter * 1000);
					} else {
						console.error(`Error in channel ${channel.name}:`, error);
						break;
					}
				}
			}
		}

		const interactionChannel = await client.channels.cache.get(interaction.channelId);

		interaction.reply("starting...")

		client.db.query("DELETE FROM `user_points` WHERE guild_id = ?", [interaction.guildId]);
		const guild = await client.guilds.fetch(interaction.guildId);
		const channels = await guild.channels.fetch();

		for (const [, channel] of channels) {
			if (!channel.isTextBased()) continue;

			interactionChannel.send(`Scanning #${channel.name}...`);
			await fetchAllMessages(channel);
			interactionChannel.send(`Fetched all messages from ${channel.name}`);
		}

		updateLeaderboardRoles({guild: interaction.guild, pool: client.db});
		interactionChannel.send('Done!');
	},
};
