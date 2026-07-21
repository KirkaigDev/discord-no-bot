import { ClientEvents, CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { CustomClient } from "#src/index";

export type EventArguments<T extends keyof ClientEvents> = ClientEvents[T];
export type EventHandler<T extends keyof ClientEvents> = (client: CustomClient, ...args: EventArguments<T>) => Promise<void>;

export interface CommandInteractionFix extends CommandInteraction {
	options: CommandInteractionOptionResolver;
}
export interface CommandInterface {
	client: CustomClient;
	interaction: CommandInteractionFix;
}
