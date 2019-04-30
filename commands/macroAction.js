module.exports = {
  get: "MRPr",
  set: "MAct",
  cmd: "macroAction",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
  },
  processData(data, flag, command, commandList) {
    command.payload.cmd = this.cmd;
    command.payload.data.macroId = data.readUInt16BE(2);
    command.payload.data.isRunning = data[0].toString(2)[0] == "1";
    command.payload.data.isWaiting = data[0].toString(2)[1] == "1";
    command.payload.data.isLooping = data[1].toString(2)[0] == "1";
    
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
  }
}