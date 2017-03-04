var express = require('express');
var app = express();

var server = require('http').Server(app);

var io = require('socket.io')(server);

var fs = require('fs');

var cameras = [];

// Let the server listen on port 3000 for the websocket connection
server.listen(3000);

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/index.html');
});

app.use(express.static('static'));
app.use(express.static('images'));

// Setup on port 8080 as well for the web app
app.listen(8080, function () {
  console.log('3D Camera app listening on port 8080 and 3000')
})

io.on('connection', function (socket) {
    console.log('A connection was made', socket.id);
    cameras.push({socketId: socket.id, name: null, ipAddress: null, photoError:false});


    socket.on('camera-online', function(msg){

        // Update our cache
        var i = findCameraIndex(socket.id);
        cameras[i].name        = msg.name;
        cameras[i].ipAddress   = msg.ipAddress;
        cameras[i].lastCheckin = new Date();

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

        for (let i = 0; i < cameras.length; i++) {
            cameras[i].waitingOnPhoto = true;
        }

    });

    socket.on('new-photo', function(msg){
        console.log("New photo data");
        var i = findCameraIndex(socket.id);
        cameras[i].photoError = false;
        cameras[i].waitingOnPhoto = false;

        // Where is the image to be saved
        let folderName = getFolderName(msg.startTime);
        let imagePath  = folderName + '/' + guid() + '.jpg';
        fs.writeFile(imagePath, new Buffer(msg.data, 'base64'));

        msg.cameraName = cameras[i].name;
        msg.imagePath  = imagePath;

        io.emit('new-photo', msg);

    });


    socket.on('photo-error', function(msg){
        var i = findCameraIndex(socket.id);
        cameras[i].photoError = true;
        cameras[i].waitingOnPhoto = false;
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