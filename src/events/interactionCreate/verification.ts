import type { EventHandler } from "#src/event-handler/types.d";
import { MessageFlags } from "discord.js";

export default (async (_, interaction) => {
	if (!interaction.isButton()) return;
	if (interaction.message.content !== `Click "No" to agree with the rules and accept the word no into your heart.`) return;

	const guild = interaction.guild;
	if (!guild) throw new Error("interaction.guild is null");
	let role = guild.roles.cache.get(projConf.discord.roleIds.negator) ?? await guild.roles.fetch(projConf.discord.roleIds.negator);

	if (!role) throw new Error("role is null");

	const member = await guild.members.fetch(interaction.user.id);

	const hasRole = member.roles.cache.has(role.id);
	const lesserRoles = [projConf.discord.roleIds.firstWarning];

	await interaction.deferReply({
		flags: MessageFlags.Ephemeral,
	});

	const hasLesserRole = lesserRoles.some((roleId) =>
		member.roles.cache.has(roleId)
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

	await member.roles.add(role);
	interaction.editReply("You now have access to the server.");
}) as EventHandler<"interactionCreate">;
