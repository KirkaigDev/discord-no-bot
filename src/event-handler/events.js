import fs from "fs";
import path from "path";

async function attachEventFile(client, filePath, eventName) {
	try {
		const module = await import(`file://${filePath}`);

		const execute = module.default;
		if (typeof execute !== "function") { throw new Error("does not have an exported default of type function."); }

		client.on(eventName, async (...args) => await execute(client, ...args));
	} catch (err) {
		console.error(`Failed to attach event file, ${filePath}: ${err}`)
	}
}

export async function setEvents(client) {
	const eventsDirPath = projConf.path.events;

	const events = fs.readdirSync(eventsDirPath, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(dir => dir.name);

	for (const eventName of events) {
		const eventFilePaths = fs.readdirSync(path.join(eventsDirPath, eventName), { withFileTypes: true })
		.filter(entry => entry.isFile() && entry.name.endsWith(".js"))
		.map(file => path.join(file.parentPath, file.name));

		for (const eventFilePath of eventFilePaths) {
			await attachEventFile(client, eventFilePath, eventName);
		}
	}
}
