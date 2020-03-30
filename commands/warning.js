const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "Warn",
    set: "",
    cmd: "warning",
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
      command.payload.data.warningMessage = data.toString("UTF8", 0, 43);
      console.log("[WARN] Blackmagic ATEM Reports an Warning: " + command.payload.data.warningMessage);
      this.data = command.payload.data;
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
    afterInit() {
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    }
  }}
}