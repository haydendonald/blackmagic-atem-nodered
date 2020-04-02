const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "MvIn",
    set: "CMvI",
    cmd: "multiViewerInput",
    data: {},
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands);
    },
    processData(data, flag, command, commands) {
      //If we haven't seen this multiviewer yet add it
      if(this.data[data[0]] === undefined || this.data[data[0]] === null) {
        this.data[data[0]] = {
          "id": data[0],
          "windows": {}
        };
      }

      //Add the window information
      this.data[data[0]].windows = {
        "index": data[1],
        "inputId": data.readUInt16BE(2),
        "videoSource": commands.inputProperty.findInput(data.readUInt16BE(2))
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
        var packet = Buffer.alloc(4).fill(0);
  
        //Attempt to get the input id
        var inputId = undefined;
        if(commandList.exists(command.payload.data.inputId)) {inputId = parseInt(command.payload.data.inputId);}
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

        //Validate
        if(commandList.exists(command.payload.data.multiViewerId)) {
          packet[0] = parseInt(command.payload.data.multiViewerId);
        } else {error = "multiViewerId was not found!";}
        if(commandList.exists(command.payload.data.windowIndex)) {
          packet[1] = parseInt(command.payload.data.windowIndex);
        } else {error = "windowIndex was not found!";}

        //If there was no error finish the packet and send it 
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
        for(var j in this.data[i]) {
          this.data[i].windows[j].videoSource = commands.inputProperty.findInput(this.data[i].windows[j].inputid);
        }
      }
      
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    }
  }}
}