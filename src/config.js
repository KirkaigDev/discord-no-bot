import { fileURLToPath } from "url";
import path from "path";
import { configDotenv } from "dotenv";
configDotenv()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

global.projConf = {
	discord: {
		guildId: "1199539381397114960",
		clientId: "1216970095331512461",
		devs: ["726293202642010144"],
		spamChannelId: "1200739710490923079",
		roleIds: {
			negator: "1409818858096689192",

			leaderboardFirst: "1409843374806138930",
			leaderboardSecond: "1409843542657990707",
			leaderboardThird: "1452389562247544843",
			leaderboardTopFive: "1452389696968851476",

			admin: "1200521815844474960",
			peopleDisliked: "1476516310124073091",
			peopleLiked: "1518646552636428318",
			firstWarning: "1396596327265337366",
		},
	},

	path: {
		root: rootDir,
		commands: path.join(rootDir, "src/commands"),
		events: path.join(rootDir, "src/events"),
	},

	eventManager: {
		commandDepth: 1,
		subcommands: true,
	},

	// uses libretranslate
	translator: {
		enable: false,
		host: process.env.DB_HOST,
		port: "5000",
	},
}
