const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "AMmO",
    set: "CAMm",
    cmd: "audioMixerMonitor",
    data: {},
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands);
    },
    processData(data, flag, command, commands) {
  
      this.data = {
        "enabled": data[0] == true,
        "volume": (data.readUInt16BE(2) / 65381) * 100,
        "muteEnabled": data[4] == true,
        "soloEnabled": data[5] == true,
        "soloInput": data.readUInt16BE(6),
        "dimEnabled": data[7] == true
      };
  
      //Search for the solo audio input
      this.data.soloInput = {
        "id": this.data.soloInput,
        "input": commands.audioMixerInput.findMixerInput(this.data.soloInput)
      };
  
      command.payload.cmd = this.cmd;
      command.payload.data = this.data;
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
      if(!commandList.exists(command.payload.data) || command.payload.data === {}) {
        msg.command.payload.data = this.data;
        return msg;
      }
      else {
        var packet = Buffer.alloc(12).fill(0);
        packet[0] = 0xFF;
        
        //Enabled
        if(commandList.exists(command.payload.data.enabled)) {
          packet[1] = command.payload.data.enabled == true ? 0x01: 0x00;
        }
        else {
          packet[1] =  this.data.enabled == true ? 0x01: 0x00;
        }
  
        //Volume
        if(commandList.exists(command.payload.data.volume)) {
          packet.writeUInt16BE((parseFloat(command.payload.data.volume) / 100) * 65381, 2);
        }
        else {
          packet.writeUInt16BE((parseFloat(this.data.volume) / 100) * 65381, 2);
        }
  
        //Mute
        if(commandList.exists(command.payload.data.muteEnabled)) {
          packet[4] = command.payload.data.muteEnabled == true ? 0x01: 0x00;
        }
        else {
          packet[4] =  this.data.muteEnabled == true ? 0x01: 0x00;
        }
  
        //Solo
        if(commandList.exists(command.payload.data.soloEnabled)) {
          packet[5] = command.payload.data.soloEnabled == true ? 0x01: 0x00;
        }
        else {
          packet[5] =  this.data.soloEnabled == true ? 0x01: 0x00;
        }
  
        //Solo Input
        if(commandList.exists(command.payload.data.soloInput)) {
            if(Number.isInteger(command.payload.data.soloInput)) {
              //Use the input number
              packet.writeUInt16BE(parseInt(command.payload.data.soloInput), 6);
            }
            else {
              //Search for the input name
              var input = commands.audioMixerInput.findMixerInput(command.payload.data.soloInput);
              if(input !== undefined) {
                packet.writeUInt16BE(input.id, 6);
              }
              else {
                error = "Input was not found!";
              }
          }
        }
        else {
          packet.writeUInt16BE(parseInt(this.data.soloInput), 6);
        }
  
        //Dim Enabled
        if(commandList.exists(command.payload.data.dimEnabled)) {
          packet[8] = command.payload.data.dimEnabled == true ? 0x01: 0x00;
        }
        else {
          packet[8] =  this.data.dimEnabled == true ? 0x01: 0x00;
        }
  
        if(error != null) {
          //Error occured
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
        else {
          //Success
          msg.direction = "server";
          msg.command.packet = packet;
        }
        return msg;
      }
    },
    //What todo once we are connected
    afterInit(commands) {
      //Update the video source
      for(var i in this.data) {
        this.data[i].videoSource = commands.inputProperty.findInput(this.data[i].inputNumber);
      }
  
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    }    
  }}
}