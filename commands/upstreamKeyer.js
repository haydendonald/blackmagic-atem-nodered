module.exports = {
  get: "KeOn",
  set: "CKOn",
  command: "upstreamKeyer",
  data: {},
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, command, commandList);
  },
  processData(data, command, commandList) {
    command.payload.cmd = this.command;
    command.payload.data.ME = data[0];

    if(this.data[command.payload.data.ME] == undefined) {
      this.data[command.payload.data.ME] = command.payload.data;
      command.payload.data.keyers = {};
      command.payload.data.keyers["keyer" + data[1]] = data[2] == 0x01;
    }
    else {
      this.data[command.payload.data.ME].keyers["keyer" + data[1]] = data[2] == 0x01;
      command.payload.data.keyers = this.data[command.payload.data.ME].keyers;
    }
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
      //Sending a empty ME will return all MEs
      if(command.payload.data.ME == undefined || command.payload.data.ME == null){
        msg.direction = "node";
        msg.command.payload.data = this.data;
      }
      //Else if the keyer is empty return all keyers on the ME
      else if(command.payload.data.keyerId == undefined || command.payload.data.keyerId == null || 
          command.payload.data.keyerState == undefined || command.payload.data.keyerState == null) {
        msg.direction = "node";
        msg.command.payload.data = this.data[command.payload.data.ME];
      }
      else {
        //Set the keyer state
        var packet = Buffer.alloc(4).fill(0);
        packet[0] = command.payload.data.ME;
        packet[1] = command.payload.data.keyerId;
        packet[2] = command.payload.data.keyerState ? 1 : 0;
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