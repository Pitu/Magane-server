const Route = require('../../structures/Route');
const { oneLine } = require('common-tags');

class PackGET extends Route {
	constructor() {
		super('/api/dist/betterdiscord', 'get');
	}

	authorize(req, res) {
		return this.run(req, res);
	}

	run(req, res) {
		const content = `//META{"name":"magane"}*//
var magane = function () {}; magane.prototype.start = function () { document.head.appendChild(document.createElement('script')).setAttribute('src', 'https://magane.moe/api/dist/magane'); }; magane.prototype.load = function () {}; magane.prototype.unload = function () {}; magane.prototype.stop = function () {}; magane.prototype.getSettingsPanel = function () {}; magane.prototype.getName = function () { return 'Magane'; }; magane.prototype.getDescription = function () { return 'Bringing LINE stickers to Discord in a chaotic way.'; }; magane.prototype.getVersion = function () { return '0.1.0'; }; magane.prototype.getAuthor = function () { return 'Kana'; };`;

		res.setHeader('Content-type', 'application/octet-stream');
		res.setHeader('Content-disposition', 'attachment; filename=magane.plugin.js');
		res.send(content);
	}
}

module.exports = PackGET;
