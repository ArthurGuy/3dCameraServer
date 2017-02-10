var app = require('express')();

var server = require('http').Server(app);

var io = require('socket.io')(server);

server.listen(3000);

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('A connection was made');
    
    // Relay different messages to all clients
    socket.on('new-data', function(msg){
        io.emit('new-data', msg);
    });
    socket.on('display-msg', function(msg){
        io.emit('display-msg', msg);
    });
    
    io.emit('client-count', io.engine.clientsCount);
    
    socket.on('disconnect', function() {
        io.emit('client-count', io.engine.clientsCount);
    });
});
