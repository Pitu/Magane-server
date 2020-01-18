module.exports = {
	server: {
		port: 5001,
		rateLimits: {
			window: 5,
			max: 2
		},
		secret: '',
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
