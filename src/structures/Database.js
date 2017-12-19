const level = require('level');
const logger = require('../util/Log');
const path = require('path');
const fs = require('fs');

class Database {
	constructor() {
		if (!Database._instance) {
			logger.info('Initializing database...');
			this.db = level(path.join(__dirname, '..', '..', 'database'));
			this.packsFolder = path.join(__dirname, '..', '..', 'packs');
			this.packs = [];
			logger.success('Database initialized successfully.');
			Database._instance = this;
			this.loadPacks();
		}
		return Database._instance;
	}

	static get instance() {
		if (!Database._instance) new Database();
		return Database._instance;
	}

	loadPacks() {
		this.packs = [];
		fs.readdirSync(this.packsFolder).forEach(folder => {
			if (folder === '.gitkeep') return;

			fs.access(`${this.packsFolder}/${folder}/tab_on.png`, fs.constants.R_OK, async err => {
				if (err) return;

				const pack = JSON.parse(await this.db.get(folder));
				this.packs.push(pack);
				logger.success(`Loaded pack ${pack.name} (ID: ${pack.id})`);
			});
		});
	}

	async savePack(pack) {
		logger.info(`Saving pack ${pack.name} (ID: ${pack.id})`);
		await this.db.put(pack.id, JSON.stringify(pack));
		logger.success('Pack saved!');
		this.loadPacks();
	}
}

module.exports = Database;
