const logger = require('../../util/Log');
const Route = require('../../structures/Route');
const path = require('path');
const request = require('request');
const fs = require('fs');
const unzip = require('unzip-stream');
const gm = require('gm');
const LINELink = 'http://dl.stickershop.line.naver.jp/products/0/0/1/<packid>/android/stickers.zip';
const APNGLink = 'https://stickershop.line-scdn.net/stickershop/v1/sticker/<stickerid>/IOS/sticker_animation@2x.png';
// . const parseAPNG = require('apng-js');

class PackPOST extends Route {
	constructor() {
		super('/api/pack/line/:id/:animated', 'post');
		this.uploadPath = null;
		this.isAnimated = false;
		this.pack = {
			id: null,
			files: []
		};
	}

	async run(req, res) {
		const { id, animated } = req.params;

		if (!id) {
			return res.status(400).json({
				code: 400,
				message: 'No pack id provided.'
			});
		}

		// if (animated) this.isAnimated = true;

		this.pack.id = id;
		this.pack.files = [];
		this.uploadPath = path.join(__dirname, '..', '..', '..', 'packs', id);

		if (fs.existsSync(`${this.uploadPath}/tab_on.png`)) return res.status(403).json({ message: 'Pack already exists' });
		if (!fs.existsSync(this.uploadPath)) {
			fs.mkdirSync(this.uploadPath);
		}

		this._downloadPack();

		return res.status(200).json({ code: 200 });
	}

	_downloadPack() {
		const stream = fs.createWriteStream(path.join(this.uploadPath, `${this.pack.id}.zip`));
		request.get(LINELink.replace('<packid>', this.pack.id))
			.on('error', err => { logger.error(err); })
			.pipe(stream)
			.on('finish', () => {
				logger.success(`Finished downloading pack ${this.pack.id}.`);
				logger.info('Extracting files...');
				fs.createReadStream(path.join(this.uploadPath, `${this.pack.id}.zip`))
					.on('error', () => { logger.error('There was a problem parsing the zip file.'); })
					.pipe(unzip.Extract({ path: this.uploadPath }))
					.on('close', () => {
						logger.success('Files were extracted successfully.');
						if (this.isAnimated) {
							this._processFilesAnimated(this.uploadPath);
						} else {
							this._processFiles(this.uploadPath);
						}
					});
			});
	}

	async _processFiles() {
		const files = await fs.readdirAsync(this.uploadPath);
		logger.info('Resizing images for Discord...');
		for (let file of files) {
			const ext = path.extname(file).toLowerCase();
			if (file.includes('_key') || file.includes('tab_on') || file.includes('tab_off')) continue;
			if (ext !== '.png' && ext !== '.gif') continue;
			const fullPath = path.join(this.uploadPath, file);

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
				this.pack.files.push(file);
			} catch (error) {
				logger.error('Error executing GM: ', error);
			}
		}
		logger.success('Finished resizing.');
		this._saveToDatabase();
	}

	_saveToDatabase() {
		if (fs.existsSync(path.join(this.uploadPath, 'productInfo.meta'))) {
			try {
				const packInfo = JSON.parse(fs.readFileSync(path.join(this.uploadPath, 'productInfo.meta')));
				this.pack.name = packInfo.title.en;
			} catch (err) {
				logger.error('Pack doesn\'t seem to have a productInfo.meta file');
			}
		}
		this.pack.count = this.pack.files.length;
		require('../../structures/Database').instance.savePack(this.pack);
	}
}

module.exports = PackPOST;
