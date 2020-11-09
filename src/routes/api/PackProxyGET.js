const Route = require('../../structures/Route');

class PackProxyGET extends Route {
	constructor() {
		super('/api/proxy/:id', 'get');
	}

	authorize(req, res) {
		return this.run(req, res);
	}

	async run(req, res) {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: 'Invalid pack ID supplied' });

		const axios = require('axios');
		const response = await axios.get(`https://store.line.me/stickershop/product/${id}/en`);

		let search = response.data.match(/<title>(.*?)<\/title>/);
		if (!search[1]) res.status(400);
		const title = search[1].split('LINE')[0].slice(0, -3);
		search = response.data.match(/sticker\/(.*?)\/android\/sticker.png/g);

		return res.status(200).json({
			title,
			first: parseInt(search[0].match(/\d+/)[0]),
			len: search.length / 4
		});
	}
}

module.exports = PackProxyGET;
