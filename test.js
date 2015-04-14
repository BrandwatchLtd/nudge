/* global describe, it, beforeEach, afterEach */
/* jshint maxlen: 150 */

'use strict';

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var nudge = require('./index');
var checkValidity = require('./lib/checkValidity');
var makeHandler = require('./lib/makeHandler');
var makeProxyEmitter = require('./lib/makeProxyEmitter');

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
	beforeEach(function () {
		this.fakeProxy = new EventEmitter();
	});

	afterEach(function () {
		this.fakeProxy.removeAllListeners();
	});

	it('should trigger the basic event handler then spec is true.', function () {
		var handler = makeHandler('handlerName', true, this.fakeProxy);
		var basicString;

		this.fakeProxy.on('data', function (string) {
			basicString = string;
		});

		handler('test');

		assert.equal(basicString, 'event: handlerName\ndata: "test"\n\n');
	});

	it('should trigger the named event handler then spec has a name field.', function () {
		var handler = makeHandler('handlerName', { name: 'customName' }, this.fakeProxy);
		var basicString;

		this.fakeProxy.on('data', function (string) {
			basicString = string;
		});

		handler('test');

		assert.equal(basicString, 'event: customName\ndata: "test"\n\n');
	});

	it('should use a custom handler when spec has a preProcessor function.', function () {
		var handler = makeHandler('handlerName', {
			preProcessor: function (args, callback) {
				callback(args.join(''));
			}
		}, this.fakeProxy);
		var basicString;

		this.fakeProxy.on('data', function (string) {
			basicString = string;
		});

		handler(1, 2, 3);

		assert.equal(basicString, 'event: handlerName\ndata: "123"\n\n');
	});

	it('should use a custom name and handler when spec has a preProcessor function and name.', function () {
		var handler = makeHandler('handlerName', {
			name: 'customName',
			preProcessor: function (args, callback) {
				callback(args.join(''));
			}
		}, this.fakeProxy);
		var basicString;

		this.fakeProxy.on('data', function (string) {
			basicString = string;
		});

		handler(1, 2, 3);

		assert.equal(basicString, 'event: customName\ndata: "123"\n\n');
	});

	it('should filter out events that for which the handler does not call the callback.', function () {
		var handler = makeHandler('handlerName', {
			name: 'customName',
			preProcessor: function (args, callback) {
				if (args[0] === false) {
					return;
				}

				callback(args[0]);
			}
		}, this.fakeProxy);
		var filtered = [];

		this.fakeProxy.on('data', function (string) {
			filtered.push(string);
		});

		handler(true);
		handler(false);
		handler(true);
		handler(false);

		assert.deepEqual(filtered, [
			'event: customName\ndata: true\n\n',
			'event: customName\ndata: true\n\n'
		]);
	});
});

describe('makeProxyEmitter', function () {
	it('should make event emitter with no max listeners.', function () {
		var original = new EventEmitter();
		var proxy = makeProxyEmitter(original, {});

		assert.strictEqual(proxy._maxListeners, 0);
	});

	it('proxy emitters should only emit on given event names', function () {
		var original = new EventEmitter();
		var proxy = makeProxyEmitter(original, { a: true });

		var events = 0;

		proxy.on('data', function () {
			events += 1;
		});

		original.emit('a');
		original.emit('b');

		assert.equal(events, 1);
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

	it('should listen only to registered events.', function () {
		var middleware = nudge(testEmitter, { test: true });

		middleware(fakeReq, fakeRes);

		testEmitter.emit('test', 'someData');
		testEmitter.emit('test', 'someOtherData');
		testEmitter.emit('somethingElse', 'blah');

		assert.deepEqual(status, [200]);

		assert.deepEqual(headers, [{
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}]);

		assert.deepEqual(written, [
			'\n',
			'event: test\ndata: "someData"\n\n',
			'event: test\ndata: "someOtherData"\n\n'
		]);
	});
});
