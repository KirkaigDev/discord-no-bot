import { MessageFlags } from "discord.js";

export default async (_, interaction) => {
	if (!interaction.isButton()) return;
	if (interaction.message.content !== `Click "No" to agree with the rules and accept the word no into your heart.`) return;

	const role = interaction.guild.roles.cache.get(projConf.discord.roleIds.negator);

	const hasRole = interaction.member.roles.cache.has(role.id);
	const lesserRoles = [projConf.discord.roleIds.firstWarning];

	await interaction.deferReply({
		flags: MessageFlags.Ephemeral,
	});

	const hasLesserRole = lesserRoles.some((roleId) =>
		interaction.member.roles.cache.has(roleId)
	);

	if (!role) {
		interaction.editReply("Role doesn't exist.");
	}

	if (hasRole) {
		interaction.editReply("You already have the role.");
		return;
	}

	if (hasLesserRole) {
		interaction.editReply("You can't get this role.");
		return;
	}

	await interaction.member.roles.add(role);
	interaction.editReply("You now have access to the server.");
}
