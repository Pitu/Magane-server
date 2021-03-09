import { Request, Response } from 'express';
import path from 'path';

export const options = {
	ignoreRoutePrefix: true
};

export const run = (req: Request, res: Response) => res.sendFile(path.join(__dirname, '..', 'views', 'home.html'));
