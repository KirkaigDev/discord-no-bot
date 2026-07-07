import { pool } from "./db.js";

const dbName = pool.pool.config.connectionConfig.database;
if (dbName === undefined) throw new Error("database is undefined");

pool.pool.config.connectionConfig.database = undefined;

await pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`)
await pool.query(`USE \`${dbName}\`;`);

await pool.query(
	`CREATE TABLE user_points (
	guild_id varchar(20) NOT NULL,
	user_id varchar(20) NOT NULL,
	username varchar(32) NOT NULL,
	points bigint(20) UNSIGNED NOT NULL DEFAULT 0
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
)
