import type { EventHandler } from "#src/event-handler/types.d";
import type { CustomClient } from "#src/index";

export default (async (client: CustomClient) => { 
	try {
		const colour = projConf.textColours;
		console.log("Verifying config...\n");

		const guild = await client.guilds.fetch(projConf.discord.guildId);

		const guildName = colour.cyan + guild.name + colour.reset;
		console.log(`Guild name: ${guildName}\n`);

		const errors = [];
		console.log("Checking roles:");
		for (let [key, value] of Object.entries(projConf.discord.roleIds)) {
			key = colour.magenta + key + colour.reset;
			const role = (await guild.roles.fetch(value));
			try {
				if (!role) throw new Error
					console.log(`${colour.green}Role${colour.reset} "${key}" has name of ` +
								`"${colour.magenta + role.name + colour.reset}"`);
			} catch {
				errors.push(`Could not find role "${key}" with id "${value}" in guild "${guildName}"`);
			}
		}

		console.log("\n");
		for (const error of errors) {
			console.error(`${colour.red}Error:${colour.reset} ${error}`);
		}

		if (!client.user) throw new Error("Failed to log in.");
		console.log(`\n${colour.green}Logged in as ${colour.yellow + client.user.tag + colour.reset}`);
	} catch(err) {
		console.error(`Error whilst verifying the config: ` + ((err instanceof Error) ? err.stack : err));
	};
}) as EventHandler<"clientReady">;
