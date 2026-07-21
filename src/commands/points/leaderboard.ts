import type { PointsTable, TableHandler } from "#src/db-schema.d";
import type { CommandInterface } from "#src/event-handler/types.d";
import { updateLeaderboardRoles } from "#src/events/messageCreate/no-counter";
import { SlashCommandBuilder, MessageFlags } from "discord.js"

const linesAmount = 10;

export default {
	data: new SlashCommandBuilder().setName("leaderboard").setDescription(`Check the top ${linesAmount} on the leaderboard.`),

	exec: async ({ client, interaction }: CommandInterface) => {
		try {
			await interaction.deferReply();

			const guildId = interaction.guildId;

			const [results] = await client.db.query<TableHandler<PointsTable, "username" | "points">>(
				`SELECT username, points
				FROM user_points
				WHERE guild_id = ?
				ORDER BY points DESC
				LIMIT ?`,
				[guildId, linesAmount]
			);

			if (results.length === 0) {
				await interaction.editReply({
					content: "No leaderboard data yet.",
					flags: MessageFlags.Ephemeral as any,
				});
				return;
			}

			const lines = results.map((r, i) => {
				const name = r.username ?? "Unknown";
				const pts = Number(r.points) || 0;
				return `${i + 1}. ${name} — ${pts}`;
			});

			await interaction.editReply({
				content: `**Top ${linesAmount} Leaderboard**\n${lines.join("\n")}`,
				allowedMentions: { parse: [] },
			});

			if (!interaction.guild) throw new Error("guild is null");

			updateLeaderboardRoles({guild: interaction.guild, pool: client.db});
		} catch (err) {
			console.log(String(err));
		}
	}
}
