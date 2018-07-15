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
		let injector = 'https://github.com/anonymousthing/InjectMeDaddy/releases/latest';
		try {
			const response = await axios.get('https://api.github.com/repos/anonymousthing/InjectMeDaddy/releases/latest');
			injector = response.data.assets[0].browser_download_url;
		} catch (error) {
			console.error(error);
		}

		return res.render('home', {
			layout: false,
			injector
		});
	}
}

module.exports = BaseRouteGET;
