var express = require('express');
var app = express();

var server = require('http').Server(app);

var io = require('socket.io')(server);

var fs = require('fs');

var cameras = [];

var clientUpdateIntervalTimer;

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


// When a new camera connects set up the following
io.on('connection', function (socket) {
    console.log('A connection was made', socket.id);


    // Add the camera to a persistent list of devices
    cameras.push({
        socketId: socket.id,
        type: null,
        name: null,
        ipAddress: null,
        photoError: false,
        waitingOnPhoto: false,
        lastCheckin: null,
        photoSending: false,
        receivedPhoto: false,
        version: null
    });


    // Listen for heartbeat notifications from the cameras
    socket.on('camera-online', function(msg){

        // Update our cache
        var i = findCameraIndex(socket.id);
        cameras[i].type        = 'camera';
        cameras[i].name        = msg.name;
        cameras[i].ipAddress   = msg.ipAddress;
        cameras[i].lastCheckin = new Date();
        if (msg.version) {
            cameras[i].version = msg.version;
        }

        //io.emit('camera-update', cameras);
    });


    // Sent by the web interface
    socket.on('client-online', function(msg){

        // Update our cache
        var i = findCameraIndex(socket.id);
        cameras[i].type = 'client';

        clientUpdateIntervalTimer = setInterval(clientUpdate, 100);
    });


    socket.on('disconnect', function(msg, msg2) {
        var i = findCameraIndex(socket.id);
        cameras.splice(i, 1);

        io.emit('camera-update', cameras);

        if (cameras[i] && cameras[i].type == 'type') {
            clearInterval(clientUpdateIntervalTimer);
        }
    });


    // When a take photo message comes in create the folder, update the cameras and pass on the take message to devices
    socket.on('take-photo', function(msg){
        console.log("Take a new photo");

        let folderName = './images/' + getFolderName(msg.time);

        fs.mkdirSync(folderName);
        io.emit('take-photo', msg);

        for (let i = 0; i < cameras.length; i++) {
            if (cameras[i].type == 'camera') {
                cameras[i].waitingOnPhoto = true;
                cameras[i].receivedPhoto  = false;
            }
        }

    });


    socket.on('update-software', function(msg){
        console.log("Updating software");

        io.emit('update-software', msg);

    });
    
    socket.on('update-id', function(msg){
        console.log("Updating device id");
        
        var i = findCameraIndex(msg.socketId);
        
        // Broadcast a message but pass the ip of the camera that needs to respond
        io.emit('update-id', {ipAddress: cameras[i].ipAddress, newId: msg.id});
    });


    socket.on('sending-photo', function(msg){
        var i = findCameraIndex(socket.id);
        cameras[i].photoSending = true;
    });


    // When a new photo comes in save it and send it on to the client
    socket.on('new-photo', function(msg){
        console.log("New photo data");
        var i = findCameraIndex(socket.id);
        cameras[i].photoError     = false;
        cameras[i].waitingOnPhoto = false;
        cameras[i].photoSending   = false;
        cameras[i].receivedPhoto  = true;

        // Where is the image to be saved
        let folderName = getFolderName(msg.startTime);
        let fileName   = guid() + '.jpg';
        let imagePath  = './images/' + folderName + '/' + fileName;
        fs.writeFile(imagePath, new Buffer(msg.data, 'base64'));

        msg.data       = null;
        msg.cameraName = cameras[i].name;
        msg.imagePath  = folderName + '/' + fileName;

        io.emit('new-photo', msg);

    });


    // There was an error taking a photo, update our data and the clients
    socket.on('photo-error', function(msg){
        var i = findCameraIndex(socket.id);
        cameras[i].photoError     = true;
        cameras[i].waitingOnPhoto = false;
        cameras[i].photoSending   = false;
        cameras[i].receivedPhoto  = false;
        io.emit('photo-error', msg);
        //io.emit('camera-update', cameras);
    });


});

function clientUpdate() {
    io.emit('camera-update', cameras);
}


// Locate our local camera data based on the socket id
function findCameraIndex(socketId) {
    for (let i = 0; i < cameras.length; i++) {
        if (cameras[i].socketId === socketId) {
            return i;
        }
    }
}


// Generate a folder name based on the timestamp
function getFolderName(time) {
    let date = new Date(time);
    let dayOfWeek = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let hour = ("0" + (date.getHours() + 1)).slice(-2);
    let minute = ("0" + (date.getMinutes() + 1)).slice(-2);
    let seconds = ("0" + (date.getSeconds() + 1)).slice(-2);
    return date.getFullYear() + month + dayOfWeek + hour + minute + seconds;
    //return './images/' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '-' + date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
}


// Generate a guid
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
