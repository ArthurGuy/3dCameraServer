# 3D Camera Server

The scanner server software is a node application and as such requires nodejs, the clients also run node and connect to the server using websockets.

At present this guide is for the Mac only but if your familer with the concepts you can transition this to other systems.

This setup processes assumes a basic familarity with the terminal and running commands. If your not familier with the command line you should open up terminal by searching for the program Terminal, once this opens you can get everything running by entering the commands exactly as shown below.

## Setup
Ensure you have node running you can check this by opening up a Terminal window and typing 
```bash
node -v
```
If you don't have node installed it can be downloaded from [NodeJS](https://nodejs.org/).

### Download the files
This repository needs to be downloaded to a folder on your computer, this can be done using the following command.
```bash
git clone https://github.com/ArthurGuy/3dCameraServer.git
```

If you prefer you can also download the code as a zip file and unpack into a folder of your choice.

### Install the depeneencies

You need to enter the new folder containing the downloaded code and install the dependencies.

```bash
cd 3dCameraServer
npm install
```

### Finally run the code
The server application should be started using the command below, this will startup a websocket server on port 3000 and a webserver on port 8080.

```bash
node server.js
```

If everything was successfull you will see the message `3D Camera app listening on port 8080 and 3000` at which point you can visit the application in your browser of choice at the following url `http://localhost:8080/`


## Using the system

The client software expects to connect to a server on the ip address `192.168.10.100`, if you aren't using a dedicated router with a fixed ip address allocation you will need to manually set this ip address for yourself.
To simplify things you should setup your computers mac address on the router so it will be automatically assigned the specified ip address.

As the clients come online you will see the connection messages in the terminal window and in the browser window.

When the clients have connected you can command them to take a photo by using the take photo button in the header, this will start the photo capture process and within 30 seconds they should have all sent the images back to your computer. These will be displayed in the browser and saved to a folder in the install directory. If you have followed this guide this folder will be called `3dCameraServer/images/` and will be in your home directory.
