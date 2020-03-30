const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "AMIP",
    set: "CAMI",
    cmd: "audioMixerInput",
    data: {},
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands);
    },
    processData(data, flag, command, commands) {
  
      this.data[data.readUInt16BE(0)] = {
        "id": data.readUInt16BE(0),
        "input": undefined,
        "type": data[2],
        "fromMediaPlayer": data[6] == 0x01,
        "plugType": data[7],
        "mixOption": data[8],
        "volume": (data.readUInt16BE(10) / 65381) * 100,
        "balance": (data.readInt16BE(12) / 10000) * 100
      };
  
      //Search for the input type
      for(var key in commandList.audioMixer.inputTypes) {
        if(commandList.audioMixer.inputTypes[key] == this.data[data.readUInt16BE(0)].type) {
          this.data[data.readUInt16BE(0)].type = key;
        }
      }
  
      //Search for the plug type
      for(var key in commandList.audioMixer.plugTypes) {
        if(commandList.audioMixer.plugTypes[key] == this.data[data.readUInt16BE(0)].plugType) {
          this.data[data.readUInt16BE(0)].plugType = key;
        }
      }
  
      //Search for the mix option
      for(var key in commandList.audioMixer.mixOptions) {
        if(commandList.audioMixer.mixOptions[key] == this.data[data.readUInt16BE(0)].mixOption) {
          this.data[data.readUInt16BE(0)].mixOption = key;
        }
      }
  
      //Search for the input for this audio input. Only bother with < 1000 as they seem to be the only channels that follow the inputs
      if(this.data[data.readUInt16BE(0)].id < 1000) {
        this.data[data.readUInt16BE(0)].input = commands.inputProperty.findInput(this.data[data.readUInt16BE(0)].id);
      }
  
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
  
        //Attempt to get the input id
        var inputId = undefined;
        if(commandList.exists(command.payload.data.id)) {inputId = parseInt(command.payload.data.id);}
        else if(commandList.exists(command.payload.data.input)) {
          var searchBy = undefined;
          if(commandList.exists(command.payload.data.input.id)){searchBy = command.payload.data.input.id;}
          else if(commandList.exists(command.payload.data.input.shortName)){searchBy = command.payload.data.input.shortName;}
          else if(commandList.exists(command.payload.data.input.longName)){searchBy = command.payload.data.input.longName;}
          
          var input = this.findMixerInput(searchBy);
          if(input !== undefined) {
            inputId = input.id;
          }
        }
        if(inputId === undefined) {
          error = "Input was not found!";
        }
        packet.writeUInt16BE(inputId, 2);
  
        //Search for the mix option
        var searchBy = this.data[inputId].mixOption;
        if(commandList.exists(command.payload.data.mixOption)) {
          searchBy = command.payload.data.mixOption.toLowerCase();
        }
        var mixOption = commandList.audioMixer.mixOptions[searchBy];
        if(commandList.exists(mixOption) == false) {
          error = "Mix option was not found!";
        }
        packet[4] = mixOption;
  
        //Volume
        var volume = this.data[inputId].volume;
        if(commandList.exists(command.payload.data.volume) == true) {
          volume = parseFloat(command.payload.data.volume);
        }
        packet.writeUInt16BE((volume / 100) * 65381, 6);
  
        //Balance
        var balance = this.data[inputId].balance;
        if(commandList.exists(command.payload.data.balance) == true) {
          balance = parseFloat(command.payload.data.balance);
        }
        packet.writeInt16BE((balance / 100) * 10000, 8);
  
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
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    },
    //Pass a raw id or channel name to get a channel
    findMixerInput(inputId) {
      //Input source
      for(var key in this.data) {
        if(key == inputId) {return this.data[key];}
      }
  
      //Name
      for(var key in this.data) {
        if(this.data[key].input !== undefined) {
          if(this.data[key].input.longName == inputId) {return this.data[key];}
          if(this.data[key].input.shortName == inputId) {return this.data[key];}
        }
      }
  
      return undefined;
    },    
  }}
}