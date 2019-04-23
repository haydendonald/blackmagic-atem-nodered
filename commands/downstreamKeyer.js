module.exports = {
  get: "DskS",
  set: "CDsL",
  command: "downstreamKeyer",
  data: {},
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, command, commandList);
  },
  processData(data, command, commandList) {
    command.payload.cmd = this.command;
    command.payload.data["keyer" + data[0]] = {
      "onAir": data[1] == 0x01,
      "inTransition" : data[2] == 0x01,
      "isAutoTransitioning": data[3] == 0x01,
      "framesRemaining": data[4]
    }

    this.data["keyer" + data[0]] = command.payload.data["keyer" + data[0]];
  },
  sendData(command, commandList) {
    var error = null;
    var msg = {
      "direction": "node",
      "name": this.set,
      "command": {
        "payload": {
          "cmd": this.command,
          "data": "The data was not filled"
        }
      }
    }

    //If the data is null return the value
    if(command.payload.data == undefined || command.payload.data == null) {error="The data parameter was null";}
    else {
      if(command.payload.data.keyerId == undefined || command.payload.data.keyerId == null) {
        msg.direction = "node";
        msg.command.payload.data = this.data;
      }
      else if(command.payload.data.keyerState == undefined || command.payload.data.keyerState == null) {
        msg.direction = "node";
        msg.command.payload.data = this.data["keyer" + command.payload.data.keyerId];
      }
      else {
        var packet = Buffer.alloc(4).fill(0);
        packet[0] = command.payload.data.keyerId;
        packet[1] = command.payload.data.keyerState ? 1 : 0;
        msg.direction = "server";
        msg.command.packet = packet;
      }
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