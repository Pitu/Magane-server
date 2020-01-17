const { server } = require('../config');
const db = require('knex')(server.database);

class Database {
	constructor() {
		this.createTables();
		this.printPacks();
	}

	async createTables() {
		if (!await db.schema.hasTable('packs')) {
			await db.schema.createTable('packs', table => {
				table.increments();
				table.string('lineId');
				table.string('name');
				table.boolean('animated');
				table.integer('count');
				table.integer('subscribed').defaultTo(0);
				table.boolean('enabled').defaultTo(true);
			});
		}

		if (!await db.schema.hasTable('stickers')) {
			await db.schema.createTable('stickers', table => {
				table.increments();
				table.string('packId');
				table.string('lineId');
				table.string('file');
			});
		}
	}

	async printPacks() {
		if (!await db.schema.hasTable('packs')) return;
		const packs = await db.table('packs');
		for (const pack of packs) {
			console.log(`< Loaded pack ${pack.name} (ID: ${pack.lineId}) >`);
		}
	}
}

module.exports = Database;
