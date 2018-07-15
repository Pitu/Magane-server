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

		exec(`apng2gif ${path.join(pack.uploadPath, '_temp', `${filename.name}.png`)} ${path.join(pack.uploadPath, '_temp', '_temp', `${filename.name}.gif`)}`, (err, stdout, stderr) => {
			if (err) {
				console.error(`exec error: ${err}`);
			}

			exec(`gifsicle ${path.join(pack.uploadPath, '_temp', '_temp', `${filename.name}.gif`)} --resize _x180 > ${path.join(pack.uploadPath, `${filename.name}.gif`)}`, (error, stdout, stderr) => {
				if (error) {
					console.error(`exec error: ${error}`);
				}
			});

			exec(`gifsicle ${path.join(pack.uploadPath, '_temp', '_temp', `${filename.name}.gif`)} --resize _x100 > ${path.join(pack.uploadPath, `${filename.name}_key.gif`)}`, (error, stdout, stderr) => {
				if (error) {
					console.error(`exec error: ${error}`);
				}
			});
		});
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
