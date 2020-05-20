module.exports = function(RED)
{
    //Main Function
    function ATEM(config)
    {
        RED.nodes.createNode(this, config);
        var network = RED.nodes.getNode(config.network);
        var node = this;
        var outputMode = config.outputMode;
        var sendTime = config.sendTime;
        var sendInitial = config.sendInitialData == "yes";
        var sendStatus = config.sendStatusUpdates == "yes";
        node.status({fill:"orange",shape:"dot",text:"Connecting..."});

        network.addStatusCallback(function(color, message, extraInformation) {
          node.status({fill:color,shape:"dot",text:message});
          if(extraInformation != "") {
            node.error(extraInformation);
          }
        });

        network.addMessageCallback(function(message) {
          //Format into the correct format
          var messages = [];
          if(message.length !== undefined && message.length != null) {
            messages = message;
          }
          else {
            messages.push(message);
          }

          //Loop though the messages
          for(var msg in messages) {
              message = messages[msg];
              if(message.topic == "initial") {
                if(sendInitial) {
                  node.send(message);
                }
              }
              else if(message.topic == "status") {
                if(sendStatus) {
                  node.send(message);
                }
              }
              else if(message.topic == "command"){
                //Messages
                switch(outputMode) {
                  case "reply": { //This does not appear to be working and has been disabled
                    if(message.payload.type == "stateChanged" && msg.sender == this) {
                      if(!(sendTime === "no" && message.payload.cmd === "time")) {
                        node.send(message);
                      }
                    }
                    break;
                  }
                  case "status": {
                    if(message.payload.type == "stateChanged") {
                      if(!(sendTime === "no" && message.payload.cmd === "time")) {
                        node.send(message);
                      }
                    }
                    break;
                  }
                  case "supported": {
                    if(message.payload.cmd !== "raw") {
                      if(!(sendTime === "no" && message.payload.cmd === "time")) {
                        node.send(message);
                      }
                    }
                    break;
                  }
                  case "all": {
                    if(!(sendTime === "no" && message.payload.cmd === "time")) {
                      node.send(message);
                    }
                    break;
                  }
                }
              }
              else {
                node.status({fill:"red",shape:"dot",text:"Internal Error"});
                node.error("Unknown command topic sent check console");
                console.log("[ERROR] ATEM - Unknown command topic sent: ");
                console.log(message);
              }
            }
        });

        //Status information
        node.sendStatus = function(color, message, extraInformation) {
          if(sendStatus) {
            node.status({fill:color,shape:"dot",text:message});
            if(extraInformation != "") {
              node.error(extraInformation);
            }
          }
        }

        node.on("close", function() {
        });

        node.on("input", function(msg) {
          network.send(msg, node);
        });
    }

    RED.nodes.registerType("atem-atem", ATEM);
}
