const logger = require('../../util/Log');
const Route = require('../../structures/Route');
const path = require('path');
const request = require('request');
const fs = require('fs');
const unzip = require('unzip2');
const gm = require('gm');
const LINELink = 'http://dl.stickershop.line.naver.jp/products/0/0/1/<packid>/android/stickers.zip';
const APNGLink = 'https://stickershop.line-scdn.net/stickershop/v1/sticker/<stickerid>/IOS/sticker_animation@2x.png';
// . const parseAPNG = require('apng-js');

class PackPOST extends Route {
	constructor() {
		super('/api/pack/line/:id/:animated', 'post');
	}

	async run(req, res) {
		const { id, animated } = req.params;

		if (!id) {
			return res.status(400).json({
				code: 400,
				message: 'No pack id provided.'
			});
		}

		const pack = {
			id,
			files: [],
			uploadPath: ''
		};

		pack.uploadPath = path.join(__dirname, '..', '..', '..', 'packs', id);

		if (fs.existsSync(`${pack.uploadPath}/tab_on.png`)) return res.status(403).json({ message: 'Pack already exists' });
		if (!fs.existsSync(pack.uploadPath)) {
			fs.mkdirSync(pack.uploadPath);
		}

		this._downloadPack(pack);

		return res.status(200).json({ code: 200 });
	}

	_downloadPack(pack) {
		const stream = fs.createWriteStream(path.join(pack.uploadPath, `${pack.id}.zip`));
		request.get(LINELink.replace('<packid>', pack.id))
			.on('error', err => { logger.error(err); })
			.pipe(stream)
			.on('finish', () => {
				logger.success(`Finished downloading pack ${pack.id}.`);
				logger.info('Extracting files...');

				fs.createReadStream(path.join(pack.uploadPath, `${pack.id}.zip`))
					.on('error', err => { logger.error(err); })
					.pipe(unzip.Extract({ path: pack.uploadPath }))
					.on('close', () => {
						logger.success('Files were extracted successfully.');
						this._processFiles(pack);
					});
			});
	}

	async _processFiles(pack) {
		const files = await fs.readdirAsync(pack.uploadPath);
		logger.info('Resizing images for Discord...');
		for (let file of files) {
			const ext = path.extname(file).toLowerCase();
			if (file.includes('_key') || file.includes('tab_on') || file.includes('tab_off')) continue;
			if (ext !== '.png' && ext !== '.gif') continue;
			const fullPath = path.join(pack.uploadPath, file);

			/* APNG detection

			// Doesnt seem to be reliable tho, gotta look more into it.
			const apng = parseAPNG.isNotAPNG(fullPath);
			logger.error(apng);

			*/

			try {
				const image = gm(fullPath);
				image.resizeExact(null, 180);
				image.background('transparent');
				image.write(fullPath, err => {
					if (err) logger.error('Error saving thumbnail: ', err);
				});
				pack.files.push(file);
			} catch (error) {
				logger.error('Error executing GM: ', error);
			}
		}
		logger.success('Finished resizing.');
		this._saveToDatabase(pack);
	}

	_saveToDatabase(pack) {
		if (fs.existsSync(path.join(pack.uploadPath, 'productInfo.meta'))) {
			try {
				const packInfo = JSON.parse(fs.readFileSync(path.join(pack.uploadPath, 'productInfo.meta')));
				pack.name = packInfo.title.en;
			} catch (err) {
				logger.error('Pack doesn\'t seem to have a productInfo.meta file');
			}
		}
		pack.count = pack.files.length;
		require('../../structures/Database').instance.savePack(pack);
	}
}

module.exports = PackPOST;
