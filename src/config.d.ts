interface ProjectConfig {
	discord: {
		guildId: string;
		clientId: string;
		devs: string[];
		spamChannelId: string;
		roleIds: {
			negator: string;
			leaderboardFirst: string;
			leaderboardSecond: string;
			leaderboardThird: string;
			leaderboardTopFive: string;
			admin: string;
			peopleDisliked: string;
			peopleLiked: string;
			firstWarning: string;
		};
	};
	path: {
		root: string;
		commands: string;
		events: string;
	};
	eventManager: {
		commandDepth: number;
		subcommands: boolean;
	};
	translator: {
		enable: boolean;
		host: string;
		port: string;
	}
}

declare global {
	var projConf: ProjectConfig;
}

export {};
