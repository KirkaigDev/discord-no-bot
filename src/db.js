import mysql from "mysql2/promise";
import { configDotenv } from "dotenv";
configDotenv();

export const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: "discord_bot"
});
