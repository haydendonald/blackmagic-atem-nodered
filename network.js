var util = require('util');
var isBuffer = Buffer.isBuffer;
var udp = require('dgram');
var crc = require('crc').crc16xmodem;
var ping = require("ping");
var commands = require("./commands/commandList.js");

module.exports = function(RED)
{
    //Main node definition
    function ATEMNetwork(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;
        var name = config.name;
        var ipAddress = config.ipAddress;
        var port = 9910;
        var server = null;
        var pingCheck = null;
        var sessionId = [];
        var localPacketId = 1;
        node.information = {
            "name": name,
            "type": node.type,
            "status": "disconnected",
            "connectionTimeout": 0,
            "debug": true
        }
        
        var messageCallbacks = [];
        var statusCallbacks = [];
        var sendBuffer = [];

        var sendInterval = setInterval(function() {processSendBuffer();}, 100);

        //Pings the server, returns true if connected
        function checkConnection(func) {
            ping.sys.probe(ipAddress, function(status) {
                func(status);
            });
        }

        //When the flows are stopped
        this.on("close", function() {
            clearInterval(pingCheck);
            clearInterval(sendInterval);
            server.close();
            commands.close();
        });

        //Process incoming message object (this does no validation so this needs to be done before calling this fn)
        this.send = function(msg, sender) {
            var cmd = commands.findCommand(msg.payload.cmd);
            if(cmd == null) {
                if(msg.payload.cmd.toUpperCase() == "RAW") {
                    //Build the raw packet to be sent

                    //If the user has defined a name for the command add it to the start of the packet
                    try {
                        var nameBuffer = new Buffer.from(msg.payload.data.name);
                        msg.payload.data.packet = Buffer.concat([nameBuffer, msg.payload.data.packet]);
                    }
                    catch(error){}
                    sendBuffer.push(generatePacket(msg.payload.data.packet, sender));
                }
                else {
                    node.sendStatus("red", "Unknown Command", "Unknown command: " + msg.payload.cmd);
                    return;
                }
            }
            else {
                var success = cmd.sendData(msg, commands);
                if(success != null) {
                    switch(success.direction) {
                        //The data was stored and should just be returned
                        case "node": {
                            if(success.command != null) {
                                if(typeof success.command.payload.data === "string" || success.command.payload.data instanceof String) {
                                    node.sendStatus("red", "Internal Error", success.command.payload.data);
                                }
                                else {
                                    messageCallback(success.command);
                                }
                            }
                            else {node.sendStatus("red", "Internal Error", "The returned data was null");}
                            break;
                        }
                        //The data needs to be requested from the server
                        case "server": {
                            //Generate the packet
                            var nameBuffer = new Buffer.from(success.name);
                            sendBuffer.push(generatePacket(Buffer.concat([nameBuffer, success.command.packet]), sender));
                            node.sendStatus("yellow", "Sending...", "");
                            break;
                        }
                        default: {
                            console.log("Internal Error: Unsupported direction");
                            break;
                        }
                    }

                }
                else {
                    node.sendStatus("red", "Internal Error", "The packet was null");
                }
            }
        }

        //Generates a packet. Expects a commandPacket containing the command from the name >>
        function generatePacket(commandPacket, sender) {
            var message = {
                "packet": null,
                "packetId": [parseInt(localPacketId/256), parseInt(localPacketId%256)],
                "sender": sender,
                "attempts": 1,
                "timeout": 0
            }

            var packet = new Buffer.alloc(16).fill(0);
            packet[0] = parseInt((16+commandPacket.length)/256 | 0x88);
            packet[1] = parseInt((16+commandPacket.length)%256);
            packet[2] = sessionId[0];
            packet[3] = sessionId[1];
            packet.writeInt16BE(message.packetId, 10);
            packet[10] = message.packetId[0];
            packet[11] = message.packetId[1];
            packet[12] = parseInt((4+commandPacket.length)/256);
            packet[13] = parseInt((4+commandPacket.length)%256);
            message.packet = new Buffer.concat([packet, commandPacket]);
            return message;
        }

        //Send out all commands in the send buffer
        function processSendBuffer() {
            if(sendBuffer.length > 0) {
                if(sendBuffer[0].timeout <= 0 && sendBuffer[0].attempts < 2) {
                    //Send the packet
                    if(server && node.information.status == "connected") {
                        //Update the packet id
                        sendBuffer[0].packetId = [parseInt(localPacketId/256), parseInt(localPacketId%256)];
                        sendBuffer[0].packet[10] = sendBuffer[0].packetId[0];
                        sendBuffer[0].packet[11] = sendBuffer[0].packetId[1];
                        
                        try{server.send(sendBuffer[0].packet, port, ipAddress);}
                        catch(e){node.error("Attempted to send a message but the server was closed: " + e); return;}
                        localPacketId++;
                        sendBuffer[0].attempts++;
                        sendBuffer[0].timeout = 5;
                    }
                    else {
                        sendBuffer[0].sender.sendStatus("red", "Failed", "Message failed to send: Not connected");
                        sendBuffer.slice(0, 1);
                    }
                }
                else if(sendBuffer[0].timeout <= 0) {
                    sendBuffer[0].sender.sendStatus("red", "Failed", "Message failed to send: Timeout");
                    sendBuffer = [];
                    statusCallback("disconnected", "timeout");
                }
                else {
                    sendBuffer[0].timeout -= 1;
                }
            }
        }

        //Attempt connection to the HDL controller
        function connect(ipAddress, port) {
            //If already open, close before reconnecting
            try{server.close();}catch(error){}
            sendBuffer = [];
            receiveBuffer = [];
            sessionId = [];
            localPacketId = 1;

            server = udp.createSocket('udp4');
            server.on('error', function(err) {
                node.error("An Error Occured: " + err);
                node.sendStatus("red", "Internal Error", err);
            });

            //Attempt handshake
            server.bind(port);
            handshake();
        }

        //Send a message to the subscribed nodes (appears on the flow)
        node.sendStatus = function(colour, message, extraInformation = "") {
            for(var i = 0; i < statusCallbacks.length; i++) {
                statusCallbacks[i](colour, message, extraInformation);
            }
        }

        //Send a message to the subscribed nodes (appears on the flow)
        node.sendMessage = function(message) {
            for(var i = 0; i < messageCallbacks.length; i++) {
                messageCallbacks[i](message);
            }
        }
        
        node.addStatusCallback = function(func) {statusCallbacks.push(func);}
        node.addMessageCallback = function(func) {messageCallbacks.push(func);}

        //Now lets connect!
        connect(ipAddress, port);


        //When a status is received
        function statusCallback(state, information) {
            switch(state) {
                case "connected": {
                    node.sendStatus("green", "Connected!");
                    node.log("Connected to ATEM @ " + ipAddress);
                    var command = {
                        "payload": {
                            "type": "status",
                            "connectionStatus": "connected"
                        }
                    }
                    messageCallback(command);
                    break;
                }
                case "got-data": {
                    node.sendStatus("green", "Got Data!");
                    break;
                }
                case "error": {
                    node.sendStatus("green", "ATEM Error");
                    break;
                }
                case "connecting": {
                    node.sendStatus("orange", "Connecting...");
                    node.log("Connecting to ATEM @ " + ipAddress);
                    node.information.status = "connecting";
        
                    break;
                }
                case "disconnected": {
                    node.sendStatus("red", "Disconnected!");
                    node.error("Disconnected from ATEM @ " + ipAddress);
                    node.information.status = "disconnected";
                    clearInterval(pingCheck);
                    node.information.connectionTimeout = 0;
                    commands.close();
                    var command = {
                        "payload": {
                            "type": "status",
                            "connectionStatus": "disconnected"
                        }
                    }
                    messageCallback(command);

                    //Close server and attempt reconnection
                    connect(ipAddress, port);
                    break;
                }
            }
        }

        //When a message is received and processed send it out the output
        function messageCallback(command) {
            node.sendMessage(command);
        }

        //Completes a handshake with the atem and returns the session information
        function handshake() {
            var id = Math.round(Math.random() * 0x7FF);
            statusCallback("connecting", "");
            try{server.send(commands.packets.requestHandshake, port, ipAddress);}
            catch(e){node.error("Attempted to send a message but the server was closed: " + e); return;}

            //Check for connection state
            pingCheck = setInterval(function() {
                node.information.connectionTimeout++;
                if(node.information.connectionTimeout > 5) {
                    //Lost connection
                    statusCallback("disconnected", "timeout");
                    clearInterval(pingCheck);
                    node.information.connectionTimeout = 0;
                }
            }, 5000);

            //On message
            server.on("message", processIncomingMessage);
        }

        //Process the message sent by the ATEM                                                        
        function processIncomingMessage(message, rinfo) {
            var length = ((message[0] & 0x07) << 8) | message[1];
            if(length == rinfo.size) {
                var flag = message[0] >> 3;
                sessionId = [message[2], message[3]];
                var remotePacketId = [message[10], message[11]];

                //Check if a packet was processed
                sendBuffer.splice(0, 1);

                //Reply to each command
                var buffer = new Buffer.alloc(12).fill(0);
                buffer[0] = 0x80;
                buffer[1] = 0x0C;
                buffer[2] = sessionId[0];
                buffer[3] = sessionId[1];
                buffer[4] = remotePacketId[0];
                buffer[5] = remotePacketId[1];
                buffer[9] = 0x41;
                setTimeout(function(){
                    try{server.send(buffer, port, ipAddress);}
                    catch(e) {node.error("Attempted to send a message but the server was closed: " + e); return;}
                }, 100);

                //Split a singular command into its parts
                var commandMessage = message.slice(12, length); 
                var cmds = [];
                while(commandMessage.length > 0) {
                    var commandLength = commandMessage.readUInt16BE(0);
                    var thisMessage = commandMessage.slice(0, commandLength);
                    cmds.push(thisMessage);
                    commandMessage = commandMessage.slice(commandLength, length);
                }

                //Process the commands
                for(var i = 0; i < cmds.length; i++) {
                    var command = {
                        "payload": {
                            "type": undefined,
                            "raw": {
                                "flag": commands.findFlag(flag)
                            },
                            "data": {}
                        }
                    }

                    var length = cmds[i].readUInt16BE(0);
                    var name =  cmds[i].toString("UTF8", 4, 8);
                    command.payload.raw.length = length;
                    command.payload.raw.name = name;
                    command.payload.raw.packet = cmds[i];


                    //Check for inital conditions and load in the information otherwise sync
                    //Flag 1 >> 5 >> 1 (Done)
                    if(node.information.status != "connected") {
                        if(flag == commands.flags.initializing && node.information.status == "connecting"){
                            node.information.status = "initializing"; 
                            statusCallback(node.information.status, "");
                        }
                        if(flag == commands.flags.sync && node.information.status == "initializing"){
                            node.information.status = "connected"; 
                            statusCallback(node.information.status, "");
                        }

                        //Check if the command exists in the supported list
                        var cmd = commands.findCommand(name);
                        if(cmd != null) {
                            cmd.initializeData(cmds[i].slice(8, length), flag, commands, messageCallbacks);
                        }
                    }
                    else {
                        //Check if the command exists in the supported list
                        var cmd = commands.findCommand(name);
                        if(cmd != null) {
                            if(cmd.processData(cmds[i].slice(8, length), flag, command, commands)) {
                                messageCallback(command);
                                statusCallback("got-data", "");
                            }
                        }
                        else {
                            command.payload.cmd = "raw";
                            messageCallback(command);
                            statusCallback("got-data", "");
                        }
                    }
                }

                node.information.connectionTimeout = 0;
            }
        }
    }

    //Add the node
    RED.nodes.registerType("atem-network", ATEMNetwork);
}
