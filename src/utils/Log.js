const lamu = require('lamu')();

class Log {
	static success(...args) {
		lamu.log({
			label: 'success',
			text: args.join(' ')
		});
	}

	static warn(...args) {
		lamu.log({
			label: 'warning',
			text: args.join(' ')
		});
	}

	static error(...args) {
		lamu.log({
			label: 'error',
			text: args.join(' ')
		});
	}

	static info(...args) {
		lamu.log({
			label: 'info',
			text: args.join(' ')
		});
	}
}

module.exports = Log;
