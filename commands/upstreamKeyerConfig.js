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
    // commandList.list.upstreamKeyer.addKeyerInformation(((data[0] * 10) + (data[1])), commandList.list.inputProperty.findInput(data.readUInt16BE(6)), 
    //   commandList.list.inputProperty.findInput(data.readUInt16BE(8)), commandList);

    var keyerID = ((data[0] * 10) + (data[1]));
    this.data[keyerID] = {};
    this.data[keyerID].fillSourceID = data.readUInt16BE(6);
    this.data[keyerID].fillSource = commandList.list.inputProperty.findInput(data.readUInt16BE(6));
    this.data[keyerID].keySourceID = data.readUInt16BE(8);
    this.data[keyerID].keySource = commandList.list.inputProperty.findInput(data.readUInt16BE(8));
    commandList.list.upstreamKeyer.addKeyerInformation(keyerID, this.data[keyerID.fillSource], this.data[keyerID.keySource], commandList);
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
      commandList.list.upstreamKeyer.addKeyerInformation(i, this.data[i].fillSource, this.data[i].keySource, commandList);
    }
    return {
      "cmd": this.cmd,
      "data": this.data
    }
  }
}