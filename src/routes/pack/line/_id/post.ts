import { Request, Response } from 'express';
import prisma from '../../../../structures/database';
import jetpack from 'fs-jetpack';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import util from 'util';
import { exec } from 'child_process';
const ex = util.promisify(exec);

interface Pack {
	id: number;
	uploadPath: string;
	name: string;
	stickers: Sticker[];
	animated: boolean;
}

interface Sticker {
	id: number;
	packId: number;
	lineId: number;
}
type OptionalPackKeys = 'name'|'stickers'|'animated';
type PartialPack = Omit<Pack, OptionalPackKeys> & Partial<Pick<Pack, OptionalPackKeys>>;

export const run = async (req: Request, res: Response): Promise<any> => {
	const { id } = req.params;
	const { overwrite } = req.headers;

	if (!id) {
		return res.status(400).json({
			code: 400,
			message: 'No pack id provided.'
		});
	}

	const pack: PartialPack = {
		id: parseInt(id, 10),
		uploadPath: path.join(__dirname, '..', '..', '..', '..', '..', 'packs', id)
	};

	const exists = await prisma.packs.findFirst({ where: { lineId: pack.id } });
	if (exists) {
		if (!overwrite) return res.status(403).json({ message: 'Pack already exists' });
		await prisma.packs.deleteMany({ where: { lineId: pack.id } });
		await prisma.stickers.deleteMany({ where: { packId: pack.id } });
		await jetpack.removeAsync(pack.uploadPath);
	}

	await jetpack.dir(pack.uploadPath);
	const packToSave: any = await _getMetadata(pack);
	void _saveToDatabase(packToSave);
	return res.sendStatus(204);
};

const _getMetadata = async (pack: PartialPack) => {
	try {
		const response = await axios.get(`http://dl.stickershop.line.naver.jp/products/0/0/1/${pack.id}/android/productInfo.meta`);
		pack.name = response.data.title.en || response.data.title.ja;
		pack.stickers = response.data.stickers;
		pack.animated = response.data.hasAnimation;
		return _getFiles(pack as Pack);
	} catch (error) {
		console.error(error);
	}
};

const _getFiles = async (pack: Pack) => {
	for (const sticker of pack.stickers) {
		let url = `http://dl.stickershop.line.naver.jp/stickershop/v1/sticker/${sticker.id}/android/sticker.png`;
		if (pack.animated) url = `https://sdl-stickershop.line.naver.jp/products/0/0/1/${pack.id}/android/animation/${sticker.id}.png`;

		try {
			const response = await axios.get(url, { responseType: 'arraybuffer' }); // eslint-disable-line no-await-in-loop
			await jetpack.write(path.join(pack.uploadPath, '_temp', `${sticker.id}.png`), response.data); // eslint-disable-line no-await-in-loop
			await jetpack.dir(path.join(pack.uploadPath, '_temp', '_temp')); // eslint-disable-line no-await-in-loop
		} catch (error) {
			console.error(error);
		}
	}
	return _processFiles(pack);
};

const _processFiles = async (pack: Pack) => {
	let firstFile: string | null = null;
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	jetpack.find(path.join(pack.uploadPath, '_temp'), { matching: '*.png' }).forEach(async file => {
		if (!firstFile) firstFile = file;
		try {
			if (pack.animated) await generateAnimatedThumbnail(pack, file);
			else await generateThumbnail(pack, file);
		} catch (error) {
			console.error(error);
		}
	});


	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (firstFile) await generateTabThumbnail(pack, firstFile);
	return pack;
};

const _saveToDatabase = async (pack: Pack) => {
	await prisma.packs.create({
		data: {
			name: pack.name,
			lineId: pack.id,
			animated: pack.animated,
			count: pack.stickers.length,
			stickers: {
				create: pack.stickers.map(sticker => ({
					lineId: sticker.id,
					file: pack.animated ? `${sticker.id.toString()}.gif` : `${sticker.id.toString()}.png`
				}))
			}
		}
	});

	console.log(`< Successfully added pack ${pack.name} (ID: ${pack.id}) >`);

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	setTimeout(async () => {
		try {
			await jetpack.removeAsync(path.join(pack.uploadPath, '_temp'));
		} catch (error) {
			console.error(error);
		}
	}, 30000);
};

const generateTabThumbnail = async (pack: Pack, file: string) => {
	try {
		await sharp(file)
			.resize(null, 50, { kernel: 'lanczos3' })
			.toFormat('png')
			.toFile(path.join(pack.uploadPath, 'tab_on.png'));
	} catch (error) {
		console.log(error);
	}
};

const generateThumbnail = async (pack: Pack, file: string) => {
	try {
		const filename = path.parse(file);
		await sharp(file)
			.resize(null, 180, { kernel: 'lanczos3' })
			.toFormat('png')
			.toFile(path.join(pack.uploadPath, filename.base));
		await sharp(file)
			.resize(null, 100, { kernel: 'lanczos3' })
			.toFormat('png')
			.toFile(path.join(pack.uploadPath, `${filename.name}_key.png`));
	} catch (error) {
		console.error(error);
	}
};

const generateAnimatedThumbnail = async (pack: Pack, file: string) => {
	const filename = path.parse(file);

	const animatedPng = path.join(pack.uploadPath, '_temp', `${filename.name}.png`);
	const tempPng = path.join(pack.uploadPath, `${filename.name}_180.png`);
	const tempPngKey = path.join(pack.uploadPath, `${filename.name}_100.png`);

	const finalGif = path.join(pack.uploadPath, `${filename.name}.gif`);
	const finalGifKey = path.join(pack.uploadPath, `${filename.name}_key.gif`);

	await ex(`ffmpeg -i ${animatedPng} -f apng -plays 0 -vf scale="-1:180" ${tempPng} -f apng -plays 0 -vf scale="-1:100" ${tempPngKey}`);
	await ex(`apng2gif ${tempPng} ${finalGif}`);
	await ex(`apng2gif ${tempPngKey} ${finalGifKey}`);

	await jetpack.renameAsync(path.join(pack.uploadPath, `${filename.name}_180.gif`), `${filename.name}.gif`);
	await jetpack.renameAsync(path.join(pack.uploadPath, `${filename.name}_100.gif`), `${filename.name}_key.gif`);
	await jetpack.removeAsync(tempPng);
	await jetpack.removeAsync(tempPngKey);
};
