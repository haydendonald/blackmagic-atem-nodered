const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "Time",
    set: "",
    cmd: "time",
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
      command.payload.data.hour = data[0];
      command.payload.data.minute = data[1];
      command.payload.data.second = data[2];
      command.payload.data.frame = data[3];
  
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
    afterInit(commands) {
      return false;
    }    
  }}
}