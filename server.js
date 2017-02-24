var app = require('express')();

var server = require('http').Server(app);

var io = require('socket.io')(server);

var fs = require('fs');

var cameras = [];

server.listen(3000);

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('A connection was made', socket.id);
    cameras.push({socketId: socket.id, name: null, ipAddress: null, photoError:false});


    socket.on('camera-online', function(msg){

        // Update our cache with the full details
        var i = findCameraIndex(socket.id);
        cameras[i].name = msg.name;
        cameras[i].ipAddress = msg.ipAddress;

        io.emit('camera-update', cameras);
    });

    socket.on('disconnect', function(msg, msg2) {
        var i = findCameraIndex(socket.id);
        cameras.splice(i, 1);

        io.emit('camera-update', cameras);
    });



    // Relay different messages to all clients
    socket.on('take-photo', function(msg){
        console.log("Take a new photo");

        let folderName = getFolderName(msg.time);

        fs.mkdirSync(folderName);
        io.emit('take-photo', msg);
    });

    socket.on('new-photo', function(msg){
        console.log("New photo data");
        var i = findCameraIndex(socket.id);
        cameras[i].photoError = false;

        // Where is the image to be saved
        let folderName = getFolderName(msg.startTime);

        fs.writeFile(folderName + '/' + guid() + '.jpg', new Buffer(msg.data, 'base64'));

        io.emit('new-photo', msg);

        // save the photo data to the file system
        // msg.data

    });


    socket.on('photo-error', function(msg){
        var i = findCameraIndex(socket.id);
        cameras[i].photoError = true;
        io.emit('photo-error', msg);
        io.emit('camera-update', cameras);
    });


});

function findCameraIndex(socketId) {
    for (let i = 0; i < cameras.length; i++) {
        if (cameras[i].socketId === socketId) {
            return i;
        }
    }
}

function getFolderName(time) {
    //return './images/' + time;
    let date = new Date(time);
    return './images/' + date.getFullYear() + (date.getMonth()+1) + date.getDate() + date.getHours() + date.getMinutes() + date.getSeconds();
    return './images/' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '-' + date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}