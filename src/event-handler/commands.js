import fs from "fs";
import path from "path";
import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, REST, Routes } from "discord.js";

async function assignCommands(commands) {
	const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

	await rest.put(
		Routes.applicationGuildCommands(
			projConf.discord.clientId,
			projConf.discord.guildId
		),
		{ body: commands }
	);
}

async function buildCommands(dirPath, depth, commandData, commandFunctions) {
	const dirContent = fs.readdirSync(dirPath, { withFileTypes: true })
		.filter(entry => entry.isDirectory() || entry.name.endsWith(".js"));

	for (const entry of dirContent) {
		const entryPath = path.join(dirPath, entry.name);

		if (entry.isDirectory()) {
			if ((depth < projConf.eventManager.commandDepth) || !projConf.eventManager.subcommands) {
				await buildCommands(entryPath, depth + 1, commandData, commandFunctions);
				continue;
			}

			if (Array.isArray(commandData)) {
				const command = new SlashCommandBuilder().setName(entry.name).setDescription("placeholder");
				commandFunctions[entry.name] = {};
				const innerCommandFunction = commandFunctions[entry.name];

				await buildCommands(entryPath, depth + 1, command, innerCommandFunction);
				commandData.push(command);
			} else {
				const subcommandGroup = new SlashCommandSubcommandGroupBuilder().setName(entry.name).setDescription("placeholder");
				commandFunctions[entry.name] = {};
				const innerCommandFunction = commandFunctions[entry.name];

				await buildCommands(entryPath, depth + 1, subcommandGroup, innerCommandFunction);
				commandData.options.push(subcommandGroup);
			}
		} else {
			const module = await import(`file://${entryPath}`);
			const data = module.default.data;

			commandFunctions[data.name] = module.default.exec;

			if (Array.isArray(commandData)) {
				commandData.push(data);
			} else {
				commandData.options.push(data);
			}
		}
	}
}

export async function setCommands(client) {
	const commandData = [];
	const commandFunctions = {};

	await buildCommands(projConf.path.commands, 0, commandData, commandFunctions);

	await assignCommands(commandData);
	
	client.on("interactionCreate", (interaction) => {
		if (!interaction.isChatInputCommand()) return;

		const commandId = [interaction.commandName, interaction.options._group, interaction.options._subcommand]
			.filter(key => key !== null);

		const command = commandId.reduce((i, key) => i[key], commandFunctions);
		command({client: client, interaction: interaction});
	});
}
