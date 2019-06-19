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
    //Put this data in the downstream keyer
    this.data[data[0]] = {};
    this.data[data[0]].fillSourceID = data.readUInt16BE(2);
    this.data[data[0]].fillSource = commandList.list.inputProperty.findInput(data.readUInt16BE(2));
    this.data[data[0]].keySourceID = data.readUInt16BE(4);
    this.data[data[0]].keySource = commandList.list.inputProperty.findInput(data.readUInt16BE(4));
    commandList.list.downstreamKeyer.addKeyerInformation(data[0], this.data[data[0]].fillSource, this.data[data[0]].keySource, commandList);
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
  afterInit(commandList) {
    for(var i in this.data) {
      this.data[i].fillSource = commandList.list.inputProperty.findInput(this.data[i].fillSourceID);
      this.data[i].keySource = commandList.list.inputProperty.findInput(this.data[i].keySourceID);
      commandList.list.downstreamKeyer.addKeyerInformation(i, this.data[i].fillSource, this.data[i].keySource, commandList);
    }
    return {
      "cmd": this.cmd,
      "data": this.data
    }
  }
}