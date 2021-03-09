import { Request, Response } from 'express';
import prisma from '../../structures/database';

export const run = async (req: Request, res: Response): Promise<any> => {
	const packs = await prisma.packs.findMany({
		select: {
			name: true,
			count: true,
			lineId: true,
			animated: true,
			stickers: {
				select: {
					file: true
				}
			}
		}
	});

	const responsePacks = packs.map(pack => ({
		id: pack.lineId,
		name: pack.name,
		count: pack.count,
		animated: pack.animated,
		files: pack.stickers.map(sticker => sticker.file)
	}));

	return res.status(200).json({
		baseURL: process.env.baseURL,
		packs: responsePacks
	});
};
