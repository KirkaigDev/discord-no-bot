import { updateLeaderboardRoles } from "#src/events/messageCreate/no-counter";
import { SlashCommandBuilder } from "discord.js"

export default {
	data: new SlashCommandBuilder().setName("user-points").setDescription("Check a user's points.")
	.addUserOption((opt) => opt.setName("user").setDescription("The user to check points for.")
		.setRequired(true)
	),

	exec: async ({ client, interaction }) => {
		try {
			await interaction.deferReply();

			const guildId = interaction.guildId;
			const userId = interaction.options.getUser("user").id;

			const [results] = await client.db.query(
				`SELECT points
				FROM user_points
				WHERE guild_id = ? AND user_id = ?`,
				[guildId, userId]
			);
			const points = results[0]?.points ?? 0;
			await interaction.editReply(`${targetUser.username} has ${String(points)} points!`);
			updateLeaderboardRoles({guild: interaction.guild, pool: client.db});
		} catch (err) {
			console.error(String(err));
		}
	}
}
