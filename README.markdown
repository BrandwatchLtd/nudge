# Server Sent Event Emitter

This module provides a function that returns an express middleware. The function wraps a Node.js
event emitter, optionally giving events custom names or processing them before being sent to a
client.

## Usage

### Basic

The most basic usage is to pass the function an event emitter, and an object with fields
corresponding to events to listen on, and values set to `true`. For example:

```javascript
var ssee = require('server-sent-event-emitter');
var express = require('express');
var EventEmitter = require('events').EventEmitter;

var testEmitter = new EventEmitter();

// Listen for events 'testEvent' and 'anotherTestEvent'.
var testEmitterRelay = ssee(testEmitter, {
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

setInterval(function () {
    testEmitter.emit('testEvent', 'Hello, world!');
}, 1000);

setInterval(function () {
    testEmitter.emit('anotherTestEvent', 'Goodbye!');
}, 1500);
```

### Advanced

You can rename and do some custom pre-processing on events before sending them through to the client.
One important difference between EventSource and the Node.js EventEmitters is that EventSource
listeners only have one data argument, whereas Node emitters may have many. Pre-processing gives you
a chance to do something to the data from emitters like this in order to reduce them to a single
argument. The return of the preProcessor is used as the data argument.

Take for example:

```javascript
var testEmitterRelay = ssee(twitterEmitter, {
    testEvent: true,
    data: {
        name: 'tweet'
        preProcessor: function (user, tweet) {
            return { user: user, tweet: tweet };
        }
    }
});
```

Here the testEvent is just as before, but 'data' events are being renamed to 'tweet' and the two
data arguments of emissions wrapped in a single object.
