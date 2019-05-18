//BUG:: Long name and shortname need to find their end as there is garbage at the end of it
module.exports = {
  get: "InPr",
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
  initializeData(data, flag, commandList, msgCallbacks) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList);
    messageCallbacks = msgCallbacks;
  },
  processData(data, flag, command, commandList) {
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

    //Check if the input tallys exist if they do don't update the
    if(this.data.inputs[command.payload.data.id] == undefined || this.data.inputs[command.payload.data.id] == null) {
      command.payload.data.inTransition = false;
      command.payload.data.framesRemaining = false;
      command.payload.data.position = false;

      command.payload.data.tallys = {};
      command.payload.data.tallys.programTally = {
        "ID": [],
        "state": false
      }

      command.payload.data.tallys.previewTally = {
        "ID": [],
        "state": false
      }

      command.payload.data.tallys.downstreamKeyerTallyFill = {
        "ID": [],
        "state": false
      }

      command.payload.data.tallys.downstreamKeyerTallyKey = {
        "ID": [],
        "state": false
      }

      command.payload.data.tallys.upstreamKeyerTallyFill = {
        "ID": [],
        "state": false
      }

      command.payload.data.tallys.upstreamKeyerTallyKey = {
        "ID": [],
        "state": false
      }
    }
    else {
      command.payload.data.tallys = {};
      command.payload.data.tallys.programTally = this.data.inputs[command.payload.data.id].tallys.programTally;
      command.payload.data.tallys.previewTally = this.data.inputs[command.payload.data.id].tallys.previewTally;
      command.payload.data.tallys.downstreamKeyerTallyFill = this.data.inputs[command.payload.data.id].tallys.downstreamKeyerTallyFill;
      command.payload.data.tallys.downstreamKeyerTallyKey = this.data.inputs[command.payload.data.id].tallys.downstreamKeyerTallyKey;
      command.payload.data.tallys.upstreamKeyerTallyFill = this.data.inputs[command.payload.data.id].tallys.upstreamKeyerTallyFill;
      command.payload.data.tallys.upstreamKeyerTallyKey = this.data.inputs[command.payload.data.id].tallys.upstreamKeyerTallyKey;   
    }

    this.data.inputs[command.payload.data.id] = command.payload.data;
    command.payload.cmd = this.cmd;
    command.payload.data = this.data;
    //command.payload.data[data.readUInt16BE(0)] = this.data.inputs[data.readUInt16BE(0)];

    //if(flag != commandList.flags.sync){return false;}
    return true;
  },
  sendData(command, commandList) {
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
  updateTallysKeyer(id, type, inputSource, state, sendTallyUpdates) {
    if(inputSource == null || inputSource == undefined){return;}
    for(var key in this.data.inputs) {
      if(this.data.inputs[key].id == inputSource.id) {
        for(var ID in this.data.inputs[key]["tallys"][type].ID) {
            if(!state) {
              this.data.inputs[key]["tallys"][type].ID.splice(ID, 1);
            }
        }
        if(state) {
          if(!this.data.inputs[key]["tallys"][type].ID.includes(id)) {
            this.data.inputs[key]["tallys"][type].ID.push(id);
          }
        }

        this.data.inputs[key]["tallys"][type].state = this.data.inputs[key]["tallys"][type].ID.length > 0;

        var count = 0;
        for(var key2 in this.data.inputs[key]["tallys"]) {
          count += this.data.inputs[key]["tallys"][key2].ID.length;
        }

        this.data.inputs[key].tally = count > 0;

        if(sendTallyUpdates) {
          for(var i in messageCallbacks) {
            var msg = {
              "payload": {
                "cmd": this.cmd,
                "data": this.data
              }
            }
            //msg.payload.data[key] = this.data.inputs[key];
            messageCallbacks[i](msg);
          }
        }
      }
    }
  },
  updateTallysME(id, type, inputSource, sendTallyUpdates) {
    if(inputSource == null || inputSource == undefined){return;}
    //Find the last input that was live on this ME and remove it
    for(var key in this.data.inputs) {
      var wasLive = false;
      for(var ID in this.data.inputs[key]["tallys"][type].ID) {
        if(this.data.inputs[key]["tallys"][type].ID[ID] == id && this.data.inputs[key].id != inputSource.id) {
          wasLive = true;
          this.data.inputs[key]["tallys"][type].ID.splice(ID, 1);
        }
      }
      
      this.data.inputs[key]["tallys"][type].state = this.data.inputs[key]["tallys"][type].ID.length > 0;

      var count = 0;
      for(var key2 in this.data.inputs[key]["tallys"]) {
        count += this.data.inputs[key]["tallys"][key2].ID.length;
      }

      this.data.inputs[key].tally = count > 0;

      if(sendTallyUpdates && wasLive) {
        for(var i in messageCallbacks) {
            var msg = {
              "payload": {
                "cmd": this.cmd,
                "data": this.data
              }
            }
            messageCallbacks[i](msg);
          }
        }
      }
    

    //Make this current input live on the tally
    for(var key in this.data.inputs) {
      if(this.data.inputs[key].id == inputSource.id) {
        this.data.inputs[key]["tallys"][type].ID.push(id);
        this.data.inputs[key]["tallys"][type].state = true;

        var count = 0;
        for(var key2 in this.data.inputs[key]["tallys"]) {
          count += this.data.inputs[key]["tallys"][key2].ID.length;
        }

        this.data.inputs[key].tally = count > 0;

        if(sendTallyUpdates) {   
          for(var i in messageCallbacks) {
            var msg = {
              "payload": {
                "cmd": this.cmd,
                "data": this.data
              }
            }
            messageCallbacks[i](msg);
          }
        }
      }
    }
  },
  updateTallysTransitionPosition(ME, inTransition, framesRemaining, position) {
     for(var key in this.data.inputs) {
      var MEExists = false;
      for(var i in this.data.inputs[key].tallys.programTally.ID) {
        if(i == ME){MEExists = true;}
      }
      for(var i in this.data.inputs[key].tallys.previewTally.ID) {
        if(i == ME){MEExists = true;}
      }

      if(MEExists == true) {
        if(framesRemaining < 1) {inTransition = false;}
        this.data.inputs[key].inTransition = inTransition;
        this.data.inputs[key].framesRemaining = framesRemaining;
        this.data.inputs[key].position = position;
      }
    }
  }
}