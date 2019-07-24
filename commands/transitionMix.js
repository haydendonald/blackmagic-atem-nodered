module.exports = {
  get: "TMxP",
  set: "CTMx",
  cmd: "transitionMix",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList);
  },
  processData(data, flag, command, commandList) {
    this.data[data[0]] = {
      "rate": data[1]
    }

    command.payload.data = this.data;
    command.payload.cmd = this.cmd;
    
    return flag==commandList.flags.initializing;
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

    if(command.payload.data == undefined || command.payload.data == null) {
      msg.direction = "node";
      msg.command.payload.data = this.data;
    }
    else {
      var me = parseInt(command.payload.data.ME);
      var rate = parseInt(command.payload.data.rate);
      if(me == undefined || me == null || Number.isNaN(me)) {
        error="The ME was not stated this is expected to be the ME number starting at 0";
      }
      if(rate == undefined || rate == null || Number.isNaN(rate)) {
        error="The rate was not stated this is a expected to be a number between 1-250 (frames)";
      }
      if(rate < 1 || rate > 250){
        error="The rate needs to be between 1 and 250 (frames) you sent " + command.payload.data.rate;
      }

      if(error === null) {
        //Process packet
        var packet = Buffer.alloc(4).fill(0);
        packet[0] = command.payload.data.ME;
        packet[1] = command.payload.data.rate;
        msg.direction = "server";
        msg.command.packet = packet;
      }
      else {
        //We had an error
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
    }
    return msg;
  },
  //What todo once we are connected
  afterInit(commandList) {
    return {
      "cmd": this.cmd,
      "data": this.data
    }
  }
}