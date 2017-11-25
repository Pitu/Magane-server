const { secret } = require('../config').server;

class Route {
	constructor(path, method, options) {
		if (!path) throw new Error('Every route needs a URL associated with it.');
		if (!method) throw new Error('Every route needs its method specified.');

		this.path = path;
		this.method = method;
		this.options = options || {};
	}

	authorize(req, res) {
		const token = req.headers.authorization || req.headers.token;

		if (!token) {
			return res.status(401).json({
				code: 401,
				message: 'No authorization header provided.'
			});
		}

		if (token !== secret) {
			return res.status(401).json({
				code: 401,
				message: 'Invalid token provided.'
			});
		}

		return this.run(req, res);
	}

	run(req, res, user) { // eslint-disable-line no-unused-vars
		return;
	}
}

module.exports = Route;
