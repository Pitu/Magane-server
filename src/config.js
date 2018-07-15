module.exports = {
	server: {
		port: 5001,
		rateLimits: {
			window: 5,
			max: 2
		},
		secret: 'ZZLgqgXXGXTfj#=fjdj-*nYg3V@PN6_w%&-8xPCF%7LVxc8Ay7Jm^e@Rs%U4#AQD',
		routePrefix: '',
		baseURL: 'https://magane.moe/packs/',
		database: {
			client: 'sqlite3',
			connection: { filename: './database/database.db' },
			useNullAsDefault: true
		}
	},
	pictures: { height: 180 }
};
