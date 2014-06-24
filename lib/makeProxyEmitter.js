var EventEmitter = require('events').EventEmitter;
var makeHandler = require('./makeHandler');

function makeProxyEmitter(emitter, eventSpecs) {
	'use strict';

	var proxy = new EventEmitter();

	// Disable max listeners warning on the proxy.
	proxy.setMaxListeners(0);

	Object.keys(eventSpecs).forEach(function (eventName) {
		var handler = makeHandler(eventName, eventSpecs[eventName], proxy);

		emitter.on(eventName, handler);
	});

	return proxy;
}

module.exports = makeProxyEmitter;
