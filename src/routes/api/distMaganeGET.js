const Route = require('../../structures/Route');
const axios = require('axios');

class PackGET extends Route {
	constructor() {
		super('/api/dist/magane', 'get');
	}

	authorize(req, res) {
		return this.run(req, res);
	}

	async run(req, res) {
		const response = await axios({
			method: 'get',
			url: 'https://raw.githubusercontent.com/Pitu/Magane/master/dist/stickers.min.js',
			responseType: 'text'
		});

		res.setHeader('content-type', 'application/javascript;charset=utf-8');
		res.end(response.data);
	}
}

module.exports = PackGET;
