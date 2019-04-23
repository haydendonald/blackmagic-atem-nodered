module.exports = function(RED)
{
    //Main Function
    function ATEM(config)
    {
        RED.nodes.createNode(this, config);
        var network = RED.nodes.getNode(config.network);
        var node = this;
        var outputMode = config.outputMode;
        node.status({fill:"orange",shape:"dot",text:"Connecting..."});

        network.addStatusCallback(function(color, message, extraInformation) {
          node.status({fill:color,shape:"dot",text:message});
          if(extraInformation != "") {
            node.error(extraInformation);
          }
        });

        network.addMessageCallback(function(message) {
          switch(outputMode) {
            case "reply": {
              if(message.payload.type == "stateChanged" && msg.sender == this) {
                node.send(message);
              }
              break;
            }
            case "status": {
              if(message.payload.type == "stateChanged") {
                node.send(message);
              }
              break;
            }
            case "all": {
              node.send(message);
              break;
            }
          }
        });

        //Status information
        node.sendStatus = function(color, message, extraInformation) {
          node.status({fill:color,shape:"dot",text:message});
          if(extraInformation != "") {
            node.error(extraInformation);
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
