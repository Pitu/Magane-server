const Route = require('../../structures/Route');

class BaseRouteGET extends Route {
	constructor() {
		super('/', 'get');
	}

	async authorize(req, res) {
		return this.run(req, res);
	}

	async run(req, res) {
		return res.render('home', { layout: false });
		// return res.status(200).json({ code: 200 });
	}
}

module.exports = BaseRouteGET;
