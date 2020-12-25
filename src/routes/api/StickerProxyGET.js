const Route = require('../../structures/Route');

class StickerProxyGET extends Route {
	constructor() {
		super('/api/proxy/sticker/:id', 'get');
	}

	authorize(req, res) {
		return this.run(req, res);
	}

	async run(req, res) {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: 'Invalid pack ID supplied' });

		const axios = require('axios');
		const response = await axios.get(`http://dl.stickershop.line.naver.jp/products/0/0/1/${id}/android/productInfo.meta`);
		return res.status(200).json({
			title: response.data.title.en,
			first: response.data.stickers[0].id,
			len: response.data.stickers.length,
			hasAnimation: response.data.hasAnimation,
			hasSound: response.data.hasSound
		});
	}
}

module.exports = StickerProxyGET;
