const Route = require('../../structures/Route');

class EmojiProxyGET extends Route {
	constructor() {
		super('/api/proxy/emoji/:id', 'get');
	}

	authorize(req, res) {
		return this.run(req, res);
	}

	async run(req, res) {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: 'Invalid pack ID supplied' });

		const axios = require('axios');
		const response = await axios.get(`https://store.line.me/emojishop/product/${id}/en`);
		if (!response || !response.data) return res.status(400).json('Something went bork');

		let title = (response.data.match(/<title[^>]*>([^<]+)<\/title>/)[1]).split(' – LINE Emoji | LINE STORE')[0];
		let len = (response.data.match(/FnStickerPreviewItem/g) || []).length;
		return res.status(200).json({ title, id, len });
	}
}

module.exports = EmojiProxyGET;
