var udp = require('dgram');
var ping = require("ping");
var commands = require("./commands/commandList.js");

module.exports = function(RED)
{
    //Main node definition
    function ATEMNetwork(config)
    {
        RED.nodes.createNode(this, config);
        var inProcessingIncoming = false;
        var node = this;
        var name = config.name;
        var ipAddress = config.ipAddress;
        var port = 9910;
        var server = null;
        var pingCheck = null;
        var sessionId = undefined;
        var timeoutCount = 0;
        var localPacketId = 1;
        var timeoutInterval = undefined;
        var handshakeInterval = undefined;
        var messageProcessingInterval = undefined;
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
        var receiveBuffer = [];

        //var sendInterval = setInterval(function() {processSendBuffer();}, 10);
        messageProcessingInterval = setInterval(function() {
            processReceiveBuffer();
            processSendBuffer();
        }, 10);

        //Pings the server, returns true if connected
        function checkConnection(func) {
            ping.sys.probe(ipAddress, function(status) {
                func(status);
            });
        }

        //When the flows are stopped
        this.on("close", function() {
            clearInterval(pingCheck);
            clearInterval(messageProcessingInterval);
            clearInterval(handshakeInterval);
            clearInterval(timeoutInterval);
            server.close();
            commands.close();
        });

        //Process incoming message object (this does no validation so this needs to be done before calling this fn)
        this.send = function(msg, sender) {
            if(node.information.status !== "connected") {
                node.sendStatus("red", "Not Connected!");
            }
            else {
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
                                        success.command.topic = "command";
                                        messageCallback(success.command);
                                    }
                                }
                                else {node.sendStatus("red", "Internal Error", "The returned data was null");}
                                break;
                            }
                            //The data needs to be requested from the server
                            case "server": {
                                //Generate the packet
                                var sendIt = true;
                                var nameBuffer = new Buffer.from(success.name);

                                //Check if the command already exists in the buffer, if so don't add another one!
                                for(var k in sendBuffer) {
                                    if(sendBuffer[k].commandPacket.compare(Buffer.concat([nameBuffer, success.command.packet])) == 0) {
                                        sendIt = false;
                                    }
                                }

                                if(sendIt == true) {
                                    sendBuffer.push(generatePacket(Buffer.concat([nameBuffer, success.command.packet]), sender)); 
                                }

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
        }

        //Generates a packet. Expects a commandPacket containing the command from the name >>
        function generatePacket(commandPacket, sender) {
            var message = {
                "packet": null,
                "packetId": localPacketId,
                "commandPacket": commandPacket,
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
            packet[10] = parseInt(message.packetId/256);
            packet[11] = parseInt(message.packetId%256);
            packet[12] = parseInt((4+commandPacket.length)/256);
            packet[13] = parseInt((4+commandPacket.length)%256);
            message.packet = new Buffer.concat([packet, commandPacket]);
            return message;
        }

        //Send out all commands in the send buffer
        function processSendBuffer() {
            if(sendBuffer.length > 0 && inProcessingIncoming == false) {
                if(sendBuffer[0].timeout <= 0) {
                    if(sendBuffer[0].attempts == 2) {
                        //Failed
                        sendBuffer.splice(0, 1);
                        node.sendStatus("red", "Failed to Send: Timeout");
                        timeoutCount++;
                        if(timeoutCount > 5) {
                            //We have had several timeout issues we must be disconnected
                            statusCallback("disconnected", "timeout");
                        }
                    }
                    else {
                        var success = true;
                        localPacketId++;
                        try{server.send(sendBuffer[0].packet, port, ipAddress);}
                        catch(e){node.error("Attempted to send a message but the server was closed: " + e); success = false;}
    
                        if(success) {
                            //Sent
                            sendBuffer[0].attempts = 2;
                            sendBuffer[0].timeout = 10;
                            node.sendStatus("yellow", "Sending...");
                        }
                    }
                }
                else {sendBuffer[0].timeout -= 1;}
            }
        }

        //Attempt connection to the HDL controller
        function connect(ipAddress, port) {
            //If already open, close before reconnecting
            try{server.close();}catch(error){}
            sendBuffer = [];
            receiveBuffer = [];
            sessionId = undefined;
            localPacketId = 1;

            server = udp.createSocket('udp4');
            server.on('error', function(err) {
                node.error("An Error Occured: " + err);
                node.sendStatus("red", "Internal Error", err);
            });

            //Attempt handshake
            server.bind(port);
            setTimeout(function(){handshake();}, 5000);
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
                        "topic": "status",
                        "payload": {
                            "type": "status",
                            "connectionStatus": "connected"
                        }
                    }
                    messageCallback(command);

                    //Send out the inital values
                    var cmds = [];
                    for(var key in commands.list) {
                        var cmd = {
                            "topic": "initial",
                            "payload": commands.list[key].afterInit(commands)
                        }
                        if(cmd.payload != false) {
                            cmds.push(cmd);
                        }
                    }

                    messageCallback(cmds);
                    break;
                }
                case "got-data": {
                    node.sendStatus("green", "Got Data!");
                    break;
                }
                case "error": {
                    node.sendStatus("orange", "ATEM Error");
                    var command = {
                        "topic": "status",
                        "payload": {
                            "type": "status",
                            "connectionStatus": "error",
                            "errorInformation": information
                        }
                    }
                    messageCallback(command);
                    break;
                }
                case "connecting": {
                    node.sendStatus("orange", "Connecting...");
                    node.log("Connecting to ATEM @ " + ipAddress);
                    node.information.status = "connecting";
                    var command = {
                        "topic": "status",
                        "payload": {
                            "type": "status",
                            "connectionStatus": "connecting"
                        }
                    }
                    messageCallback(command);
        
                    break;
                }
                case "disconnected": {
                    if(node.information.status !== "disconnected") {
                        node.sendStatus("red", "Disconnected!");
                        node.error("Disconnected from ATEM @ " + ipAddress);
                        node.information.status = "disconnected";
                        clearInterval(pingCheck);
                        node.information.connectionTimeout = 0;
                        commands.close();
                        var command = {
                            "topic": "status",
                            "payload": {
                                "type": "status",
                                "connectionStatus": "disconnected"
                            }
                        }
                        messageCallback(command);

                        //Close server and attempt reconnection
                        connect(ipAddress, port);
                    }
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

            handshakeInterval = setInterval(function() {
                node.sendStatus("yellow", "Attempting Handshake");
                node.log("Attempting Handshake");
                try{server.send(commands.packets.requestHandshake, port, ipAddress);}
                catch(e){node.error("Attempted to send a message but the server was closed: " + e); return;}
            }, 5000);

            // //Check for connection state
            // pingCheck = setInterval(function() {
            //     node.information.connectionTimeout++;
            //     if(node.information.connectionTimeout > 10) {
            //         //Lost connection
            //         statusCallback("disconnected", "timeout");
            //         clearInterval(pingCheck);
            //         node.information.connectionTimeout = 0;
            //     }
            // }, 5000);

            //On message
            server.on("message", function(message, rinfo) {
                processIncomingMessage(message, rinfo);
                clearInterval(handshakeInterval);
            });
        }

        function processReceiveBuffer() {
            for(var k = 0;  k <  receiveBuffer.length; k++) {
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

                    // //Answerback flag check for the command that this is a answerback for
                    if(sendBuffer.length > 0) {
                        if(name == commands.findInvertedDirectionName(sendBuffer[0].commandPacket.toString("UTF8", 0, 4)) ||  commands.findInvertedDirectionName(sendBuffer[0].commandPacket.toString("UTF8", 0, 4)) == "") {
                            //Respose
                            sendBuffer.splice(0, 1);
                            node.sendStatus("green", "Sent!");
                            timeoutCount = 0;
                        }
                    }

                    //Check for inital conditions and load in the information otherwise sync
                    //Flag 1 >> 5 >> 1 (Done)
                    if(node.information.status !== "connected") {
                        //Check if the command exists in the supported list and pass its inital information
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
                receiveBuffer.splice(k, 1);
            }

           // setTimeout(function(){inProcessingIncoming = false;}, 200);
        }
    


            //var length = ((message[0] & 0x07) << 8) | message[1];
            // if(length == rinfo.size) {
            //     inProcessingIncoming = true;
            //     var flag = message[0] >> 3;
            //     messageSessionId = [message[2], message[3]];
            //     var remotePacketId = [message[10], message[11]];



            //     if(sessionId[0] != messageSessionId[0] || sessionId[1] != messageSessionId[1]) {}
            //     else {
            //         //Our message
            //         //Check if a packet was processed
            //         //sendBuffer.splice(0, 1);// should be checking the message type. This may remove messages 

            //         //Reply to each command
            //         var buffer = new Buffer.alloc(12).fill(0);
            //         buffer[0] = 0x80;
            //         buffer[1] = 0x0C;
            //         buffer[2] = sessionId[0];
            //         buffer[3] = sessionId[1];
            //         buffer[4] = remotePacketId[0];
            //         buffer[5] = remotePacketId[1];
            //         buffer[9] = 0x41;
            //         setTimeout(function(){
            //             try{server.send(buffer, port, ipAddress);}
            //             catch(e) {node.error("Attempted to send a message but the server was closed: " + e); return;}
            //         }, 100);

            //         //Split a singular command into its parts
            //         var commandMessage = message.slice(12, length); 
            //         var cmds = [];
            //         while(commandMessage.length > 0) {
            //             var commandLength = commandMessage.readUInt16BE(0);
            //             var thisMessage = commandMessage.slice(0, commandLength);
            //             cmds.push(thisMessage);
            //             commandMessage = commandMessage.slice(commandLength, length);
            //         }

            //         //Process the commands
            //         for(var i = 0; i < cmds.length; i++) {
            //             var command = {
            //                 "topic": "command",
            //                 "payload": {
            //                     "type": undefined,
            //                     "raw": {
            //                         "flag": commands.findFlag(flag)
            //                     },
            //                     "data": {}
            //                 }
            //             }


            //             var length = cmds[i].readUInt16BE(0);
            //             var name =  cmds[i].toString("UTF8", 4, 8);
            //             command.payload.raw.length = length;
            //             command.payload.raw.name = name;
            //             command.payload.raw.packet = cmds[i];

            //             // //Answerback flag check for the command that this is a answerback for
            //             if(sendBuffer.length > 0) {
            //                 if(name == commands.findInvertedDirectionName(sendBuffer[0].commandPacket.toString("UTF8", 0, 4)) ||  commands.findInvertedDirectionName(sendBuffer[0].commandPacket.toString("UTF8", 0, 4)) == "") {
            //                     //Respose
            //                     sendBuffer.splice(0, 1);
            //                     node.sendStatus("green", "Sent!");
            //                     timeoutCount = 0;
            //                 }
            //             }

            //             //Check for inital conditions and load in the information otherwise sync
            //             //Flag 1 >> 5 >> 1 (Done)
            //             if(node.information.status != "connected") {
            //                 if(flag == commands.flags.initializing && node.information.status == "connecting"){
            //                     node.information.status = "initializing"; 
            //                     statusCallback(node.information.status, "");
            //                 }
            //                 if(flag == commands.flags.sync && node.information.status == "initializing"){
            //                     node.information.status = "connected"; 
            //                     statusCallback(node.information.status, "");
            //                 }

            //                 //Check if the command exists in the supported list
            //                 var cmd = commands.findCommand(name);
            //                 if(cmd != null) {
            //                     cmd.initializeData(cmds[i].slice(8, length), flag, commands, messageCallbacks);
            //                 }
            //             }
            //             else {
            //                 //Check if the command exists in the supported list
            //                 var cmd = commands.findCommand(name);
            //                 if(cmd != null) {
            //                     if(cmd.processData(cmds[i].slice(8, length), flag, command, commands)) {
            //                         messageCallback(command);
            //                         statusCallback("got-data", "");
            //                     }
            //                 }
            //                 else {
            //                     command.payload.cmd = "raw";
            //                     messageCallback(command);
            //                     statusCallback("got-data", "");
            //                 }
            //             }
            //         }

            //         node.information.connectionTimeout = 0;
            //     }

            //     setTimeout(function(){inProcessingIncoming = false;}, 200);

        //Process the message sent by the ATEM                                                        
        function processIncomingMessage(message, rinfo) {
            //console.log(message);
            //Reply if it's our message
            var length = ((message[0] & 0x07) << 8) | message[1];
            if(length == rinfo.size) {
                var flag = message[0] >> 3;
                var messageSessionId = [message[2], message[3]];
                var remotePacketId = [message[10], message[11]];

                //Check for disconnection
                clearInterval(timeoutInterval);
                timeoutInterval = setInterval(function() {
                    statusCallback("disconnected", "timeout");
                    clearInterval(timeoutInterval);
                }, 2000);

                //Inital connection
                if(sessionId === undefined) {
                    if(flag == commands.flags.connect) {
                        //Send handshake answerback
                        try{server.send(commands.packets.handshakeAnswerback, port, ipAddress);}
                        catch(e){node.error("Attempted to send a message but the server was closed: " + e); return;}
                    }
                    else if(flag == commands.flags.sync) {
                        sessionId = messageSessionId;
                    }
                    else {
                        node.error("Unknown connection state: " + flag);
                        statusCallback("disconnected", "Unknown Connection State");
                    }
                    return;
                }

                if(sessionId[0] != messageSessionId[0] || sessionId[1] != messageSessionId[1]) {}
                else {
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

                    //Check if we're connected
                    if(node.information.status != "connected") {
                        if(flag == commands.flags.initializing && node.information.status == "connecting") {
                            node.information.status = "initializing"; 
                            statusCallback(node.information.status, "");
                        }
                        if(message.toString("UTF8", 16, 20) === "Time" && flag == commands.flags.sync && node.information.status == "initializing") {
                            node.information.status = "connected"; 
                            setTimeout(function() {
                                statusCallback(node.information.status, "");
                            }, 2000);
                        }
                    }
                }

                receiveBuffer.push(message);
            }

            // var length = ((message[0] & 0x07) << 8) | message[1];
            // if(length == rinfo.size) {
            //     inProcessingIncoming = true;
            //     var flag = message[0] >> 3;
            //     messageSessionId = [message[2], message[3]];
            //     var remotePacketId = [message[10], message[11]];

            //     clearInterval(timeoutInterval);
            //     timeoutInterval = setInterval(function() {
            //         statusCallback("disconnected", "timeout");
            //         clearInterval(timeoutInterval);
            //     }, 2000);

            //     //Inital connection
            //     if(sessionId === undefined) {
            //         if(flag == commands.flags.connect) {
            //             //Send handshake answerback
            //             try{server.send(commands.packets.handshakeAnswerback, port, ipAddress);}
            //             catch(e){node.error("Attempted to send a message but the server was closed: " + e); return;}
            //         }
            //         else if(flag == commands.flags.sync) {
            //             sessionId = messageSessionId;
            //         }
            //         else {
            //             node.error("Unknown connection state: " + flag);
            //             statusCallback("disconnected", "Unknown Connection State");
            //         }

            //         return;
            //     }

            //     if(sessionId[0] != messageSessionId[0] || sessionId[1] != messageSessionId[1]) {}
            //     else {
            //         //Our message
            //         //Check if a packet was processed
            //         //sendBuffer.splice(0, 1);// should be checking the message type. This may remove messages 

            //         //Reply to each command
            //         var buffer = new Buffer.alloc(12).fill(0);
            //         buffer[0] = 0x80;
            //         buffer[1] = 0x0C;
            //         buffer[2] = sessionId[0];
            //         buffer[3] = sessionId[1];
            //         buffer[4] = remotePacketId[0];
            //         buffer[5] = remotePacketId[1];
            //         buffer[9] = 0x41;
            //         setTimeout(function(){
            //             try{server.send(buffer, port, ipAddress);}
            //             catch(e) {node.error("Attempted to send a message but the server was closed: " + e); return;}
            //         }, 100);

            //         //Split a singular command into its parts
            //         var commandMessage = message.slice(12, length); 
            //         var cmds = [];
            //         while(commandMessage.length > 0) {
            //             var commandLength = commandMessage.readUInt16BE(0);
            //             var thisMessage = commandMessage.slice(0, commandLength);
            //             cmds.push(thisMessage);
            //             commandMessage = commandMessage.slice(commandLength, length);
            //         }

            //         //Process the commands
            //         for(var i = 0; i < cmds.length; i++) {
            //             var command = {
            //                 "topic": "command",
            //                 "payload": {
            //                     "type": undefined,
            //                     "raw": {
            //                         "flag": commands.findFlag(flag)
            //                     },
            //                     "data": {}
            //                 }
            //             }


            //             var length = cmds[i].readUInt16BE(0);
            //             var name =  cmds[i].toString("UTF8", 4, 8);
            //             command.payload.raw.length = length;
            //             command.payload.raw.name = name;
            //             command.payload.raw.packet = cmds[i];

            //             // //Answerback flag check for the command that this is a answerback for
            //             if(sendBuffer.length > 0) {
            //                 if(name == commands.findInvertedDirectionName(sendBuffer[0].commandPacket.toString("UTF8", 0, 4)) ||  commands.findInvertedDirectionName(sendBuffer[0].commandPacket.toString("UTF8", 0, 4)) == "") {
            //                     //Respose
            //                     sendBuffer.splice(0, 1);
            //                     node.sendStatus("green", "Sent!");
            //                     timeoutCount = 0;
            //                 }
            //             }

            //             //Check for inital conditions and load in the information otherwise sync
            //             //Flag 1 >> 5 >> 1 (Done)
            //             if(node.information.status != "connected") {
            //                 if(flag == commands.flags.initializing && node.information.status == "connecting"){
            //                     node.information.status = "initializing"; 
            //                     statusCallback(node.information.status, "");
            //                 }
            //                 if(flag == commands.flags.sync && node.information.status == "initializing"){
            //                     node.information.status = "connected"; 
            //                     statusCallback(node.information.status, "");
            //                 }

            //                 //Check if the command exists in the supported list
            //                 var cmd = commands.findCommand(name);
            //                 if(cmd != null) {
            //                     cmd.initializeData(cmds[i].slice(8, length), flag, commands, messageCallbacks);
            //                 }
            //             }
            //             else {
            //                 //Check if the command exists in the supported list
            //                 var cmd = commands.findCommand(name);
            //                 if(cmd != null) {
            //                     if(cmd.processData(cmds[i].slice(8, length), flag, command, commands)) {
            //                         messageCallback(command);
            //                         statusCallback("got-data", "");
            //                     }
            //                 }
            //                 else {
            //                     command.payload.cmd = "raw";
            //                     messageCallback(command);
            //                     statusCallback("got-data", "");
            //                 }
            //             }
            //         }

            //         node.information.connectionTimeout = 0;
            //     }

            //     setTimeout(function(){inProcessingIncoming = false;}, 200);
           // }
        }
    }

    //Add the node
    RED.nodes.registerType("atem-network", ATEMNetwork);
}
