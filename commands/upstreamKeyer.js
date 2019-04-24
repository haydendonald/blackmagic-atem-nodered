module.exports = {
  get: "KeOn",
  set: "CKOn",
  cmd: "upstreamKeyer",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList, false);
  },
  processData(data, flag, command, commandList, sendTallyUpdates=true) {
    command.payload.cmd = this.cmd;

    if(this.data["keyer" + ((data[0] * 10) + (data[1]))] == undefined) {
      this.data["keyer" + ((data[0] * 10) + (data[1]))] = {};
      this.data["keyer" + ((data[0] * 10) + (data[1]))].fillSource = undefined;
      this.data["keyer" + ((data[0] * 10) + (data[1]))].keySource = undefined;
    }

    this.data["keyer" + ((data[0] * 10) + (data[1]))].ME = data[0];
    this.data["keyer" + ((data[0] * 10) + (data[1]))].id = data[1];
    this.data["keyer" + ((data[0] * 10) + (data[1]))].state = data[2] == 0x01;

    command.payload.data[["keyer" + ((data[0] * 10) + (data[1]))]] = this.data["keyer" + ((data[0] * 10) + (data[1]))];

    commandList.list.inputProperty.updateTallysKeyer(((data[0] * 10) + (data[1])), "upstreamKeyerTallyFill", this.data["keyer" + ((data[0] * 10) + (data[1]))].fillSource,  data[2] == 0x01, sendTallyUpdates);
    commandList.list.inputProperty.updateTallysKeyer(((data[0] * 10) + (data[1])), "upstreamKeyerTallyKey", this.data["keyer" + ((data[0] * 10) + (data[1]))].keySource,  data[2] == 0x01, sendTallyUpdates);
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
            "cmd": this.cmd,
            "data": error
          }
        }
      }
    }
    return msg;
  },
  //Add more keyer information
  addKeyerInformation(keyerId, fillSource, keySource, commandList) {
    if(this.data["keyer" + keyerId] != undefined && this.data["keyer" + keyerId] != null) {
      this.data["keyer" + keyerId].fillSource = fillSource;
      this.data["keyer" + keyerId].keySource = keySource;
      commandList.list.inputProperty.updateTallysKeyer(keyerId, "upstreamKeyerTallyFill", this.data["keyer" + keyerId].fillSource,  this.data["keyer" + keyerId].onAir, false);
      commandList.list.inputProperty.updateTallysKeyer(keyerId, "upstreamKeyerTallyKey", this.data["keyer" + keyerId].keySource, this.data["keyer" + keyerId].onAir, false);
    }
  }
}