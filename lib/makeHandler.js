function makeHandler(eventName, spec, proxy) {
	'use strict';

	var initialString = 'event: ' + (typeof spec === 'object' && spec.name || eventName);

	function composeAndEmit(data) {
		proxy.emit('data', initialString + '\ndata: ' + JSON.stringify(data) + '\n\n');
	}

	if (spec === true || !spec.preProcessor) {
		return composeAndEmit;
	}

	return function preProcessAndComposeAndEmit() {
		spec.preProcessor(Array.prototype.slice.call(arguments), composeAndEmit);
	};
}

module.exports = makeHandler;
