module.exports = {
  get: "Time",
  command: "time",
  data: {},
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, command);
  },
  processData(data, command, commandList) {
    command.payload.cmd = this.command;
    command.payload.data.hour = data[0];
    command.payload.data.minute = data[1];
    command.payload.data.second = data[2];
    command.payload.data.frame = data[3];

    this.data = command.payload.data;
  },
  sendData(command, commandList) {
    var msg = {
      "direction": "node",
      "command": {
        "payload": {
          "cmd": this.command,
          "data": this.data
        }
      }
    }
    
    return msg;
  }
}