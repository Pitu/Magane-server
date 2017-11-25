const Route = require('../../structures/Route');
const { server } = require('../../config');
const logger = require('../../util/Log');

class PackGET extends Route {
	constructor() {
		super('/api/packs', 'get');
	}

	async authorize(req, res) {
		return this.run(req, res);
	}

	async run(req, res) {
		const { packs } = require('../../structures/Database').instance;
		return res.status(200).json({
			baseURL: server.baseURL,
			packs
		});
	}
}

module.exports = PackGET;
