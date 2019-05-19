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
    command.payload.data.MEs = data[0];
    command.payload.data.sources = data[1];
    command.payload.data.colorGenerators = data[2];
    command.payload.data.AUXBusses = data[3];
    command.payload.data.downstreamKeyers = data[4];
    command.payload.data.stingers = data[5];
    command.payload.data.DVEs = data[6];
    command.payload.data.superSources = data[7];
    command.payload.data.hasSDOutput = data[9];
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
  },
  //What todo once we are connected
  afterInit() {
    return {
      "command": this.cmd,
      "data": this.data
    }
  }
}