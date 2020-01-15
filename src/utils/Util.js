const jetpack = require('fs-jetpack');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { exec, spawn } = require('child_process');

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
		const filename = path.parse(file);

		const animatedPng = path.join(pack.uploadPath, '_temp', `${filename.name}.png`);
		const tempGif = path.join(pack.uploadPath, '_temp', `${filename.name}.gif`);
		const finalGif = path.join(pack.uploadPath, `${filename.name}.gif`);
		const finalGifKey = path.join(pack.uploadPath, `${filename.name}_key.gif`);

		ffmpeg()
			.input(animatedPng)
			.output(tempGif)
			.on('end', () => {
				exec(`gifsicle ${tempGif} --resize _x180 > ${finalGif}`, (error, stdout, stderr) => {
					if (error) {
						console.error(`exec error: ${error}`);
					}
				});

				exec(`gifsicle ${tempGif} --resize _x100 > ${finalGifKey}`, (error, stdout, stderr) => {
					if (error) {
						console.error(`exec error: ${error}`);
					}
				});
			})
			.run();
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