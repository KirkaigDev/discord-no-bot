import type { PointsTable, TableHandler } from "#src/db-schema.d";
import type { CommandInterface } from "#src/event-handler/types.d";
import { updateLeaderboardRoles } from "#src/events/messageCreate/no-counter";
import { SlashCommandBuilder } from "discord.js"

export default {
	data: new SlashCommandBuilder().setName("user-points").setDescription("Check a user's points.")
	.addUserOption((opt) => opt.setName("user").setDescription("The user to check points for.")
		.setRequired(true)
	),

	exec: async ({ client, interaction }: CommandInterface) => {
		try {
			await interaction.deferReply();

			const guildId = interaction.guildId;
			const user = interaction.options.getUser("user");
			if (!user) throw new Error("couldn't get user");

			const [[results]] = await client.db.query<TableHandler<PointsTable, "points">>(
				`SELECT points
				FROM user_points
				WHERE guild_id = ? AND user_id = ?`,
				[guildId, user.id]
			);
			const points = results?.points ?? 0;
			await interaction.editReply(`${user.username} has ${String(points)} points!`);

			if (!interaction.guild) throw new Error("interaction.guild is null");
			updateLeaderboardRoles({guild: interaction.guild, pool: client.db});
		} catch (err) {
			console.error(String(err));
		}
	}
}
