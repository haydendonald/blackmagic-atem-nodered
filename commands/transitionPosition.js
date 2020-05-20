const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "TrPs",
    set: "CTPs",
    cmd: "transitionPosition",
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
      command.payload.data.ME = data[0];
      command.payload.data.inTransition = data[1] == 0x01;
      command.payload.data.framesRemaining = data[2];
      command.payload.data.position = data.readUInt16BE(4);
      this.data[command.payload.data.ME] = command.payload.data;
  
      //Pass this information to the current live inputs on the ME
      commands.programInput.updateTransitionPosition(data[0], data[1] == 0x01, data[2], data.readUInt16BE(4));
      commands.previewInput.updateTransitionPosition(data[0], data[1] == 0x01, data[2], data.readUInt16BE(4));
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
  
      if(command.payload.data == undefined || command.payload.data == null) {error="The data parameter was null";}
      else {
          if(command.payload.data.ME == undefined || command.payload.data.ME == null){
            //Return all MEs
            msg.direction = "node";
            msg.command.payload.data = this.data;
          }
          else {
            if(command.payload.data.position == undefined || command.payload.data.position == null) {
              //Get the position
              msg.direction = "node";
              msg.command.payload.data = this.data[command.payload.data.ME];
            }
            else {
              //Set the position
              var packet = Buffer.alloc(4).fill(0);
              packet[0] = command.payload.data.ME;
              packet.writeInt16BE(command.payload.data.position, 2);
              msg.direction = "server";
              msg.command.packet = packet;
            }
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
    //What todo once we are connected
    afterInit(commands) {
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    }    
  }}
}