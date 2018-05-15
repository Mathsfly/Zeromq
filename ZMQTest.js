var zmq = require('zeromq')

var sock2 = zmq.socket('pull')
var sock = zmq.socket('push')

// sock2.setsockopt(zmq.ZMQ_RECONNECT_IVL, 5); // We want a quick connect retry from zmq
sock2.on('close', () => {
 console.log('close 2')
 sock2.disconnect('tcp://127.0.0.1:3000')
})

// the socket has successfully connected to a remote peer
sock2.on('connect', () => {
 console.log('connect 2')
 sock2.disconnect('tcp://127.0.0.1:3000')
})

// the socket was disconnected unexpectedly.(server is closes...)
sock2.on('disconnect', () => {
 console.log('disconnect 2')
})

// when unbind server. => state is busy
sock.on('close', () => {
 console.log('close')
})

// when unbind server. => state is ready  to close.
sock.on('unbind', () => {
 console.log('unbind')
 sock.close()
})

// When a client disconnect
sock.on('disconnect', () => {
 console.log('disconnect')
 sock.close()
})

// When binding to an interface
sock.on('bind', () => {
 console.log('listen')
})

// when we connect to a remote peer. unless for server.
sock.on('connect', () => {
 console.log('connect')
})

sock.monitor()
sock.bind('tcp://127.0.0.1:3000')

sock2.monitor()
sock2.connect('tcp://127.0.0.1:3000')
sock2.on('message', function (msg) {
 console.log('work 2: %s', msg.toString())
 // sock2.disconnect('tcp://127.0.0.1:3000')
 // sock.unbind('tcp://127.0.0.1:3000')
})

sock.send('some work')

var sock3 = zmq.socket('pull')

sock3.on('close', () => {
 console.log('close 3')
 //sock3.close()
})

sock3.on('connect', () => {
 console.log('connect 3')
})

sock3.on('disconnect', () => {
 console.log('disconnect 3')
})

sock3.monitor()

sock3.connect('tcp://127.0.0.1:3000')
console.log('Worker connected to port 3000')

sock3.on('message', function (msg) {
 console.log('work 3: %s', msg.toString())
})

sock.disconnect('tcp://127.0.0.1:3000')
sock.close()
sock2.disconnect('tcp://127.0.0.1:3000')

var req = zmq.socket('req')
req.setsockopt(zmq.ZMQ_RECONNECT_IVL, 5); // We want a quick connect retry from zmq

// We will try to connect to a non-existing server, zmq will issue events: "connect_retry", "close", "connect_retry"
// The connect_retry will be issued immediately after the close event, so we will measure the time between the close
// event and connect_retry event, those should >= 9 (this will tell us that we are reading 1 event at a time from
// the monitor socket).

var closeTime
req.on('close', function () {
  closeTime = Date.now()
  console.log('close:' + closeTime.toString())
})

req.on('connect_retry', function () {
  console.log('connect retry: ' + Date.now().toString())
  var diff = Date.now() - closeTime
  req.unmonitor()
  req.close()
  console.log(diff)
})

req.monitor()
req.connect('tcp://127.0.0.1:5423')
