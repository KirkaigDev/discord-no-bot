import { pool } from "#src/db";
import "#src/test-config";
import fs from "fs";
import path from "path";

console.log("generating schema...");

const dbName = pool.pool.config.connectionConfig.database;

const [columns] = await pool.query(
	`SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
	FROM INFORMATION_SCHEMA.COLUMNS 
	WHERE TABLE_SCHEMA = '${dbName}'`
);

const tables = {};

const typeMap = {
	"tinyint": "number",
	"smallint": "number",
	"mediumint": "number",
	"int": "number",
	"bigint": "number",
	"float": "number",
	"double": "number",
	"decimal": "number",
	"bit": "number",

	"enum": "string",
	"char": "string",
	"binary": "string",
	"varchar": "string",
	"varbinary": "string",
	"tinyblob": "string",
	"tinytext": "string",
	"blob": "string",
	"text": "string",
	"mediumblob": "string",
	"mediumtext": "string",
	"longblob": "string",
	"longtext": "string",
	"xmltype": "string",
	"set": "string",
	"inet6": "string",
	"uuid": "string",

	"date": "Date",
	"time": "Date",
	"datetime": "Date",
	"timestamp": "Date",
	"year": "Date",
};

columns.forEach(col => {
	if (!tables[col.TABLE_NAME]) tables[col.TABLE_NAME] = [];

	const tsType = typeMap[col.DATA_TYPE] || "any";
	const isNullable = col.IS_NULLABLE === "YES" ? " | null" : "";

	tables[col.TABLE_NAME].push(`\t${col.COLUMN_NAME}: ${tsType}${isNullable};`);
});

let output = `import { RowDataPacket } from "mysql2";\n\n`;

for (const [tableName, properties] of Object.entries(tables)) {
	const interfaceName = tableName.split("_")
		.map(w => (w === "user") ? "" : (w.charAt(0).toUpperCase() + w.slice(1)) ).join("") + "Table";

	output += `export interface ${interfaceName} extends RowDataPacket {\n`;
	output += properties.join("\n");
	output += "\n}\n\n";
}

fs.writeFileSync(path.join(projConf.path.root, "src/db-schema.ts"), output);
await pool.end();
console.log("schema has been generated");
