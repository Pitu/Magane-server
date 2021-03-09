import { Request, Response } from 'express';
import axios from 'axios';

export const run = async (req: Request, res: Response): Promise<any> => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ message: 'Invalid pack ID supplied' });

	const response = await axios.get(`https://store.line.me/emojishop/product/${id}/en`);
	if (!response || !response.data) return res.status(400).json('Something went bork');

	const title = (response.data.match(/<title[^>]*>([^<]+)<\/title>/)[1]).split(' – LINE Emoji | LINE STORE')[0];
	const len = (response.data.match(/FnStickerPreviewItem/g) || []).length;
	return res.status(200).json({ title, id, len });
};
