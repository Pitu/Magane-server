import { Application, Request, Response } from 'express';
import jetpack from 'fs-jetpack';
import path from 'path';

export default {
	load: (server: Application) => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		jetpack.find(path.join(__dirname, '..', 'routes'), { matching: '*.{ts,js}' }).forEach(async routeFile => {
			try {
				const replace = process.env.NODE_ENV === 'production' ? 'dist/' : 'src/';
				const route = await import(routeFile.replace(replace, '../'));
				const paths: Array<string> = routeFile.split('/');
				const method = paths[paths.length - 1].split('.')[0];

				// Get rid of the filename
				paths.pop();

				// Get rid of the src/routes part
				paths.splice(0, 2);

				let path: string = paths.join('/');

				// Transform path variables to express variables
				path = path.replace('_', ':');

				// Append the missing /
				path = `/${path}`;

				// Register the route in Express
				const prefix = route.options?.ignoreRoutePrefix ? '' : process.env.routePrefix ?? '';
				(server as any)[method](`${prefix}${path}`, (req: Request, res: Response) => route.run(req, res));
				console.log(`Found route ${method.toUpperCase()} ${prefix}${path}`);
			} catch (error) {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				console.log(`${routeFile} :: ${error.message}`);
			}
		});
	}
};
