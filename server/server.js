/*
*	Web and web sockets
*
*/
var express = require('express');
var app = express();

var webSocketPort = 3000;
var webPort = 3001;

var WebSocketServer = require('ws').Server
, wss = new WebSocketServer({ port: webSocketPort });

var UI_SOCKET = null; //Socket reference to UI

console.log("Web socket server started on port:", webSocketPort);
wss.on('connection', function connection(ws) {
	console.log("Someone connected!");
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		var data = null;
		try {
			data = JSON.parse(message);
			console.log("Parsed data to:", data);
		} catch(e) {
			console.log("Invalid JSON!");
		}
		if(data.command == "ui") {
			console.log("Setting UI Socket reference!");
			UI_SOCKET = ws;
		} else if(data.command == "coaster") {
			console.log("Coaster command!", data);
			var coasterUdpData = coasters[data.id];
			console.log(coasters, coasterUdpData);
			if(coasterUdpData) {
				console.log("Found active coaster", data.id, "Sending state!");
				udpServer.send("arst", coasterUdpData.port, coasterUdpData.address, (err) => {
					console.log(err);
				});
			}
		} else if(data.command == "tare") {
			console.log("TARE!");
			for (var i in coasters) {
				udpServer.send("tare", coasters[i].port, coasters[i].address, (err) => {
					console.log(err);
				});
			}
		} else if(data.command == "calibrate") {
		   console.log("Calibrate!");
		   for (var i in coasters) {
			   udpServer.send(data.calibration, coasters[i].port, coasters[i].address, (err) => {
				   console.log(err);
			   });
		   }
	   }
		else {
			console.log("Unknown command:", data.command);
		}
	});
});

console.log("Web server for UI started on port:", webPort);
app.listen(webPort);

app.use("/dist", express.static(__dirname + '/dist'));
app.use("/views", express.static(__dirname + '/views'));
app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});


/*
* === UDP SERVER
*/
const dgram = require('dgram');
const udpServer = dgram.createSocket('udp4');
var udpPort = 41234;

udpServer.on('error', (err) => {
	console.log(`server error:\n${err.stack}`);
	udpServer.close();
});

// Key = id, value = remote addr
var coasters = {};

/*
*   Protocol
*   c = coaster id
*   w = weight
*   a = attention
*   c1w100a1 => id = 1, weight = 100, attention = 1
*/
var handleMessage = function(message, address, port) {
	var command = message.toString().split(/([cwa])+/);
	var data = {
		"id": 0,
		"weight": 0,
		"attention": 0
	};
	for (var i in command) {
		switch (command[i]) {
			case "c":
			data.id = parseInt(command[parseInt(i)+1]);
			break;
			case "a":
			data.attention = parseInt(command[parseInt(i)+1]);
			break;
			case "w":
			data.weight = parseInt(command[parseInt(i)+1]);
			break;
			default:
		}
	}
	console.log(data);
	coasters[data.id] = {
		address: address,
		port: port
	};

	if(UI_SOCKET) {
		//console.log("Sending coaster data to UI!");
		UI_SOCKET.send(JSON.stringify(data));
	} else {
		console.log("No UI is connected...");
	}
};

/*
*   Handle message from clients
*/
udpServer.on('message', (msg, rinfo) => {
	var address = rinfo.address;
	var port = rinfo.port;
	console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

	// Callback
	/*
	udpServer.send("gotit", port, address, (err) => {
		console.log(err);
	});
	*/
	handleMessage(msg, address, port);
});
console.log("UDP Server started on port:", udpPort);
udpServer.bind(udpPort);
