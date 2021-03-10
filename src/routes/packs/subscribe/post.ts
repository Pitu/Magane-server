import { Request, Response } from 'express';
import prisma from '../../../structures/database';

export const run = (req: Request, res: Response) => {
	if (!req.body) return res.status(400).json({ message: 'No body provided' });
	const { packs }: { packs: number[] } = req.body;
	if (!packs.length) return res.status(400);

	packs.forEach(pack => {
		void prisma.packs.update({ where: { lineId: pack }, data: { subscribed: { increment: 1 } } });
	});

	return res.end();
};
