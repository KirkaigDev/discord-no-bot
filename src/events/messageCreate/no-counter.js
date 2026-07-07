import { configDotenv } from "dotenv";
configDotenv();

export async function updateLeaderboardRoles({pool, guild}) {
	const [results] = await pool.query(
		`SELECT user_id
		FROM user_points
		WHERE guild_id = ?
		ORDER BY points DESC
		LIMIT 5`,
		[guild.id]
	);

	const first = await guild.roles.fetch(projConf.discord.roleIds.leaderboardFirst);
	const second = await guild.roles.fetch(projConf.discord.roleIds.leaderboardSecond);
	const third = await guild.roles.fetch(projConf.discord.roleIds.leaderboardThird);
	const top3 = [first, second, third];
	const top5 = await guild.roles.fetch(projConf.discord.roleIds.leaderboardTopFive);

	for (let i = 0; i < 3; i++) {
		const userId = results[i]?.user_id ?? 0;
		if (userId === 0) continue;

		let user;
		try {
			user = await guild.members.fetch(userId);
		} catch (_) {
			continue;
		}

		if (!user.roles.cache.has(top3[i].id)) {
			await user.roles.add(top3[i]);
		}

		for (const [, member] of top3[i].members) {
			if (member.id !== userId) {
				await member.roles.remove(top3[i]);
			}
		}
	}

	const top5Ids = results.slice(0, 5).map(r => r.user_id);

	for (const userId of top5Ids) {
		let user;
		try {
			user = await guild.members.fetch(userId);
		} catch (_) {
			continue;
		}

		if (!user.roles.cache.has(top5.id)) {
			await user.roles.add(top5);
		}
	}

	for (const [, member] of top5.members) {
		if (!top5Ids.includes(member.id)) {
			await member.roles.remove(top5);
		}
	}
}

// translates using libretranslate
async function translate(text) {
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

function countWord(word, text) {
	let count = 0;
	let pos = 0;
	const moddedText = text.toLowerCase();

	while ((pos = moddedText.indexOf(word, pos)) !== -1) {
		count++;
		pos += word.length;
	}
	return count;
}
export async function scorePoints({ word="no", text, user, pool }) {
	let count = countWord(word, text);

	if (projConf.translator.enable) {
		const transData = await translate(text);

		if ((transData?.detectedLanguage?.language) && (transData.detectedLanguage.language !== "en")) {
			let translated = transData.translatedText;

			// for some reason it doesn't always translate on the first response but works on the second
			if (translated === text) {
				translated = transData.alternatives[0]
			}
			count = count + countWord(word, translated); // I did purposely add them together
		}
	}

	let score = count;

	if (user.roles.cache.has(projConf.discord.roleIds.peopleDisliked)) {
		if (score < 2) {
			score = Math.round(Math.random());
		} else {
			score = Math.floor(score / 2);
		}
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

export default async(client, msg) => {
	if (msg.author.bot) return;

	const word = "no";

	const values = await scorePoints({ 
		text: msg.content,
		user: await msg.guild.members.fetch(msg.author.id),
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
}
