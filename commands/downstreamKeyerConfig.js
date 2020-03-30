const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "DskB",
    set: "",
    cmd: "downstreamKeyerConfig",
    data: {},
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands);
    },
    processData(data, flag, command, commands) {
      //Put this data in the downstream keyer
      this.data[data[0]] = {};
      this.data[data[0]].fillSourceID = data.readUInt16BE(2);
      this.data[data[0]].fillSource = commands.inputProperty.findInput(data.readUInt16BE(2));
      this.data[data[0]].keySourceID = data.readUInt16BE(4);
      this.data[data[0]].keySource = commands.inputProperty.findInput(data.readUInt16BE(4));
      commands.downstreamKeyer.addKeyerInformation(data[0], this.data[data[0]].fillSource, this.data[data[0]].keySource, commands);
      return false;
    },
    sendData(command, commands) {
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
    afterInit(commands) {
      for(var i in this.data) {
        this.data[i].fillSource = commands.inputProperty.findInput(this.data[i].fillSourceID);
        this.data[i].keySource = commands.inputProperty.findInput(this.data[i].keySourceID);
        commands.downstreamKeyer.addKeyerInformation(i, this.data[i].fillSource, this.data[i].keySource, commands);
      }
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    }    
  }}
}