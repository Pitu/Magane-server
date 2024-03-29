import { Request, Response } from 'express';
import axios from 'axios';

export const run = async (req: Request, res: Response): Promise<any> => {
	const response = await axios({
		method: 'get',
		url: 'https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.plugin.js',
		responseType: 'text'
	});

	res.setHeader('content-type', 'application/octet-stream');
	res.setHeader('Content-disposition', 'attachment; filename=magane.plugin.js');
	res.end(response.data);
};
