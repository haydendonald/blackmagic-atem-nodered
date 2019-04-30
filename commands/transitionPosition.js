module.exports = {
  get: "TrPs",
  set: "CTPs",
  cmd: "transitionPosition",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList);
  },
  processData(data, flag, command, commandList) {
    command.payload.cmd = this.cmd;
    command.payload.data.ME = data[0];
    command.payload.data.inTransition = data[1] == 0x01;
    command.payload.data.framesRemaining = data[2];
    command.payload.data.position = data.readUInt16BE(4);
    this.data[command.payload.data.ME] = command.payload.data;

    //Pass this information to the current live inputs on the ME
    commandList.list.inputProperty.updateTallysTransitionPosition(data[0]);
    if(flag != commandList.flags.sync){return false;}
    return true;
  },
  sendData(command, commandList) {
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
  }
}