const Route = require('../../structures/Route');
const { server } = require('../../config');
const db = require('knex')(server.database);

class PackGET extends Route {
	constructor() {
		super('/api/packs', 'get');
	}

	authorize(req, res) {
		return this.run(req, res);
	}

	async run(req, res) {
		const packs = await db.table('packs').select('name', 'count', 'lineId as id', 'animated');
		for (const pack of packs) {
			pack.files = [];
			const stickers = await db.table('stickers').where({ packId: pack.id }).select('file'); // eslint-disable-line no-await-in-loop
			for (const sticker of stickers) {
				pack.files.push(sticker.file);
			}
		}
		return res.status(200).json({
			baseURL: server.baseURL,
			packs
		});
	}
}

module.exports = PackGET;
