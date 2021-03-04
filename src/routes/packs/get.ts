import { Request, Response } from 'express';
import prisma from '../../structures/database';

export const run = async (req: Request, res: Response): Promise<any> => {
	const packs = await prisma.packs.findMany({ select: { name: true, count: true, lineId: true, animated: true } });
	for (const pack of packs) {
		// @ts-ignore
		pack.files = [];
		const stickers = await prisma.stickers.findMany({ where: { packId: pack.lineId }, select: { file: true, lineId: true } });
		for (const sticker of stickers) {
			// @ts-ignore
			pack.files.push(sticker.file);
		}
	}

	return res.status(200).json({
		baseURL: process.env.baseURL,
		packs
	});
};
