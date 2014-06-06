module.exports = function (eventSpecs) {
	if (typeof eventSpecs !== 'object' || Array.isArray(eventSpecs)) {
		throw new TypeError('eventSpecs must be a non-array, non-function object.');
	}

	var eventNames = Object.keys(eventSpecs);

	var isInvalid = eventNames.some(function (eventName) {
		var spec = eventSpecs[eventName];

		if (spec === true) {
			return false;
		}

		if (typeof spec !== 'object') {
			return true;
		}

		if (Array.isArray(spec)) {
			return true;
		}

		if (!spec.name && !spec.preProcessor) {
			return true;
		}
	});

	if (isInvalid) {
		throw new Error('Invalid event specifications.');
	}
};
