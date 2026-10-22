import { Buffer } from 'node:buffer';
import process from 'node:process';
import { URL } from 'node:url';
import { PrismaClient } from '@prisma/client';
import * as Bun from 'bun';
import { afterAll, beforeAll, expect, spyOn, test } from 'bun:test';
import sharp from 'sharp';

if (process.env.MAGANE_IMAGE_TEST !== '1') {
	throw new Error('Run with bun run test:image inside a disposable container.');
}

const prisma = new PrismaClient();
const nativeFetch = globalThis.fetch;
let server: ReturnType<typeof Bun.serve> | undefined;
let fetchMock: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>> | undefined;
let png: Buffer;
let apng: Buffer;

const request = async (pathname: string, init?: RequestInit) => {
	if (!server) throw new Error('Test server did not start.');
	return nativeFetch(new URL(pathname, server.url), init);
};

beforeAll(async () => {
	if (await Bun.file('/app/database/database.sqlite').exists()) {
		throw new Error('Refusing to run against an existing database.');
	}

	const migration = await Bun.file('prisma/migrations/20210309130526_init/migration.sql').text();
	for (const statement of migration.split(';')) {
		if (statement.trim()) await prisma.$executeRawUnsafe(statement);
	}

	png = await sharp({
		create: { width: 64, height: 32, channels: 4, background: '#ff8000' }
	})
		.png()
		.toBuffer();
	const animation = Bun.spawn(
		[
			'ffmpeg',
			'-hide_banner',
			'-loglevel',
			'error',
			'-f',
			'lavfi',
			'-i',
			'testsrc=size=64x32:rate=2',
			'-frames:v',
			'2',
			'-plays',
			'0',
			'-f',
			'apng',
			'/tmp/image-test.png'
		],
		{ stdout: 'inherit', stderr: 'inherit' }
	);
	expect(await animation.exited).toBe(0);
	apng = Buffer.from(await Bun.file('/tmp/image-test.png').arrayBuffer());

	fetchMock = spyOn(globalThis, 'fetch').mockImplementation(
		Object.assign(
			async (input: Parameters<typeof fetch>[0]) => {
				const url = new URL(input instanceof Request ? input.url : String(input));
				for (const [id, animated] of [
					[900001, false],
					[900002, true]
				] as const) {
					if (
						url.href ===
						`https://stickershop.line-scdn.net/stickershop/v1/product/${id}/iphone/productInfo.meta`
					) {
						return Response.json({
							title: { en: `Test pack ${id}` },
							stickers: [{ id }],
							hasAnimation: animated
						});
					}

					const imageUrl = animated
						? `https://sdl-stickershop.line.naver.jp/products/0/0/1/${id}/android/animation/${id}.png`
						: `http://dl.stickershop.line.naver.jp/stickershop/v1/sticker/${id}/android/sticker.png`;
					if (url.href === imageUrl) return new Response(new Uint8Array(animated ? apng : png));
				}

				throw new Error(`Unexpected outbound request: ${url.href}`);
			},
			{ preconnect: nativeFetch.preconnect }
		)
	);

	const app = await import('../src/index');
	server = Bun.serve({ ...app.default, port: 0, hostname: '127.0.0.1' });
});

afterAll(async () => {
	await server?.stop(true);
	fetchMock?.mockRestore();
	await prisma.$disconnect();
});

test('serves the homepage and static assets', async () => {
	const homepage = await request('/');
	expect(homepage.status).toBe(200);
	expect(await homepage.text()).toContain('Magane');
	const icon = await request('/icons/favicon-32x32.png');
	expect(icon.status).toBe(200);
	expect((await sharp(Buffer.from(await icon.arrayBuffer())).metadata()).width).toBe(32);
});

test('reads the migrated SQLite database', async () => {
	const response = await request('/api/packs');
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({ baseURL: 'https://example.test/packs/', packs: [] });
});

test('rejects unauthenticated pack imports and empty subscriptions', async () => {
	expect((await request('/api/pack/line/900001', { method: 'POST' })).status).toBe(403);
	expect(
		(
			await request('/api/packs/subscribe', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: '{}'
			})
		).status
	).toBe(400);
	expect(fetchMock).not.toHaveBeenCalled();
});

test('responds to CORS preflight', async () => {
	const response = await request('/api/packs', {
		method: 'OPTIONS',
		headers: { origin: 'https://example.test', 'access-control-request-method': 'GET' }
	});
	expect(response.status).toBe(204);
	expect(response.headers.get('access-control-allow-origin')).toBe('*');
});

for (const [id, format] of [
	[900001, 'png'],
	[900002, 'gif']
] as const) {
	test(`imports a ${format} pack, converts thumbnails, persists it, and serves its files`, async () => {
		const response = await request(`/api/pack/line/${id}`, {
			method: 'POST',
			headers: { secret: 'image-test-secret' }
		});
		expect(response.status).toBe(200);
		let pack = await prisma.packs.findUnique({ where: { lineId: id } });
		for (let attempt = 0; !pack && attempt < 100; attempt++) {
			await Bun.sleep(20);
			pack = await prisma.packs.findUnique({ where: { lineId: id } });
		}

		expect(pack?.name).toBe(`Test pack ${id}`);
		expect(await prisma.stickers.count({ where: { packId: id } })).toBe(1);
		for (const [suffix, height] of [
			['', 180],
			['_key', 100]
		] as const) {
			const file = await request(`/packs/${id}/${id}${suffix}.${format}`);
			expect(file.status).toBe(200);
			const metadata = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
			expect(metadata.format).toBe(format);
			expect(metadata.height).toBe(height);
			if (format === 'gif') expect(metadata.pages).toBe(2);
		}
	});
}

test('renders SVG through the patched native image libraries', async () => {
	const svg = Buffer.from(
		'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16"><rect width="32" height="16" fill="red"/></svg>'
	);
	const result = await sharp(svg).png().toBuffer();
	expect((await sharp(result).metadata()).height).toBe(16);
});
