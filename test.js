/* global describe, it, beforeEach */
/* jshint maxlen: 150 */

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var ssee = require('./index');
var checkValidity = require('./checkValidity');
var makeHandler = require('./makeHandler');

describe('checkValidity', function () {
	it('should throw if eventSpecs is not an object.', function () {
		assert.throws(function () {
			checkValidity('hello');
		});

		assert.throws(function () {
			checkValidity([]);
		});

		assert.throws(function () {
			checkValidity();
		});
	});

	it('should throw if a spec is not a non-array object.', function () {
		assert.throws(function () {
			checkValidity({ test: 'hello' });
		});

		assert.throws(function () {
			checkValidity({ test: [] });
		});

		assert.throws(function () {
			checkValidity({ test: {} });
		});

		assert.doesNotThrow(function () {
			checkValidity({ test: { name: 'test' } });
		});


	});

	it('should not throw if the spec is an object.', function () {
		checkValidity({});
	});
});

describe('makeHandler', function () {
	var written;
	var fakeRes = {
		write: function (data) {
			written.push(data);
		}
	};

	beforeEach(function () {
		written = [];
	});

	it('should return the basic event handler then spec is true.', function () {
		var handler = makeHandler('handlerName', true, fakeRes);

		handler('test');

		assert.deepEqual(written, [
			'event: handlerName\n',
			'data: "test"\n\n'
		]);
	});

	it('should return a named event handler then spec is has a name field.', function () {
		var handler = makeHandler('handlerName', { name: 'customName' }, fakeRes);

		handler('test');

		assert.deepEqual(written, [
			'event: customName\n',
			'data: "test"\n\n'
		]);
	});

	it('should return a custom event handler when spec has a preProcessor function.', function () {
		var handler = makeHandler('handlerName', {
			preProcessor: function (args, callback) {
				callback(args.join(''));
			}
		}, fakeRes);

		handler(1, 2, 3);

		assert.deepEqual(written, [
			'event: handlerName\n',
			'data: "123"\n\n'
		]);
	});

	it('should return a custom name event handler when spec has a preProcessor function and name.', function () {
		var handler = makeHandler('handlerName', {
			name: 'customName',
			preProcessor: function (args, callback) {
				callback(args.join(''));
			}
		}, fakeRes);

		handler(1, 2, 3);

		assert.deepEqual(written, [
			'event: customName\n',
			'data: "123"\n\n'
		]);
	});

	it('should filter out events that for which the handler does not call the callback', function () {
		var handler = makeHandler('handlerName', {
			name: 'customName',
			preProcessor: function (args, callback) {
				if (args[0] === false) {
					return;
				}

				callback(args[0]);
			}
		}, fakeRes);

		handler(true);
		handler(false);
		handler(true);
		handler(false);

		assert.deepEqual(written, [
			'event: customName\n',
			'data: true\n\n',
			'event: customName\n',
			'data: true\n\n'
		]);
	});
});

describe('middleware', function () {
	var status;
	var headers;
	var written;
	var testEmitter;

	var fakeRes = {
		write: function (data) {
			written.push(data);
			return fakeRes;
		},
		set: function (headerParams) {
			headers.push(headerParams);
			return fakeRes;
		},
		status: function (code) {
			status.push(code);
			return fakeRes;
		}
	};

	var fakeReq = new EventEmitter();

	beforeEach(function () {
		status = [];
		headers = [];
		written = [];
		testEmitter = new EventEmitter();
	});

	it('should listen only to registered events', function () {
		var middleware = ssee(testEmitter, { test: true });

		middleware(fakeReq, fakeRes);

		testEmitter.emit('test', 'someData');
		testEmitter.emit('test', 'someOtherData');
		testEmitter.emit('somethingElse', 'blah');

		assert.deepEqual(status, [200]);

		assert.deepEqual(headers, [{
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}]);

		assert.deepEqual(written, [
			'\n',
			'event: test\n',
			'data: "someData"\n\n',
			'event: test\n',
			'data: "someOtherData"\n\n'
		]);
	});

	it('should remove the event listeners when the request emits \'close\'.', function () {
		var middleware = ssee(testEmitter, { test: true });

		var beforeCount = testEmitter.listeners('test').length;

		middleware(fakeReq, fakeRes);

		var duringCount = testEmitter.listeners('test').length;

		fakeReq.emit('close');

		var afterCount = testEmitter.listeners('test').length;

		assert.equal(beforeCount + 1, duringCount);
		assert.equal(duringCount - 1, afterCount);
	});
});
