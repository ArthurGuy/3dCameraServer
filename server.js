var express = require('express');
var app = express();
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

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


app.post('/new-image', upload.single('image'), function (request, response) {
    console.log("received a new image", request.body.socketId);
    if (!request.file || !request.body.startTime) {
        return;
    }

    request.body.takeId;

    let folderName = getFolderName(request.body.startTime);
    let imagePath  = './images/' + folderName + '/' + request.body.fileName;

    var tmpPath = './' + request.file.path;

    fs.rename(tmpPath, imagePath, function(err) {
        if (err) throw err;

        // The camera has been moved to the right place, update our data array to show this
        var i = findCameraIndexByName(request.body.cameraName);
        cameras[i].photoError     = false;
        cameras[i].waitingOnPhoto = false;
        cameras[i].photoSending   = false;
        cameras[i].receivedPhoto  = true;
        cameras[i].latestImage    = folderName + '/' + request.body.fileName;

        fs.unlink(tmpPath, function() {
            if (err) throw err;
        });
    });

    response.sendStatus(201);
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
        photoTaken: false,
        waitingOnPhoto: false,
        lastCheckin: null,
        photoSending: false,
        receivedPhoto: false,
        version: null,
        photoStatus: null
    });


    // Listen for heartbeat notifications from the cameras
    socket.on('camera-online', function(msg){

        // Update our cache
        var i = findCameraIndex(socket.id);
        cameras[i].type             = 'camera';
        cameras[i].name             = msg.name;
        cameras[i].ipAddress        = msg.ipAddress;
        cameras[i].lastCheckin      = new Date();
        cameras[i].updateInProgress = msg.updateInProgress;
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
        msg.socketId = socket.id;
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

    socket.on('update-name', function(msg){
        console.log("Updating device name");

        var i = findCameraIndex(msg.socketId);

        // Broadcast a message but pass the ip of the camera that needs to respond
        io.emit('update-name', {ipAddress: cameras[i].ipAddress, newName: msg.newName});
    });


    socket.on('sending-photo', function(msg){
        var i = findCameraIndex(socket.id);
        cameras[i].photoSending = true;
    });


    // When a new photo comes in save it and send it on to the client
    socket.on('new-photo', function(msg){
        console.log("New photo data");
        var i = findCameraIndex(socket.id);
        cameras[i].photoError = false;
        cameras[i].photoTaken = true;
        //cameras[i].waitingOnPhoto = false;
        //cameras[i].photoSending   = false;
        //cameras[i].receivedPhoto  = true;

        let folderName = getFolderName(msg.startTime);

        msg.cameraName = cameras[i].name;
        msg.imagePath  = folderName + '/' + msg.fileName;

        //io.emit('new-photo', msg);

        /*
        // Where is the image to be saved
        let folderName = getFolderName(msg.startTime);
        let fileName   = guid() + '.jpg';
        let imagePath  = './images/' + folderName + '/' + fileName;
        let thumbImagePath  = './images/' + folderName + '/thumb/' + fileName;

        if (!fs.existsSync('./images/' + folderName + '/thumb/')){
            fs.mkdirSync('./images/' + folderName + '/thumb/');
        }

        msg.cameraName = cameras[i].name;
        msg.imagePath  = folderName + '/' + fileName;

        let imageData = new Buffer(msg.data, 'base64')

        let parser = require('exif-parser').create(imageData);
        let result = parser.parse();

        fs.writeFile(imagePath, imageData, function () {
            msg.data       = null;

            if (result.hasThumbnail()) {
                console.log("Thumbnail found");
                fs.writeFile(thumbImagePath, result.getThumbnailBuffer(), function () {
                    msg.thumbImagePath  = folderName + '/thumb/' + fileName;
                    io.emit('new-photo', msg);
                });
            } else {
                io.emit('new-photo', msg);
            }
        });
        */

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

    // Generate a status message for the camera
    for (let i = 0; i < cameras.length; i++) {
        let photoStatus = 'standby';
        if (cameras[i].waitingOnPhoto) {
            photoStatus = 'taking';
        }
        if (cameras[i].photoSending) {
            photoStatus = 'sending';
        }
        if (cameras[i].receivedPhoto) {
            photoStatus = 'received';
        }
        if (cameras[i].updateInProgress) {
            photoStatus = 'updating-software';
        }
        cameras[i].photoStatus = photoStatus;
    }


    io.emit('camera-update', cameras);

    // See if any of the cameras have a new image
    for (let i = 0; i < cameras.length; i++) {
        if (cameras[i].receivedPhoto) {
            cameras[i].receivedPhoto = false;

            msg = {
                cameraName: cameras[i].name,
                imagePath: cameras[i].latestImage
            }
            io.emit('new-photo', msg);
        }
    }
}


// Locate our local camera data based on the socket id
function findCameraIndex(socketId) {
    for (let i = 0; i < cameras.length; i++) {
        if (cameras[i].socketId === socketId) {
            return i;
        }
    }
}

function findCameraIndexByName(name) {
    for (let i = 0; i < cameras.length; i++) {
        if (cameras[i].name === name) {
            return i;
        }
    }
}


// Generate a folder name based on the timestamp
function getFolderName(time) {
    let date = new Date(Number(time));
    let dayOfWeek = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let hour = ("0" + (date.getHours() + 1)).slice(-2);
    let minute = ("0" + (date.getMinutes() + 1)).slice(-2);
    let seconds = ("0" + (date.getSeconds() + 1)).slice(-2);
    return date.getFullYear() + month + dayOfWeek + hour + minute + seconds;
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
