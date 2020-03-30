const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "",
    set: "DAut",
    cmd: "performAuto",
    data: {},
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands) {
    },
    processData(data, flag, command, commands) {
      return false;
    },
    sendData(command, commands) {
      var error = null;
      var msg = {
        "direction": "node",
        "name": this.set,
        "command": {
          "payload": {
            "cmd": this.cmd,
            "data": this.data
          }
        }
      }
  
      if(command.payload.data.ME == undefined || command.payload.data.ME == null){error="ME parameter is missing";}
  
      if(error == null) {
        //Generate the packet
        var packet = Buffer.alloc(4).fill(0);
        packet[0] = command.payload.data.ME;
        msg.direction = "server";
        msg.command.packet = packet; 
        msg.payload = {"cmd":this.cmd};
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
      return false;
    }    
  }}
}