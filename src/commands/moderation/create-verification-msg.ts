import type { CommandInterface } from "#src/event-handler/types.d";
import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, TextChannel } from "discord.js"

export default {
	data: new SlashCommandBuilder().setName("create-verify-msg").setDescription("Create the verification message."),

	exec: async ({ client, interaction }: CommandInterface) => {
		if (!projConf.discord.devs.includes(interaction.user.id)) {
			await interaction.reply({
				content: "This is only available for the devs",
				ephemeral: true,
			});
			return;
		}

		try {
			const deferPromise = interaction.deferReply({
				flags: MessageFlags.Ephemeral,
			});

			const roles = [{ id: projConf.discord.roleIds.negator, label: `"No"` }];
			const channel = (
				client.channels.cache.get(interaction.channelId) ??
				await client.channels.fetch(interaction.channelId)) as TextChannel;

			if (!channel) throw new Error("Could not find channel");

			const row = new ActionRowBuilder<ButtonBuilder>();

			roles.forEach((role) => {
				row.components.push(
					new ButtonBuilder()
					.setCustomId(role.id)
					.setLabel(role.label)
					.setStyle(ButtonStyle.Primary)
				);
			});

			await channel.send({
				content:
				'Click "No" to agree with the rules and accept the word no into your heart.',
				components: [row],
			});
			await deferPromise;
			await interaction.editReply("Message sent.");
		} catch (err) {
			console.log(`Error creating verification message: ` + ((err instanceof Error) ? err.stack : err));
		}
	}
}
