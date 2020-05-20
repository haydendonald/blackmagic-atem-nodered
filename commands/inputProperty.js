const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "InPr",
    set: "",
    cmd: "inputProperty",
    data: {
      "inputs": {}
    },
    close() {
      this.data = {
        "inputs": {},
      };
    },
    messageCallbacks: [],
    initializeData(data, flag, commands, msgCallbacks) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands);
      messageCallbacks = msgCallbacks;
    },
    processData(data, flag, command, commands) {
      command.payload.cmd = this.cmd;
      command.payload.data.id = data.readUInt16BE(0);
  
      //Find the end of the longName
      for(var i = 0; i < 20; i++) {
        if(data.toString("UTF8", 2, 2 + i).match(/^[a-zA-Z0-9_ ]*$/) == null || i == 19) {
          command.payload.data.longName = data.toString("UTF8", 2, 2 + i);
          break;
        }
      }
  
      //Find the end of the shortName
      for(var i = 0; i < 5; i++) {
        if(data.toString("UTF8", 22, 22 + i).match(/^[a-zA-Z0-9_ ]*$/) == null || i == 4) {
          command.payload.data.shortName = data.toString("UTF8", 22, 22 + i);
          break;
        }
      }
  
      command.payload.data.avalibleExternalPortTypes = {
        "SDI": data[27].toString(2)[0] == "1",
        "HDMI": data[27].toString(2)[1] == "1",
        "Component": data[27].toString(2)[2] == "1",
        "Composite": data[27].toString(2)[3] == "1",
        "SVideo": data[27].toString(2)[4] == "1",
      };
  
      var externalPortTypes = {
        0: "Internal", 
        1: "SDI",
        2: "HDMI", 
        3: "Compenent", 
        4: "Composite", 
        5: "SVideo"
      };
      command.payload.data.externalPortType = externalPortTypes[data[29]];
  
      var portTypes = {
        0: "External",
        1: "Black",
        2: "Color Bars",
        3: "Color Generator",
        4: "Media Player Fill",
        5: "Media Player Key",
        6: "SuperSource",
        128: "ME Output",
        129: "Auxilary",
        130: "Mask"
      }
      command.payload.data.portType = portTypes[data[30]];
      
      command.payload.data.avaliability = {
        "Auxilary": data[32].toString(2)[0] == "1",
        "Multiviewer": data[32].toString(2)[1] == "1",
        "SuperSourceArt": data[32].toString(2)[2] == "1",
        "SuperSourceBox": data[32].toString(2)[3] == "1",
        "KeySources": data[32].toString(2)[4] == "1",
      };
  
      command.payload.data.MEAvaliability = {
        "ME1PlusFillSources": data[33].toString(2)[0] == "1",
        "ME2PlusFillSources": data[33].toString(2)[1] == "1",
      };
  
      this.data.inputs[command.payload.data.id] = command.payload.data;
      command.payload.cmd = this.cmd;
      command.payload.data = this.data;

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
    findInput(inputId) {
      //Input source
      for(var key in this.data.inputs) {
        if(key == inputId) {return this.data.inputs[key];}
      }
      //Long name
      for(var key in this.data.inputs) {
        if(this.data.inputs[key].longName == inputId) {return this.data.inputs[key];}
      }
      //Short name
      for(var key in this.data.inputs) {
        if(this.data.inputs[key].shortName == inputId) {return this.data.inputs[key];}
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