import cron from "node-cron";
import type { CustomClient } from ".";

export async function startSchedules(client: CustomClient) {
	cron.schedule("37 21 * * *", async () => {
		const channel = client.channels.cache.get(projConf.discord.channelIds.general);
		if (!channel?.isSendable()) return;

		channel.send("Happy 2137!");
	}, {
		name: "Send happy 2137",
		timezone: "Europe/Warsaw",
	})
}
