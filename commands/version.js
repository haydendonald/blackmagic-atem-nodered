const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "_ver",
    set: "",
    cmd: "version",
    data: {},
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands);
    },
    processData(data, flag, command, commands) {
      command.payload.cmd = this.cmd;
      command.payload.data.version = data.readUInt16BE(0) + "." + data.readUInt16BE(2);
      this.data.version = command.payload.data.version;
      if(flag != commandList.flags.sync){return false;}
      return true;
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
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    },
    getVersion() {
      return this.data.version;
    }   
  }}
}