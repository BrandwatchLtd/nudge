var makeHandler = require('./makeHandler');
var checkValidity = require('./checkValidity');


// Don't make functions in a loop!
function removeListener(emitter, eventName, handler) {
	return function () {
		emitter.removeListener(eventName, handler);
	};
}

// eventSpecs is an object. Each field must contain true, or a sub object with a
// name, or a function, or both.
module.exports = function (emitter, eventSpecs) {
	checkValidity(eventSpecs);

	var eventNames = Object.keys(eventSpecs);

	return function (req, res) {
		// Make event listeners.
		for (var i = 0, len = eventNames.length; i < len; i++) {
			var eventName = eventNames[i];
			var handler = makeHandler(eventName, eventSpecs[eventName], res);

			emitter.on(eventName, handler);

			// Make sure we remove the event listener when the request ends.
			req.once('close', removeListener(emitter, eventName, handler));
		}

		// Necessary headers for SSE.
		res.status(200).set({
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});

		// SSE required newline.
		res.write('\n');
	};
};
