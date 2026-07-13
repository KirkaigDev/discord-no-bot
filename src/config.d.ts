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
	textColours: {
		reset: string;
		red: string;
		green: string;
		yellow: string;
		blue: string;
		magenta: string;
		cyan: string;
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
	interface Math {
		bankersRounding(num: number, decimalPlaces: number): number;
		percentRounding(num: number): number;
	}

	var projConf: ProjectConfig;
}

export {};
