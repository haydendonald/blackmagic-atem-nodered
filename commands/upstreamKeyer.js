const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "KeOn",
    set: "CKOn",
    cmd: "upstreamKeyer",
    data: {},
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands, false);
    },
    processData(data, flag, command, commands, sendTallyUpdates=true) {
      command.payload.cmd = this.cmd;
  
      if(this.data[((data[0] * 10) + (data[1]))] === undefined) {
        this.data[((data[0] * 10) + (data[1]))] = {};
        this.data[((data[0] * 10) + (data[1]))].fillSource = undefined;
        this.data[((data[0] * 10) + (data[1]))].keySource = undefined;
      }
  
      this.data[((data[0] * 10) + (data[1]))].ME = data[0];
      this.data[((data[0] * 10) + (data[1]))].id = data[1];
      this.data[((data[0] * 10) + (data[1]))].state = data[2] == 0x01;
      
      command.payload.data = this.data;
      commands.tally.updateTallys(commands);
      return true;
    },
    sendData(command, commands) {
      var error = null;
      var msg = {
        "direction": "node",
        "name": this.set,
        "command": {
          "payload": {
            "cmd": this.cmd,
            "data": "The data was not filled"
          }
        }
      }
  
      //If the data is null return the value
      if(command.payload.data == undefined || command.payload.data == null) {error="The data parameter was null";}
      else {
        //Sending a empty ME will return all MEs
        if(command.payload.data.ME == undefined || command.payload.data.ME == null){
          msg.direction = "node";
          msg.command.payload.data = this.data;
        }
        //Else if the keyer is empty return all keyers on the ME
        else if(command.payload.data.id == undefined || command.payload.data.id == null || 
            command.payload.data.state == undefined || command.payload.data.state == null) {
          msg.direction = "node";
          msg.command.payload.data = this.data[command.payload.data.ME];
        }
        else {
          //Set the keyer state
          var packet = Buffer.alloc(4).fill(0);
          packet[0] = command.payload.data.ME;
          packet[1] = command.payload.data.id;
          packet[2] = command.payload.data.state ? 1 : 0;
          msg.direction = "server";
          msg.command.packet = packet;
        }
      }
  
      if(error != null) {
        var msg = {
          "direction": "node",
          "command": {
            "payload": {
              "cmd": this.cmd,
              "data": error
            }
          }
        }
      }
      return msg;
    },
    //Add more keyer information
    addKeyerInformation(keyerId, fillSource, keySource, commands) {
      if(this.data[keyerId] != undefined || this.data[keyerId] != null) {
        this.data[keyerId].fillSource = fillSource;
        this.data[keyerId].keySource = keySource;
      }
    },
    //What todo once we are connected
    afterInit(commands) {
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    }    
  }}
}