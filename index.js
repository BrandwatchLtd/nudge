var checkValidity = require('./lib/checkValidity');
var makeProxyEmitter = require('./lib/makeProxyEmitter');


// eventSpecs is an object. Each field must contain true, or a sub object with a
// name, or a function, or both.
function nudge(emitter, eventSpecs) {
	'use strict';

	checkValidity(eventSpecs);

	var proxy = makeProxyEmitter(emitter, eventSpecs);

	return function (req, res) {
		function write(string) {
			res.write(string);
		}

		proxy.on('data', write);

		req.once('close', function () {
			proxy.removeListener('data', write);
		});

		// Necessary headers for SSE.
		res.status(200).set({
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});

		// SSE required newline.
		res.write('\n');
	};
}

module.exports = nudge;
