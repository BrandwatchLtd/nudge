function makeHandler(eventName, spec, proxy) {
	'use strict';

	// The easiest case is the one for which we do no preprocessing of
	// event data and reuse the event name.
	if (spec === true) {
		return function (data) {
			var string = 'event: ' + eventName + '\ndata: ' + JSON.stringify(data) + '\n\n';

			proxy.emit('data', string);
		};
	}

	// If the spec is not true, then it is an object.
	if (!spec.preProcessor) {
		return function (data) {
			var string = 'event: ' + spec.name + '\ndata: ' + JSON.stringify(data) + '\n\n';

			proxy.emit('data', string);
		};
	}

	return function () {
		var string = 'event: ' + (spec.name || eventName) + '\n';

		spec.preProcessor(Array.prototype.slice.call(arguments), function (processed) {
			string += 'data: ' + JSON.stringify(processed) + '\n\n';

			proxy.emit('data', string);
		});
	};
}

module.exports = makeHandler;
