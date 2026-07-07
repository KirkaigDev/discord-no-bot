import { updateLeaderboardRoles } from "#src/events/messageCreate/no-counter";
import { SlashCommandBuilder } from "discord.js"

export default {
	data: new SlashCommandBuilder().setName("my-points").setDescription("Check your points."),

	exec: async ({ client, interaction }) => {
		try {
			await interaction.deferReply();

			const guildId = interaction.guildId;
			const userId = interaction.user.id;

			const [results] = await client.db.query(
				`SELECT points
				FROM user_points
				WHERE guild_id = ? AND user_id = ?`,
				[guildId, userId]
			);
			const points = results[0]?.points ?? 0;
			await interaction.editReply(`You have ${points} points!`);
			updateLeaderboardRoles({guild: interaction.guild, pool: client.db});
		} catch (err) {
			console.log(String(err));
		}
	}
}
