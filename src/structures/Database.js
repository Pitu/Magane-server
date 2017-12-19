const level = require('level');
const logger = require('../util/Log');
const path = require('path');

class Database {
	constructor() {
		if (!Database._instance) {
			logger.info('Initializing database...');
			this.db = level(path.join(__dirname, '..', '..', 'database'));
			this.packs = [];
			this.cache = [];
			logger.success('Initialized successfully.');
			Database._instance = this;
			this.loadPacks();
		}
		return Database._instance;
	}

	static get instance() {
		if (!Database._instance) new Database();
		return Database._instance;
	}

	async savePack(pack) {
		logger.info(`Saving pack ${pack.name} (ID: ${pack.id})`);
		await this.db.put(pack.id, JSON.stringify(pack));
		logger.success('Pack saved!');
		this.saveReference(pack.id);
		this.packs.push(pack);
	}

	async loadPacks() {
		let packs;
		try {
			packs = await this.db.get('packs');
			this.cache = JSON.parse(packs);
			for (const packId of this.cache) {
				const pack = JSON.parse(await this.db.get(packId));
				this.packs.push(pack);
				logger.success(`Loaded pack ${pack.name} (ID: ${pack.id})`);
			}
		} catch (err) {
			logger.error(err);
		}
	}

	async saveReference(id) {
		this.cache.push(id);
		await this.db.put('packs', JSON.stringify(this.cache));
	}
}

module.exports = Database;
