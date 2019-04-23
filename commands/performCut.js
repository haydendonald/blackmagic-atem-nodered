module.exports = {
  get: "",
  set: "DCut",
  command: "performCut",
  data: {},
  initializeData(data, flag, commandList) {
  },
  processData(data, command, commandList) {
  },
  sendData(command, commandList) {
    var error = null;
    var msg = {
      "direction": "node",
      "name": this.set,
      "command": {
        "payload": {
          "cmd": this.command,
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
    }

    if(error != null) {
      var msg = {
        "direction": "node",
        "command": {
          "payload": {
            "cmd": this.command,
            "data": error
          }
        }
      }
    }
    return msg;
  }
}