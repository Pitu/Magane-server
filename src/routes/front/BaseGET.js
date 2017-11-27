const Route = require('../../structures/Route');
const axios = require('axios');

class BaseRouteGET extends Route {
	constructor() {
		super('/', 'get');
	}

	authorize(req, res) {
		return this.run(req, res);
	}

	async run(req, res) {
		const response = await axios.get('https://api.github.com/repos/anonymousthing/InjectMeDaddy/releases/latest');
		return res.render('home', {
			layout: false,
			injector: response.data.assets[0].browser_download_url
		});
	}
}

module.exports = BaseRouteGET;
