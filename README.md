# 3D Camera Server

The scanner server software is a node application and as such requires nodejs, the clients also run node and connect to the server using websockets.

## Setup
Ensure you have node running you can check this by opening up a terminal window and typing 
```bash
node -v
```
If you don't have node installed it can be downloaded from [NodeJS](https://nodejs.org/).

### Download the files
This repo needs to be checked out to a folder on your computer, this can be done using the following command.
```bash
git clone https://github.com/ArthurGuy/3dCameraServer.git
```

### Install the depeneencies

Enter the folder and install the dependencies 

```bash
cd 3dCameraServer
npm install
```

### Finally run the code
The server application should be started using the command below, this will startup a websocket server on port 3000 and a webserver on port 8080.

```bash
node server.js
```

If everything was successfull you will see the message `3D Camera app listening on port 8080 and 3000` at which point you can visit the application in your browser of choice at th following url `http://localhost:8080/`


## Using the system

The client software expects to connect to a server on the ip address `192.168.10.100`, if you aren't using a dedicated router with a fixed ip address allocation you will need t manually set this ip address for yourself.

As the clients come online you will see the connection messages in the terminal window and in the browser window.
