# 3D Camera Server

The scanner server software is a node application and as such requires nodejs, [the clients](https://github.com/ArthurGuy/3dCamera) also run node and connect to the server using websockets.

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

When the clients have connected you can command them to take a photo by using the take photo button in the header, this will start the photo capture process and within 30 seconds they should have all sent the images back to your computer. These will be displayed in the browser and saved to a folder in the install directory. You can locate this by searching for the folder `3dCameraServer`.


## Setting up the router

Having a dedicated router for the 3D scanner is the ideal option and will save you some hasle further down the line.

The router should be a cable modem type, an ADSL router wont work as you will need to plug the routers WAN port into your existing router. This will keep the cameras contained but also allow them to connect to the internet to fetch software updates.
The routers DHCP range will need to be changed from the default so it will assign IP addresses in the range `192.168.10.1 - 192.168.10.255`.

The server uses a fixed ip address which is how the cameras now where to send the photos. The easiest way to manage this is to use the fixed IP address allocation which all decent routers will support, you should setup your computers mac address to be assigned the IP address `192.168.10.100`. The routers help documents should provide some guidance setting this up.

The prebuilt camera image that is supplied will try and connect to a wifi network with the name `3DScanner` using the password `poppykalayana` so if your using this image you should setup your router to use these details.

