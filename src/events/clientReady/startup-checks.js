export default async (client) => { 
	const colour = projConf.textColours;
	console.log("Verifying config...");
	console.log("Finding guild...\n");

	const guild = await client.guilds.fetch(projConf.discord.guildId);

	const guildName = colour.cyan + guild.name + colour.reset;
	console.log(`Guild name: ${guildName}\n`);

	const errors = [];
	console.log("Checking roles:");
	for (let [key, value] of Object.entries(projConf.discord.roleIds)) {
		key = colour.magenta + key + colour.reset;
		try {
			console.log(`${colour.green}Role${colour.reset} "${key}" has name of ` +
			`"${colour.magenta + (await guild.roles.fetch(value)).name + colour.reset}"`);
		} catch {
			errors.push(`Could not find role "${key}" with id "${value}" in guild "${guildName}"`);
		}
	}

	console.log("\n");
	for (const error of errors) {
		console.error(`${colour.red}Error:${colour.reset} ${error}`);
	}

	console.log(`\n${colour.green}Logged in as ${colour.yellow + client.user.tag + colour.reset}`);
};
