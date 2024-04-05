import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { $ } from 'bun';
import jetpack from 'fs-jetpack';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
// import { logger } from 'hono/logger';
import sharp from 'sharp';

const app = new Hono();
const prisma = new PrismaClient();

interface Pack {
	animated: boolean;
	id: number;
	name: string;
	stickers: Sticker[];
	uploadPath: string;
}

interface Sticker {
	id: number;
	lineId: number;
	packId: number;
}

type OptionalPackKeys = 'animated' | 'name' | 'stickers';
type PartialPack = Omit<Pack, OptionalPackKeys> & Partial<Pick<Pack, OptionalPackKeys>>;

// app.use(logger());

app.get('/api/dist/betterdiscord', async c => {
	const response = await fetch('https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.plugin.js');
	if (!response.ok) return c.json({ message: 'Failed to fetch plugin' }, 500);
	const data = await response.text();
	return c.json(
		{ data },
		{
			headers: {
				'content-type': 'application/octet-stream',
				'Content-disposition': 'attachment; filename=magane.plugin.js'
			}
		}
	);
});

app.get('/api/dist/vencord', async c => {
	const response = await fetch('https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.vencord.js');
	if (!response.ok) return c.json({ message: 'Failed to fetch plugin' }, 500);
	const data = await response.text();
	return c.json(
		{ data },
		{
			headers: {
				'content-type': 'application/octet-stream',
				'Content-disposition': 'attachment; filename=magane.vencord.js'
			}
		}
	);
});

app.get('/api/proxy/emoji/:id', async c => {
	const { id } = c.req.param();
	if (!id) return c.json({ message: 'Invalid pack ID supplied' }, 400);

	const response = await fetch(`https://store.line.me/emojishop/product/${id}/en`);
	if (!response.ok) return c.json('Failed to fetch emoji pack', 400);

	const data = await response.text();

	const title = /<title[^>]*>([^<]+)<\/title>/.exec(data)?.[1]?.split(' – LINE Emoji | LINE STORE')[0];
	const len = (data.match(/FnStickerPreviewItem/g) ?? []).length;
	return c.json({ title, id, len });
});

app.get('/api/proxy/sticker/:id', async c => {
	const { id } = c.req.param();
	if (!id) return c.json({ message: 'Invalid pack ID supplied' }, 400);

	const response = await fetch(`http://dl.stickershop.line.naver.jp/products/0/0/1/${id}/android/productInfo.meta`);

	if (!response.ok) return c.json('Failed to fetch sticker pack', 400);

	const data = await response.json();

	return c.json({
		title: data.title.en,
		first: data.stickers[0].id,
		len: data.stickers.length,
		hasAnimation: data.hasAnimation,
		hasSound: data.hasSound
	});
});

app.get('/api/packs', async c => {
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

	return c.json({
		// eslint-disable-next-line @typescript-eslint/dot-notation
		baseURL: import.meta.env['baseURL'],
		packs: responsePacks
	});
});

app.post('/api/packs/subscribe', async c => {
	const { body } = await c.req.json();

	if (!body) return c.json({ message: 'No body provided' }, 400);
	const { packs }: { packs: number[] } = body;
	if (!packs.length) return c.json({}, 400);

	for (const pack of packs) {
		void prisma.packs.update({ where: { lineId: pack }, data: { subscribed: { increment: 1 } } });
	}

	return c.json({});
});

app.post('/api/pack/line/:id', async c => {
	const { id } = c.req.param();
	const { overwrite, secret } = c.req.header();

	// eslint-disable-next-line @typescript-eslint/dot-notation
	if (!secret || secret !== import.meta.env['secret']) return c.json({}, 403);

	if (!id) {
		return c.json(
			{
				code: 400,
				message: 'No pack id provided.'
			},
			400
		);
	}

	const pack: PartialPack = {
		id: Number.parseInt(id, 10),
		uploadPath: path.join(import.meta.dir, '..', 'packs', id)
	};

	const exists = await prisma.packs.findFirst({ where: { lineId: pack.id } });
	if (exists) {
		if (!overwrite) return c.json({ message: 'Pack already exists' }, 403);
		await prisma.packs.deleteMany({ where: { lineId: pack.id } });
		await prisma.stickers.deleteMany({ where: { packId: pack.id } });
		await jetpack.removeAsync(pack.uploadPath);
	}

	await jetpack.dir(pack.uploadPath);
	const packToSave: any = await _getMetadata(pack);
	void _saveToDatabase(packToSave);
	return c.json({});
});

const _getMetadata = async (pack: PartialPack) => {
	try {
		const response = await fetch(
			`http://dl.stickershop.line.naver.jp/products/0/0/1/${pack.id}/android/productInfo.meta`
		);

		if (!response.ok) {
			console.error('Failed to fetch metadata');
			return;
		}

		const data = await response.json();
		return await _getFiles({
			...pack,
			stickers: data.stickers,
			name: data.title.en || data.title.ja,
			animated: data.hasAnimation
		});
	} catch (error) {
		console.error(error);
	}

	return null;
};

const _getFiles = async (pack: Pack) => {
	for (const sticker of pack.stickers) {
		let url = `http://dl.stickershop.line.naver.jp/stickershop/v1/sticker/${sticker.id}/android/sticker.png`;
		if (pack.animated)
			url = `https://sdl-stickershop.line.naver.jp/products/0/0/1/${pack.id}/android/animation/${sticker.id}.png`;

		try {
			const response = await fetch(url);
			const buffer = await response.arrayBuffer();
			await Bun.write(path.join(pack.uploadPath, '_temp', `${sticker.id}.png`), buffer);
			jetpack.dir(path.join(pack.uploadPath, '_temp', '_temp'));
		} catch (error) {
			console.error(error);
		}
	}

	return _processFiles(pack);
};

const _processFiles = async (pack: Pack) => {
	const firstFile: string | null = null;
	const files = jetpack.find(path.join(pack.uploadPath, '_temp'), { matching: '*.png' });
	for (const file of files) {
		try {
			if (pack.animated) await generateAnimatedThumbnail(pack, file);
			else await generateThumbnail(pack, file);
		} catch (error) {
			console.error(error);
		}
	}

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

	// eslint-disable-next-line no-restricted-globals
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

	await $`ffmpeg -i ${animatedPng} -f apng -plays 0 -vf scale="-1:180" ${tempPng} -f apng -plays 0 -vf scale="-1:100" ${tempPngKey}`;
	await $`apng2gif ${tempPng} ${finalGif}`;
	await $`apng2gif ${tempPngKey} ${finalGifKey}`;

	await jetpack.renameAsync(path.join(pack.uploadPath, `${filename.name}_180.gif`), `${filename.name}.gif`);
	await jetpack.renameAsync(path.join(pack.uploadPath, `${filename.name}_100.gif`), `${filename.name}_key.gif`);
	await jetpack.removeAsync(tempPng);
	await jetpack.removeAsync(tempPngKey);
};

app.use('/*', serveStatic({ root: './src/static' }));
app.use('/packs/*', serveStatic({ root: './' }));

console.log('Magane server started on port 5000');

export default {
	port: 5000,
	fetch: app.fetch
};
