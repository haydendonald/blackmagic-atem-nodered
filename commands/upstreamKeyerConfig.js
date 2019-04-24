module.exports = {
  get: "KeBP",
  set: "",
  cmd: "upstreamKeyerConfig",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList);
  },
  processData(data, flag, command, commandList) {

    //Put this data in the upstream keyer (Each keyerid is the meid + 1 * the keyer id + 1)
    commandList.list.upstreamKeyer.addKeyerInformation(((data[0] * 10) + (data[1])), commandList.list.inputProperty.findInput(data.readUInt16BE(6)), 
      commandList.list.inputProperty.findInput(data.readUInt16BE(8)), commandList);

    if(flag != commandList.flags.initializing){return false;}
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