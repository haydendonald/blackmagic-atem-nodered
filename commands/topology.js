module.exports = {
  get: "_top",
  cmd: "topology",
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
    command.payload.MEs = data[0];
    command.payload.sources = data[1];
    command.payload.colorGenerators = data[2];
    command.payload.AUXBusses = data[3];
    command.payload.downstreamKeyers = data[4];
    command.payload.stingers = data[5];
    command.payload.DVEs = data[6];
    command.payload.superSources = data[7];
    command.payload.hasSDOutput = data[9];
    this.data = command.payload.data;
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