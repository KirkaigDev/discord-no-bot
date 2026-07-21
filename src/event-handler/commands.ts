import fs from "fs";
import path from "path";
import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, REST, Routes } from "discord.js";
import type { CustomClient } from "#src/index";
import type { CommandInteractionFix, CommandInterface } from "#src/event-handler/types.d";

async function assignCommands(commands: any[]) {
	const token = process.env.TOKEN;

	const rest = new REST({ version: "10" }).setToken(token);

	await rest.put(
		Routes.applicationGuildCommands(
			projConf.discord.clientId, 
			projConf.discord.guildId
		),
		{ body: commands }
	);
}

type CommandExec = (args: CommandInterface) => Promise<void>;
interface CommandTree {
	[key: string]: CommandExec | CommandTree;
}

interface CommandFile {
	default: {
		data: any;
		exec: CommandExec;
	};
}

async function buildCommands(
	dirPath: string, 
	depth: number, 
	commandData: any[] | SlashCommandBuilder | SlashCommandSubcommandGroupBuilder, 
	commandFunctions: CommandTree
): Promise<void> {
	const dirContent = fs.readdirSync(dirPath, { withFileTypes: true })
	.filter(entry => entry.isDirectory() || entry.name.endsWith(".js") || entry.name.endsWith(".ts"));

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

				await buildCommands(entryPath, depth + 1, command, commandFunctions[entry.name] as CommandTree);
				commandData.push(command as any);
			} else {
				const subcommandGroup = new SlashCommandSubcommandGroupBuilder().setName(entry.name).setDescription("placeholder");
				commandFunctions[entry.name] = {};

				await buildCommands(entryPath, depth + 1, subcommandGroup, commandFunctions[entry.name] as CommandTree);
				commandData.options.push(subcommandGroup as any);
			}
		} else {
			const module = (await import(`file://${entryPath}`)) as CommandFile;
				const { data, exec } = module.default;

			commandFunctions[data.name] = exec;

			if (Array.isArray(commandData)) {
				commandData.push(data);
			} else {
				commandData.options.push(data);
			}
		}
	}
}

export async function setCommands(client: CustomClient) {
	const commandData: SlashCommandBuilder[] = [];
	const commandFunctions: CommandTree = {};

	await buildCommands(projConf.path.commands, 0, commandData, commandFunctions);

	await assignCommands(commandData);

	client.on("interactionCreate", (interaction) => {
		if (!interaction.isChatInputCommand()) return;

		let subcommandGroup: string | null = null;
		let subcommand: string | null = null;
		try { subcommandGroup = interaction.options.getSubcommandGroup() } catch {}
		try { subcommand = interaction.options.getSubcommand() } catch {}
		const commandId = [
			interaction.commandName,
			subcommandGroup,
			subcommand,
		].filter((i): i is string => i !== null);

		const matchingCommandFunction = commandId.reduce((i: any, key) => i[key], commandFunctions) as unknown as CommandExec;
		matchingCommandFunction({client: client, interaction: interaction as unknown as CommandInteractionFix });
	});
}
