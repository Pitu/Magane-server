import { Request, Response } from 'express';
import axios from 'axios';

export const run = async (req: Request, res: Response): Promise<any> => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ message: 'Invalid pack ID supplied' });

	const response = await axios.get(`http://dl.stickershop.line.naver.jp/products/0/0/1/${id}/android/productInfo.meta`);
	return res.status(200).json({
		title: response.data.title.en,
		first: response.data.stickers[0].id,
		len: response.data.stickers.length,
		hasAnimation: response.data.hasAnimation,
		hasSound: response.data.hasSound
	});
};
