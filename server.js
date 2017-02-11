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
    socket.on('take-photo', function(msg){
        console.log("Take a new photo");
        io.emit('take-photo', msg);
    });
    socket.on('new-photo', function(msg){
        console.log("New photo data");
        io.emit('new-photo', msg);

        // save the photo data to the file system
        // msg.data

    });
    
    io.emit('client-count', io.engine.clientsCount);
    
    socket.on('disconnect', function() {
        io.emit('client-count', io.engine.clientsCount);
    });
});
