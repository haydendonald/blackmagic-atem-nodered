module.exports = {
  get: "Time",
  cmd: "time",
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
    command.payload.data.hour = data[0];
    command.payload.data.minute = data[1];
    command.payload.data.second = data[2];
    command.payload.data.frame = data[3];

    this.data = command.payload.data;
    if(flag != commandList.flags.sync){return false;}
    return true;
  },
  sendData(command, commandList) {
    var msg = {
      "direction": "node",
      "command": {
        "payload": {
          "cmd": this.cmd,
          "data": this.data
        }
      }
    }
    
    return msg;
  }
}