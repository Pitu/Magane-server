import { Express, Request, Response } from 'express';
import jetpack from 'fs-jetpack';
import * as nodePath from 'path';

export default {
	load: (server: Express) => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		jetpack.find(nodePath.join(__dirname, '..', 'routes'), { matching: '*.{ts,js}' }).forEach(async routeFile => {
			try {
				// const replace = process.env.NODE_ENV === 'production' ? '' : 'src/';
				const route = await import(nodePath.relative(__dirname, routeFile));
				const paths: Array<string> = routeFile.split(nodePath.sep);
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
			} catch (error: any) {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				console.log(`${routeFile} :: ${error.message}`);
			}
		});
	}
};
