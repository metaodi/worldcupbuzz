var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');

//serve map directory
app.use('/', express.static(__dirname + '/map'));
app.get('/map', function(req, res){
    res.redirect('/');
});

app.post('/receive', bodyParser.json(), function(req, res) {
    console.log("got request", req.body);

    // broadcast to all connected clients
    io.emit('new_msg', req.body);
});

var port = Number(process.env.PORT || 9998);
server.listen(port);

// connection event for each connected client
io.on('connection', function (socket) {
  console.log("User connected");
});
