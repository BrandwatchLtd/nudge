# nudge

Turn Node.js event emitters into [Server Sent Event](https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events)
(aka `EventSource`) sources!

This module provides a function that wraps an event emitter, returning an express middleware that
responds to browser `EventSource` requests. The wrapper can be configured to listen for particular
events, optionally renaming and/or pre-processing them before forwarding to a client.

## Usage

### Basic

The most basic usage is to pass the function an event emitter, and an object with fields
corresponding to events to listen on, and values set to `true`. For example:

```javascript
var nudge = require('nudge');
var express = require('express');
var EventEmitter = require('events').EventEmitter;

var testEmitter = new EventEmitter();

// Listen for 'testEvent' and 'anotherTestEvent' events.
var testEmitterRelay = nudge(testEmitter, {
    testEvent: true,
    anotherTestEvent: true
});

var app = express();

// Navigate to localhost:3000.
app.get('/', function (req, res) {
    res.send(200);
});

// Host the events on a path. Use:
//     var emitter = new EventSource('/emitter');
//     emitter.addEventListener('testEvent', function (e) {
//         console.log(JSON.parse(e.data));
//     });
// To listen for 'testEvent' events and display destringified data.

app.get('/emitter', testEmitterRelay);

app.listen(3000);

// Intervals to emit sample events to send.
setInterval(function () {
    testEmitter.emit('testEvent', 'Hello, world!');
}, 1000);

setInterval(function () {
    testEmitter.emit('anotherTestEvent', 'Goodbye!');
}, 1500);
```

### Advanced

You can rename and do some custom pre-processing on events before sending them through to the
client. One important difference between EventSource and the Node.js EventEmitters is that
EventSource listeners only have one data argument, whereas Node emitters may have many.
Pre-processing gives you a chance to do something to the data from emitters like this in order to
reduce them to a single argument. The callback of the preProcessor is used as the data argument.
It's important to note that this is a *success* callback. Any errors should be handled by your
function separately. By not calling the success callback, you can effectively filter results.

Take for example:

```javascript
var testEmitterRelay = nudge(twitterEmitter, {
    testEvent: true,
    data: {
        name: 'tweet'
        preProcessor: function (args, successCallback) {
            successCallback({ user: args[0], tweet: args[1] });
        }
    }
});
```

Here the testEvent is just as before, but 'data' events are being renamed to 'tweet' and the two
data arguments of emissions wrapped in a single object.

It's important to note that the callback passed to the pre-processor doesn't take an error. It's up
to your pre-processor function to know what to do when errors occur.

## Contributing

Contributions are welcome! Please see the [contributing](CONTRIBUTING.markdown) document.
