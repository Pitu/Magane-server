const jetpack = require('fs-jetpack');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

class Util {
	static async generateThumbnail(pack, file) {
		try {
			const filename = path.parse(file);
			await sharp(file)
				.resize(null, 180)
				.toFormat('png')
				.toFile(path.join(pack.uploadPath, filename.base));
			await sharp(file)
				.resize(null, 100)
				.toFormat('png')
				.toFile(path.join(pack.uploadPath, `${filename.name}_key.png`));
		} catch (error) {
			console.error(error);
		}
	}

	static generateAnimatedThumbnail(pack, file) {
		try {
			const filename = path.parse(file);
			ffmpeg(file)
				.size('?x180')
				.format('gif')
				.saveToFile(path.join(pack.uploadPath, `${filename.name}.gif`));

			ffmpeg(file)
				.size('?x100')
				.format('gif')
				.saveToFile(path.join(pack.uploadPath, `${filename.name}_key.gif`));
		} catch (error) {
			console.log(error);
		}
	}

	static async generateTabThumbnail(pack, file) {
		try {
			await sharp(file)
				.resize(null, 50)
				.toFormat('png')
				.toFile(path.join(pack.uploadPath, 'tab_on.png'));
		} catch (error) {
			console.log(error);
		}
	}
}

module.exports = Util;
