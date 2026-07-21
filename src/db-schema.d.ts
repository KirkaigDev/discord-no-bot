import { RowDataPacket } from "mysql2";

export type TableHandler<T extends RowDataPacket, K extends keyof T> = (Pick<T, K> & RowDataPacket)[];

export interface RpgExpTable extends RowDataPacket {
	discord_user_id: string;
	discord_username: string;
	experience: number;
}

export interface PointsTable extends RowDataPacket {
	guild_id: string;
	user_id: string;
	username: string;
	points: number;
}

export interface RpgLevelsTable extends RowDataPacket {
	discord_user_id: string;
	discord_username: string;
	health: number;
	defence: number;
	stamina: number;
	mana: number;
	damage: number;
}

export interface RpgItemsTable extends RowDataPacket {
	discord_user_id: string;
	discord_username: string;
	sticks: number;
	void_fish: number;
	nullions: number;
	nullstone: number;
	null_sword: number;
	standard_shield: number;
}

export interface RpgStatsTable extends RowDataPacket {
	discord_user_id: string;
	discord_username: string;
	level: number;
	health: number;
	defence: number;
	stamina: number;
	mana: number;
	damage: number;
}

export interface RpgEquipmentTable extends RowDataPacket {
	discord_user_id: string;
	discord_username: string;
	head: string | null;
	chest: string | null;
	legs: string | null;
	feet: string | null;
	neck: string | null;
	ring_left: string | null;
	ring_right: string | null;
	hand_right: string | null;
	hand_left: string | null;
}

export interface RpgCharacterTable extends RowDataPacket {
	discord_user_id: string;
	discord_username: string;
	character_name: string;
	character_sex: string;
}

