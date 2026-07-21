import type { PointsTable, TableHandler } from "#src/db-schema.d";
import type { CommandInterface } from "#src/event-handler/types.d";
import { updateLeaderboardRoles } from "#src/events/messageCreate/no-counter";
import { SlashCommandBuilder } from "discord.js"

export default {
	data: new SlashCommandBuilder().setName("my-points").setDescription("Check your points."),

	exec: async ({ client, interaction }: CommandInterface) => {
		try {
			await interaction.deferReply();

			const guildId = interaction.guildId;
			const userId = interaction.user.id;

			const [[results]] = await client.db.query<TableHandler<PointsTable, "points">>(
				`SELECT points
				FROM user_points
				WHERE guild_id = ? AND user_id = ?`,
				[guildId, userId]
			);
			const points = results?.points ?? 0;
			await interaction.editReply(`You have ${points} points!`);

			if (!interaction.guild) throw new Error("guild is null");
			updateLeaderboardRoles({guild: interaction.guild, pool: client.db});
		} catch (err) {
			console.log(String(err));
		}
	}
}
