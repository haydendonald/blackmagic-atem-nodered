const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "DskS",
    set: "CDsL",
    cmd: "downstreamKeyer",
    data: {},
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands, false);
    },
    processData(data, flag, command, commands, sendTallyUpdates=true) {
      command.payload.cmd = this.cmd;
  
      if(this.data[data[0]] == undefined || this.data[data[0]] == null) {
        this.data[data[0]] = {};
        this.data[data[0]].fillSource = undefined;
        this.data[data[0]].keySource = undefined;
      }
      this.data[data[0]].state = data[1] == 0x01;
      this.data[data[0]].inTransition = data[2] == 0x01;
      this.data[data[0]].isAutoTransitioning = data[3] == 0x01;
      this.data[data[0]].framesRemaining = data[4];
      command.payload.data = this.data;

      if(sendTallyUpdates === true) {commands.tally.updateTallys(commands);}
      return true;
    },
    sendData(command, commands) {
      var error = null;
      var msg = {
        "direction": "node",
        "name": this.set,
        "command": {
          "payload": {
            "cmd": this.cmd,
            "data": "The data was not filled"
          }
        }
      }
  
      //If the data is null return the value
      if(command.payload.data == undefined || command.payload.data == null) {error="The data parameter was null";}
      else {
        if(command.payload.data.id == undefined || command.payload.data.id == null) {
          msg.direction = "node";
          msg.command.payload.data = this.data;
        }
        else if(command.payload.data.state == undefined || command.payload.data.state == null) {
          msg.direction = "node";
          msg.command.payload.data = this.data[command.payload.data.id];
        }
        else {
          var packet = Buffer.alloc(4).fill(0);
          packet[0] = command.payload.data.id;
          packet[1] = command.payload.data.state ? 1 : 0;
          msg.direction = "server";
          msg.command.packet = packet;
        }
      }
  
      if(error != null) {
        var msg = {
          "direction": "node",
          "command": {
            "payload": {
              "cmd": this.cmd,
              "data": error
            }
          }
        }
      }
      return msg;
    },
    //Add more keyer information
    addKeyerInformation(keyerId, fillSource, keySource, commands) {
      var keyer = this.data[keyerId];
      if(keyer != undefined && keyer != null) {
        keyer.fillSource = fillSource;
        keyer.keySource = keySource;
      }
    },
    //What todo once we are connected
    afterInit() {
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    }    
  }}
}