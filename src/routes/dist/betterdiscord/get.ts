import { Request, Response } from 'express';

export const run = (req: Request, res: Response) => {
	const content = `//META{"name":"magane"}*//
const magane = function() {};
magane.prototype.vars = {
	className: 'magane-script',
	src: 'https://magane.moe/api/dist/magane',
	unloadIds: [
		'maganeContainer',
		'localStorageIframe'
	],
	unloadStyles: [
		'/** Magane: global.css **/',
		'/** Magane: main.scss **/'
	]
};
magane.prototype.start = function() {
	// Try to unload first.
	magane.prototype.stop();
	const element = document.createElement('script');
	element.className = magane.prototype.vars.className;
	element.setAttribute('src', magane.prototype.vars.src);
	document.head.appendChild(element);
};
magane.prototype.load = function() {};
magane.prototype.unload = function() {};
magane.prototype.stop = function() {
	// Destroy script tags
	document.querySelectorAll('head script.' + magane.prototype.vars.className).forEach(e => {
		e.parentNode.removeChild(e);
	});
	// Destroy APIs
	if (typeof window.magane !== 'undefined') {
		delete window.magane;
	}
	// Destroy elements
	for (const id of magane.prototype.vars.unloadIds) {
		const element = document.getElementById(id);
		if (element) {
			element.parentNode.removeChild(element);
		}
	}
	// Destroy styles
	document.querySelectorAll('head style[type="text/css"]').forEach(e => {
		const match = magane.prototype.vars.unloadStyles.some(s => e.innerText.startsWith(s));
		if (match) {
			e.parentNode.removeChild(e);
		}
	});
};
magane.prototype.getSettingsPanel = function() {};
magane.prototype.getName = function() { return 'Magane'; };
magane.prototype.getDescription = function() { return 'Bringing LINE stickers to Discord in a chaotic way.'; };
magane.prototype.getVersion = function() { return '3.1.0'; };
magane.prototype.getAuthor = function() { return 'Kana'; };`;

	res.setHeader('Content-type', 'application/octet-stream');
	res.setHeader('Content-disposition', 'attachment; filename=magane.plugin.js');
	res.send(content);
};
