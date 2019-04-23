module.exports = {
  get: "_ver",
  command: "version",
  data: {},
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, command);
  },
  processData(data, command, commandList) {
    command.payload.cmd = this.command;
    command.payload.data.version = data.readUInt16BE(0) + "." + data.readUInt16BE(2);
    this.data.version = command.payload.data.version;
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