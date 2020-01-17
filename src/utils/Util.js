const jetpack = require('fs-jetpack');
const sharp = require('sharp');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class Util {
	static async generateThumbnail(pack, file) {
		try {
			const filename = path.parse(file);
			await sharp(file)
				.resize(null, 180, { kernel: 'nearest' })
				.toFormat('png')
				.toFile(path.join(pack.uploadPath, filename.base));
			await sharp(file)
				.resize(null, 100, { kernel: 'nearest' })
				.toFormat('png')
				.toFile(path.join(pack.uploadPath, `${filename.name}_key.png`));
		} catch (error) {
			console.error(error);
		}
	}

	static async generateAnimatedThumbnail(pack, file) {
		const filename = path.parse(file);

		const animatedPng = path.join(pack.uploadPath, '_temp', `${filename.name}.png`);
		const tempPng = path.join(pack.uploadPath, `${filename.name}_180.png`);
		const tempPngKey = path.join(pack.uploadPath, `${filename.name}_100.png`);

		const finalGif = path.join(pack.uploadPath, `${filename.name}.gif`);
		const finalGifKey = path.join(pack.uploadPath, `${filename.name}_key.gif`);

		await exec(`ffmpeg -i ${animatedPng} -f apng -plays 0 -vf scale="-1:180" ${tempPng} -f apng -plays 0 -vf scale="-1:100" ${tempPngKey}`);
		await exec(`apng2gif ${tempPng} ${finalGif}`);
		await exec(`apng2gif ${tempPngKey} ${finalGifKey}`);

		await jetpack.renameAsync(path.join(pack.uploadPath, `${filename.name}_180.gif`), `${filename.name}.gif`);
		await jetpack.renameAsync(path.join(pack.uploadPath, `${filename.name}_100.gif`), `${filename.name}_key.gif`);
		await jetpack.removeAsync(tempPng);
		await jetpack.removeAsync(tempPngKey);
	}

	static async generateTabThumbnail(pack, file) {
		try {
			await sharp(file)
				.resize(null, 50, {
					kernel: 'nearest'
				})
				.toFormat('png')
				.toFile(path.join(pack.uploadPath, 'tab_on.png'));
		} catch (error) {
			console.log(error);
		}
	}
}

module.exports = Util;
