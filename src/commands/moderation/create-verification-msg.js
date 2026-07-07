import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } from "discord.js"

export default {
	data: new SlashCommandBuilder().setName("create-verify-msg").setDescription("Create the verification message."),

	exec: async ({ client, interaction }) => {
		if (!projConf.discord.devs.includes(interaction.user.id)) {
			await interaction.reply({
				content: "This is only available for the devs",
				ephemeral: true,
			});
			return;
		}

		try {
			interaction.deferReply({
				flags: MessageFlags.Ephemeral,
			});

			const roles = [{ id: projConf.discord.roleIds.negator, label: '"No"' }];
			const channel = await client.channels.cache.get(interaction.channelId);

			const row = new ActionRowBuilder();

			roles.forEach((role) => {
				row.components.push(
					new ButtonBuilder()
					.setCustomId(role.id)
					.setLabel(role.label)
					.setStyle(ButtonStyle.Primary)
				);
			});

			channel.send({
				content:
				'Click "No" to agree with the rules and accept the word no into your heart.',
				components: [row],
			});
			interaction.editReply("Message sent.");
		} catch (err) {
			console.log(`Error creating verification message: ${String(err)}`);
		}
	}
}
