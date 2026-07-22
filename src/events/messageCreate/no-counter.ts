import type { PointsTable, TableHandler } from "#src/db-schema.d";
import type { EventHandler } from "#src/event-handler/types.d";
import type { CustomClient } from "#src/index";
import { Guild, GuildMember } from "discord.js";
import { configDotenv } from "dotenv";
configDotenv();

interface LeaderboardRoles {
	pool: CustomClient["db"];
	guild: Guild
};

export async function updateLeaderboardRoles({pool, guild}: LeaderboardRoles) {
	const [leaderboardDbTopFive] = await pool.query<TableHandler<PointsTable, "user_id">>(
		`SELECT user_id
		FROM user_points
		WHERE guild_id = ?
		ORDER BY points DESC
		LIMIT 5`,
		[guild.id]
	);

	async function getRole(roleName: keyof typeof projConf.discord.roleIds) {
		const roleId = projConf.discord.roleIds[roleName];
		return guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId);
	};

	const roles = {
		topThreeArray: [ 
			await getRole("leaderboardFirst"),
			await getRole("leaderboardSecond"),
			await getRole("leaderboardThird")
		],
		topFive: await getRole("leaderboardTopFive"),
	}

	for (let i: number = 0; i < 3; i++) {
		const role = roles.topThreeArray[i];
		if (!role) continue;
		const dbRoleUserId = leaderboardDbTopFive[i].user_id;
		let correctlyAssigned: boolean = false;

		role.members.forEach(async (roleMember) => {
			if (roleMember.user.id !== dbRoleUserId) {
				await roleMember.roles.remove(role);
			} else {
				correctlyAssigned = true;
			};
		});

		if (!correctlyAssigned) {
			const assignMember = guild.members.cache.get(dbRoleUserId) || await guild.members.fetch(dbRoleUserId);
			await assignMember.roles.add(role);
		};
	};

	const dbUserIds = leaderboardDbTopFive.slice(0, 5).map(entry => entry.user_id);
	const topFiveUserIds = roles.topFive?.members.map((member) => member.user.id);
	dbUserIds.forEach(async (userId) => {
		if (!topFiveUserIds?.includes(userId)) {
			const member = guild.members.cache.get(userId);
			if (member && roles.topFive) {
				await member.roles.add(roles.topFive);
			};
		};
	});

	if (!roles.topFive) return;
	topFiveUserIds?.forEach(async (userId) => {
		const member = guild.members.cache.get(userId);
		if (!dbUserIds.includes(userId) && roles.topFive) await member?.roles.remove(roles.topFive);
	});
}

// translates using libretranslate
async function translate(text: string) {
	try {
		const trans = await fetch(`http://${projConf.translator.host}:${projConf.translator.port}/translate`, {
			method: "POST",
			body: JSON.stringify({
				q: text,
				source: "auto",
				target: "en",
				format: "text",
				alternatives: 2, // there is a bug where sometimes setting it to 1 doesn't work
				api_key: ""
			}),
			headers: { "Content-Type": "application/json" }
		});

		return (await trans.json());
	} catch (e) {
		console.error(`translate error: ${e}`);
	}
}

async function countWord(word: string, text: string) {
	let count = 0;
	let pos = 0;
	const moddedText = text.toLowerCase();

	while ((pos = moddedText.indexOf(word, pos)) !== -1) {
		count++;
		pos += word.length;
	};
	return count;
}

interface ScorePoints {
	word?: string;
	text: string;
	user: GuildMember;
	pool: CustomClient["db"];
	translationStatus?: boolean | null;
};
interface ScorePointsReturn {
	count: number;
	score: number;
};

export async function scorePoints({ word="no", text, user, pool, translationStatus=null}: ScorePoints): Promise<ScorePointsReturn> {
	let count: number = await countWord(word, text);

	let enableTranslator = translationStatus;
	if (translationStatus === null) enableTranslator = projConf.translator.enable;

	if (enableTranslator) {
		const transData = await translate(text);

		if ((transData?.detectedLanguage?.language) && (transData.detectedLanguage.language !== "en")) {
			let translated = transData.translatedText;

			// for some reason it doesn't always translate on the first response but works on the second
			if ((translated === text) && (transData.alternatives[0])) {
				translated = transData.alternatives[0]
			}
			if (translated) count = count + await countWord(word, translated); // I purposely added them together
		}
	}

	let score = count;

	if (user.roles.cache.has(projConf.discord.roleIds.peopleDisliked)) {
		score = Math.percentRounding(score / 2);
	} else {
		if (user.roles.cache.has(projConf.discord.roleIds.peopleLiked)) {
			score = score * 2;
		}
	}

	const guildId = user.guild.id;
	const userId = user.user.id;
	const username = user.user.username;

	await pool.query(
		`INSERT INTO user_points(guild_id, user_id, username, points)
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
		points = points + VALUES(points),
		username = VALUES(username)`,
		[guildId, userId, username, score]
	);

	return { count: count, score: score };
}

export default (async(client, msg) => {
	if (msg.author.bot) return;
	if (client.recountingIsOn && !client.recountedChannelIds.includes(msg.channelId)) return;

	const word = "no";

	if (!msg.guild) throw new Error(`no msg.guild`);

	if (!msg.content) return;
	const values = await scorePoints({
		text: msg.content,
		user: msg.guild.members.cache.get(msg.author.id) || await msg.guild.members.fetch(msg.author.id),
		pool: client.db
	});

	if (msg.channelId === projConf.discord.spamChannelId) return;

	let content =`${word} x${values.count}`;
	if (values.count !== values.score) content = `${word} x${values.count}(points added: ${values.score})`;

	if ((values.score === 0) && (values.count === 0)) return;

	msg.reply({
		content: content,
		allowedMentions: { repliedUser: false },
	});

	updateLeaderboardRoles({guild: msg.guild, pool: client.db});
}) as EventHandler<"messageCreate">;
