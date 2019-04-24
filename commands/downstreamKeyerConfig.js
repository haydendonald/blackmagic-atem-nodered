module.exports = {
  get: "DskB",
  set: "",
  cmd: "downstreamKeyerConfig",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList);
  },
  processData(data, flag, command, commandList) {
    if(flag != commandList.flags.initializing){return false;}

    //Put this data in the downstream keyer
    commandList.list.downstreamKeyer.addKeyerInformation(data[0], commandList.list.inputProperty.findInput(data.readUInt16BE(2)), 
      commandList.list.inputProperty.findInput(data.readUInt16BE(4)), commandList);


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