import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

import Routes from './structures/routes';

const server = express();

const start = () => {
	server.use(helmet());
	server.use(cors());
	server.use(morgan('dev'));
	server.use(express.urlencoded({ extended: true }));
	server.use(express.json());

	// Stuff solely related to serving the homepage
	server.set('views', path.join(__dirname, '..', 'views'));
	server.enable('view cache');
	server.use('/', express.static(path.join(__dirname, 'views')));

	// Scan and load routes into express
	Routes.load(server);
	server.listen(process.env.port, () => {
		console.log(`Magane-server started on port ${process.env.port ?? 5000}.`);
	});
};

void start();
