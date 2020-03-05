module.exports = {
  get: "MRPr",
  set: "MAct",
  cmd: "macroAction",
  macroCount: 100,
  data: undefined,
  close() {
    this.data = undefined;
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};

    //If there is no default data fill it assuming no macros are running
    if(this.data === undefined){
      this.data = {};
      for(var i = 0; i < this.macroCount; i++){
        this.data[i] = {};
        this.data[i].macroId = i;
        this.data[i].running = false;
        this.data[i].waiting = false;
        this.data[i].isLooping = false;
        this.data[i].macroProperties = {};
      }
    }

    this.processData(data, flag, command, commandList, false);
  },
  processData(data, flag, command, commandList) {
    if(data.readUInt16BE(2) > this.macroCount) {
      for(var i in this.data) {
        this.data[i].running = data[0].toString(2)[0] == "1";
        this.data[i].waiting = data[0].toString(2)[1] == "1";
        this.data[i].isLooping = data[1].toString(2)[0] == "1";
      }
    }
    else {
      //This causes a crash for some reason
      // this.data[data.readUInt16BE(2)].running = data[0].toString(2)[0] == "1";
      // this.data[data.readUInt16BE(2)].waiting = data[0].toString(2)[1] == "1";
      // this.data[data.readUInt16BE(2)].isLooping = data[1].toString(2)[0] == "1";
    }

    command.payload.cmd = this.cmd;
    command.payload.data = this.data;
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
          "data": this.data
        }
      }
    }

    if(command.payload.data.macroId == undefined || command.payload.data.macroId == null){error="macroId parameter is missing";}
    if(command.payload.data.action == undefined || command.payload.data.action == null){error="action parameter is missing";}
    var action = null;
    switch(command.payload.data.action.toLowerCase()) {
      case "run": {action = 0x00; break;}
      case "stop": {action = 0x01; break;}
      case "stoprecording": {action = 0x02; break;}
      case "insertwaitforuser": {action = 0x03; break;}
      case "continue": {action = 0x04; break;}
      case "deletemacro": {action = 0x05; break;}
      default: {error="action parameter is missing. This should be run, stop, stopRecording, intertWaitForUser, continue, or deleteMacro"; break;}
    }

    if(error == null) {
      //Generate the packet
      var packet = Buffer.alloc(4).fill(0);
      packet.writeInt16BE(command.payload.data.macroId, 0);
      packet[2] = action;
      msg.direction = "server";
      msg.command.packet = packet; 
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
  afterInit() { 
    return {
      "cmd": this.cmd,
      "data": this.data
    }
  }
}