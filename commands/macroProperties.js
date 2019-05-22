module.exports = {
  get: "MPrp",
  set: "",
  cmd: "macroProperties",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList, false);
  },
  processData(data, flag, command, commandList) {
    command.payload.cmd = this.cmd;
    command.payload.data.macroId = data.readUInt16BE(0);
    command.payload.data.isUsed = data[2] == 1;
    
    var nameLength = data.readUInt16BE(4);
    var descLength = data.readUInt16BE(6);
    command.payload.data.name = data.toString("UTF8", 8, 8 + nameLength);
    command.payload.data.description = data.toString("UTF8", 9 + nameLength, (9 + nameLength)  + descLength);

    //Attempt to add the properties to the action list
    try {
      commandList.list.macroAction.data[command.payload.data.macroId].macroProperties = command.payload.data;
    }
    catch(e){}

    this.data[command.payload.data.macroId] = command.payload.data;
    command.payload.cmd = this.cmd;
    command.payload.data = this.data;
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
      "cmd": this.cmd,
      "data": this.data
    }
  }
}