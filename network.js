const commandList = require("./commands/commandList.js");
const udp = require('dgram');
const ping = require("ping");

module.exports = function(RED)
{
    //Main node definition
    function ATEMNetwork(config)
    {
        RED.nodes.createNode(this, config);
        var node = this;

        var commands = new commandList.list();
        var packets = new commandList.packets();

        var ipAddress = config.ipAddress;
        var port = 9910;
        var server = null;
        var sessionId = null;
        var localPacketId = 1;
        var heartBeatInterval = undefined;
        var receiveInterval = undefined;
        //var sendInterval = undefined;
        var messageTime = 0;
        var connectionAttempts = 0;
        var lastSentError = "";
        var connectionState = commandList.connectionStates.disconnected;
        var messageCallbacks = [];
        var statusCallbacks = [];
        var sendBuffer = [];
        var receiveBuffer = [];

        //On redeploy
        node.on("close", function() {
            closeConnection();
            clearInterval(receiveInterval);
            messageCallbacks = [];
            statusCallbacks = [];
            lastSentError = "";
            localPacketId = 1;
        });

        //Send out a error
        function sendError(errorNode, errorMessage) {
            if(lastSentError !== errorNode + ":"+ errorMessage) {
                lastSentError = errorNode + ":" + errorMessage;
                node.sendStatus("red", errorNode, errorMessage);
            }
        }

        //Attempt to send a message to the ATEM
        function sendMessage(message) {
            try{server.send(message, port, ipAddress);}
            catch(e) {node.error("Attempted to send a message but the server was closed: " + e); return;}
        }

        //Close the connection
        function closeConnection() {
            sendBuffer = [];
            clearInterval(heartBeatInterval);
            server.close();
            server = null;
            sessionId = null;
            localPacketId = 1;
            commandList.close(commands);
            receiveBuffer = [];
            connectionState = commandList.connectionStates.disconnected;
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

        //Callback definitions
        node.addStatusCallback = function(func) {statusCallbacks.push(func);}
        node.addMessageCallback = function(func) {messageCallbacks.push(func);}

        //When a message is received and processed send it out the output
        function messageCallback(command) {
            node.sendMessage(command);
        }

        //Update the connection state
        function updateConnectionState(state) {
            if(state != connectionState) {
                var msg = {
                    "topic": "status",
                    "payload": {"connectionStatus": Object.keys(commandList.connectionStates)[state]}
                }
                switch(state) {
                    case commandList.connectionStates.disconnected: {
                        if(connectionState == commandList.connectionStates.connected){node.error("Disconnected from ATEM @ " + ipAddress);}
                        node.sendStatus("red", "Disconnected");
                        closeConnection();

                        //Depending on the connection attempts change the time taken to retry
                        if(connectionAttempts < 3) {
                            setTimeout(function(){connect();}, 1000);
                        }
                        else {
                            node.error("Failed to connect 3 times waiting 30 seconds before trying again");
                            setTimeout(function(){connect();}, 30000);
                        }
                        break;
                    }
                    case commandList.connectionStates.connected: {
                        connectionAttempts = 0;
                        messageTime = 0;
                        node.sendStatus("green", "Connected");
                        if(connectionState != commandList.connectionStates.connected){node.log("Connected to ATEM @ " + ipAddress);}

                        //Send out all the inital information
                        var cmds = [];
                        for(var key in commands) {
                            var cmd = {
                                "topic": "initial",
                                "payload": commands[key].afterInit(commands, messageCallbacks)
                            }
                            if(cmd.payload != false) {
                                cmds.push(cmd);
                            }
                        }
                        messageCallback(cmds);


                        //Check for heartbeat every second
                        heartBeatInterval = setInterval(function() {
                            if(connectionState == commandList.connectionStates.connected) {
                                if(messageTime > 5) {
                                    updateConnectionState(commandList.connectionStates.disconnected);
                                }else{messageTime++;}
                            }
                        }, 300);
                        break;
                    }
                }
                connectionState = state;
                node.sendMessage(msg);
            }
        }

        //Process incoming message object (this does no validation so this needs to be done before calling this fn)
        this.send = function(msg, sender) {
            if(connectionState == commandList.connectionStates.connected) {
                var cmd = commandList.findCommand(msg.payload.cmd, commands);
                if(cmd == null) {
                    if(msg.payload.cmd.toUpperCase() == "RAW") {
                        //Build the raw packet to be sent

                        //If the user has defined a name for the command add it to the start of the packet
                        try {
                            var nameBuffer = new Buffer.from(msg.payload.data.name);
                            msg.payload.data.packet = Buffer.concat([nameBuffer, msg.payload.data.packet]);
                        }
                        catch(error){}
                        sendBuffer.push(generatePacket(msg.payload.data.packet));
                    }
                    else {
                        node.sendStatus("red", "Unknown Command", "Unknown command: " + msg.payload.cmd);
                        return;
                    }
                }
                else {
                    var success = cmd.sendData(msg, commands);

                    //Valid request
                    if(success != null) {
                        //If we get a singular request convert it to an array
                        if(Array.isArray(success) == false) {
                            success = [success];
                        }

                        for(var i in success) {
                            var payload = success[i];
                            switch(payload.direction) {
                                //The data was stored and should just be returned
                                case "node": {
                                    if(payload.command != null) {
                                        if(typeof payload.command.payload.data === "string" || payload.command.payload.data instanceof String) {
                                            node.sendStatus("red", "Internal Error", payload.command.payload.data);
                                        }
                                        else {
                                            payload.command.topic = "command";
                                            messageCallback(payload.command);
                                        }
                                    }
                                    else {node.sendStatus("red", "Internal Error", "The returned data was null");}
                                    break;
                                }
                                //The data needs to be requested from the server
                                case "server": {
                                    //Generate the packet
                                    var nameBuffer = new Buffer.from(payload.name);
                                    sendBuffer.push(generatePacket(Buffer.concat([nameBuffer, payload.command.packet]))); 

                                    break;
                                }
                                default: {
                                    console.log("Internal Error: Unsupported direction");
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        node.sendStatus("red", "Internal Error", "The packet was null");
                    }
                }
            }
            else {
                node.sendStatus("red", "Not Connected!");
            }
        }
        

        //Process the commands that were stored
        function processReceiveBuffer() {
            for(var k = 0;  k < receiveBuffer.length; k++) {
                var message = receiveBuffer[k];
                var flag = message[0] >> 3;
                var length = ((message[0] & 0x07) << 8) | message[1];

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
                        "topic": "command",
                        "payload": {
                            "type": undefined,
                            "raw": {
                                "flag": commandList.findFlag(flag)
                            },
                            "data": {}
                        }
                    }

                    var length = cmds[i].readUInt16BE(0);
                    var name =  cmds[i].toString("UTF8", 4, 8);
                    command.payload.raw.length = length;
                    command.payload.raw.name = name;
                    command.payload.raw.packet = cmds[i]

                    switch(connectionState) {
                        case commandList.connectionStates.initializing: {
                            var cmd = commandList.findCommand(name, commands);
                            if(cmd != null) {
                                cmd.initializeData(cmds[i].slice(8, length), flag, commands, messageCallbacks);
                            }
                            break;
                        }
                        case commandList.connectionStates.connected: {
                            //Check if the command exists in the supported list
                            var cmd = commandList.findCommand(name, commands);
                            if(cmd != null) {
                                if(cmd.processData(cmds[i].slice(8, length), flag, command, commands)) {
                                    messageCallback(command);
                                }
                            }
                            else {
                                //Otherwise return raw
                                command.payload.cmd = "raw";
                                messageCallback(command);
                            }
                            break;
                        }          
                    }
                }

                receiveBuffer.splice(k, 1);
            }
        }

        //Process receive buffer
        receiveInterval = setInterval(function() {
            processReceiveBuffer();
        }, 1);
        sendInterval = setInterval(function() {
            if(sendBuffer[0] !== undefined && sendBuffer[0] !== null && connectionState == commandList.connectionStates.connected) {
                //Send the message and clear it from the buffer
                sendMessage(sendBuffer[0]);
                sendBuffer.splice(0, 1);
            }
        }, 1);

        //Generates a packet. Expects a commandPacket containing the command from the name >>
        function generatePacket(commandPacket) {
            var packet = new Buffer.alloc(16).fill(0);
            packet[0] = parseInt((16+commandPacket.length)/256 | 0x88);
            packet[1] = parseInt((16+commandPacket.length)%256);
            packet[2] = sessionId[0];
            packet[3] = sessionId[1];
            packet.writeInt16BE(localPacketId, 10);
            localPacketId++;
            if(localPacketId > 65535) {localPacketId = 1;} //Assuming when we overflow we go back to packet id 1
            packet[12] = parseInt((4+commandPacket.length)/256);
            packet[13] = parseInt((4+commandPacket.length)%256);
            return new Buffer.concat([packet, commandPacket]);
        }

        //Connect
        var connect = function() {
            //Generate random session id and update redefined commands with this id
            var randomId = Math.floor((Math.random() * 32767) + 1);
            var sessionId = new Buffer.alloc(2);
            sessionId.writeInt16BE(randomId, 0);

            //Update our packets
            packets.disconnect[2] = sessionId[0];
            packets.disconnect[3] = sessionId[1];


            packets.requestHandshake[2] = sessionId[0];
            packets.requestHandshake[3] = sessionId[1];
            packets.handshakeAnswerback[2] = sessionId[0];
            packets.handshakeAnswerback[3] = sessionId[1];


            packets.handshakeAccepted[2] = sessionId[0];
            packets.handshakeAccepted[3] = sessionId[1];

            clearInterval(heartBeatInterval);
            server = udp.createSocket('udp4');

            //Bind server events
            server.on("error", function(error) {
                switch(error.code) {
                    case "EADDRNOTAVAIL": {
                        sendError("Server error", "Address is not avalible. Check port is avaliable");
                        break;
                    }
                    default: {
                        sendError("Server error", "An error occured: " + error.code);
                    }
                }
            });

            server.bind(function() {
                sendMessage(packets.disconnect);
                connectionAttempts++;
                node.sendStatus("yellow", "Connecting");
                server.once("message", function(message, rinfo) {
                    var connectionFlag = message[12];
                    if(connectionFlag == commandList.flags.connect) {
                        if(Buffer.compare(message.slice(0, 4), packets.handshakeAccepted) === 0) {
                            sendMessage(packets.handshakeAnswerback);
                            updateConnectionState(commandList.connectionStates.initializing); 
                            node.sendStatus("yellow", "Gathering Information");
                            server.on("message", handleIncoming);
                        }
                    }
                    else if(connectionFlag == commandList.flags.full) {updateConnectionState(commandList.connectionStates.disconnected); sendError("Could not connect", "Could not connect: The ATEM reported that it's full");}
                    else {
                        updateConnectionState(commandList.connectionStates.disconnected); sendError("Could not connect", "Could not connect: Misunderstood connection state: " + connectionFlag);
                    }
                });
                sendMessage(packets.requestHandshake);
                updateConnectionState(commandList.connectionStates.connecting);
                setTimeout(function() {
                    if(connectionState == commandList.connectionStates.connecting) {
                        updateConnectionState(commandList.connectionStates.disconnected);
                        sendError("Failed to connect", "Could not connect to the ATEM: Timeout");
                    }
                }, 2000);
            });
        }
        connect();

        var check = false;
        var datas = [];
        //Handle the incoming messages from the ATEM
        var handleIncoming = function(message, rinfo) {
            if(check == true){return;}
            var length = ((message[0] & 0x07) << 8) | message[1];
            if(length == rinfo.size) {
                var flag = message[0] >> 3;
                var messageSessionId = [message[2], message[3]];
                var remotePacketId = [message[10], message[11]];
                messageTime = 0;

                //Set the sessionId
                if(sessionId === null) {
                    sessionId = messageSessionId;
                }

                //Switch the command flag sent from the ATEM
                switch(flag) {
                    case commandList.flags.heartbeat: {
                        updateConnectionState(commandList.connectionStates.connected);
                    }
                }

                //Reply to each command
                var buffer = new Buffer.alloc(12).fill(0);
                buffer[0] = 0x80;
                buffer[1] = 0x0C;
                buffer[2] = sessionId[0];
                buffer[3] = sessionId[1];
                buffer[4] = remotePacketId[0];
                buffer[5] = remotePacketId[1];
                buffer[9] = 0x41;
                sendMessage(buffer);

                //Switch based on our connection state
                switch(connectionState) {
                    case commandList.connectionStates.initializing: 
                    case commandList.connectionStates.connected: {
                        receiveBuffer.push(message);
                        break;
                    }
                }
            }
        }
    }

    //Add the node
    RED.nodes.registerType("atem-network", ATEMNetwork);
}
