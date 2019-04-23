//BUG:: Long name and shortname need to find their end as there is garbage at the end of it
module.exports = {
  get: "InPr",
  command: "inputProperty",
  data: {
    "inputs": {}
  },
  messageCallbacks: [],
  initializeData(data, flag, commandList, msgCallbacks) {
    var command = {"payload":{}};
    this.processData(data, command);
    messageCallbacks = msgCallbacks;
  },
  processData(data, command, commandList) {
    command.payload.id = data.readUInt16BE(0);
    command.payload.longName = data.toString("UTF8", 2, 21);
    command.payload.shortName = data.toString("UTF8", 22, 26);
    command.payload.avalibleExternalPortTypes = {
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
    command.payload.externalPortType = externalPortTypes[data[29]];

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
    command.payload.portType = portTypes[data[30]];
    
    command.payload.avaliability = {
      "Auxilary": data[32].toString(2)[0] == "1",
      "Multiviewer": data[32].toString(2)[1] == "1",
      "SuperSourceArt": data[32].toString(2)[2] == "1",
      "SuperSourceBox": data[32].toString(2)[3] == "1",
      "KeySources": data[32].toString(2)[4] == "1",
    };

    command.payload.MEAvaliability = {
      "ME1PlusFillSources": data[33].toString(2)[0] == "1",
      "ME2PlusFillSources": data[33].toString(2)[1] == "1",
    };

    command.payload.programTally = {
      "ME": null,
      "state": false
    }

    command.payload.previewTally = {
      "ME": null,
      "state": false
    }

    this.data.inputs[command.payload.id] = command.payload;
    command.payload.cmd = this.command;
  },
  sendData(command, commandList) {
    var msg = {
      "direction": "node",
      "command": {
        "payload": {
          "cmd": this.command,
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
  updateTallys(me, type, inputSource) {
    if(inputSource == null || inputSource == undefined){return;}

    //Find the last input that was live on this ME and remove it
    for(var key in this.data.inputs) {
      if(this.data.inputs[key][type].ME == me) {
        this.data.inputs[key][type].ME = null;
        this.data.inputs[key][type].state = false;
        for(var i in messageCallbacks) {
          var msg = {
            "payload": {
              "data": this.data.inputs[key]
            }
          }
          messageCallbacks[i](msg);
        }
      }
    }

    //Make this current input live on the tally
    for(var key in this.data.inputs) {
      if(this.data.inputs[key].id == inputSource.id) {
        this.data.inputs[key][type].ME = me;
        this.data.inputs[key][type].state = true;
        for(var i in messageCallbacks) {
          var msg = {
            "payload": {
              "data": this.data.inputs[key]
            }
          }
          messageCallbacks[i](msg);
        }
      }
    }
  }
}