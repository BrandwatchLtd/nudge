module.exports = function (eventName, spec, res) {
	// The easiest case is the one for which we do no preprocessing of
	// event data and reuse the event name.
	if (spec === true) {
		return function (data) {
			res.write('event: ' + eventName + '\n');
			res.write('data: ' + JSON.stringify(data) + '\n\n');
		};
	}

	// If the spec is not true, then it is an object.
	if (!spec.preProcessor) {
		return function (data) {
			res.write('event: ' + spec.name + '\n');
			res.write('data: ' + JSON.stringify(data) + '\n\n');
		};
	}

	return function () {
		spec.preProcessor(Array.prototype.slice.call(arguments), function (processed) {
			res.write('event: ' + (spec.name || eventName) + '\n');
			res.write('data: ' + JSON.stringify(processed) + '\n\n');
		});
	};
};
