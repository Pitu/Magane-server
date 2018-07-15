global.Promise = require('bluebird');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const RateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = global.Promise.promisifyAll(require('fs'));
const path = require('path');
const Database = require('./Database');
const exphbs = require('express-handlebars');

const logger = require('../utils/Log');
const { server } = require('../config');

const rateLimiter = new RateLimit({
	windowMs: server.rateLimits.window,
	max: server.rateLimits.max,
	delayMs: 0
});

class Server {
	constructor(config) {
		this.port = config.port;
		this.server = express();
		this.server.set('trust proxy', 1);
		this.database = new Database();
	}

	async _registerRoutesIn(prefix, routePath) {
		const folders = await fs.readdirAsync(routePath);

		for (const folder of folders) {
			if (!fs.statSync(path.join(routePath, folder)).isDirectory()) continue;

			const files = await fs.readdirAsync(path.join(routePath, folder)); // eslint-disable-line no-await-in-loop

			for (const file of files) {
				if (path.extname(file) !== '.js') continue;
				const RouteClass = require(path.join(routePath, folder, file));
				const route = new RouteClass();
				this.server[route.method](prefix + route.path, route.authorize.bind(route));
				logger.info(`Found route ${route.method.toUpperCase()} ${prefix}${route.path}`);
			}
		}
	}

	start() {
		this.server.use(helmet());
		this.server.use(cors());
		this.server.use(morgan('dev'));
		this.server.use(bodyParser.urlencoded({ extended: true }));
		this.server.use(bodyParser.json());
		this.server.engine('handlebars', exphbs({ defaultLayout: false }));
		this.server.set('views', path.join(__dirname, '..', 'views'));
		this.server.set('view engine', 'handlebars');
		this.server.enable('view cache');
		this.server.use('/', express.static(path.join(__dirname, '..', 'views', 'assets')));
		this._registerRoutesIn(server.routePrefix, path.join(__dirname, '..', 'routes'));
		this.server.listen(this.port, () => {
			logger.success(`Magane-server started on port ${this.port}.`);
		});
	}
}

module.exports = Server;
