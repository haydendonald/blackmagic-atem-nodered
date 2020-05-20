const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "",
    set: "",
    cmd: "tally",
    data: {},
    messageCallbacks: [],
    close() {
      this.data = {};
    },
    initializeData(data, flag, commands, msgCallbacks) {
      messageCallbacks = msgCallbacks;
    },
    processData(data, flag, command, commands) {
    },
    sendData(command, commands) {
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
    },
    updateTallys(commands, command) {
      for(var i in commands.inputProperty.data.inputs) {
        if(this.data[i] !== undefined) {
          var inTransition = this.data[i].inTransition;
        }

        this.data[i] = {
          "inTransition": {
            "tally": false,
            "mes": []
          },
          "program": {
            "tally": false,
            "mes": []
          },
          "preview": {
            "tally": false,
            "mes": []
          },
          "upstreamKeyer": {
            "tally": false,
            "keyers": {}
          },
          "downstreamKeyer": {
            "tally": false,
            "keyers": {}
          },
          // "superSource": {
          //   "tally": false,
          //   "boxes": []
          // }
        };

        //Find if live on MEs
        for(var j in commands.programInput.data) {
          if(commands.programInput.data[j].inputNumber == i) {
            this.data[i].program.tally = true;
            this.data[i].program.mes.push(j);
          }
        }
        for(var j in commands.previewInput.data) {
          if(commands.previewInput.data[j].inputNumber == i) {
            this.data[i].preview.tally = true;
            this.data[i].preview.mes.push(j);
          }
        }

        //Update in transition
        for(var j in commands.transitionPosition.data) {
          if(this.data[i].program.mes.includes(j) || this.data[i].preview.mes.includes(j)) {
            if(commands.transitionPosition.data[j].inTransition === true) {
              this.data[i].inTransition.tally = true;
              this.data[i].inTransition.mes.push(j);
            }
          }
        }

        //US keyer
        for(var j in commands.upstreamKeyer.data) {
          if(commands.upstreamKeyer.data[j].fillSource !== undefined && commands.upstreamKeyer.data[j].keySource !== undefined) {
            this.data[i].upstreamKeyer.keyers[j] = {
              "fillSource": false,
              "keySource": false
            };

            if(commands.upstreamKeyer.data[j].fillSource.id == i) {
              if(commands.upstreamKeyer.data[j].state === true) {
                this.data[i].upstreamKeyer.keyers[j].fillSource = true;
                this.data[i].upstreamKeyer.tally = true;
              }
            }
            if(commands.upstreamKeyer.data[j].keySource.id == i) {
              if(commands.upstreamKeyer.data[j].state === true) {
                this.data[i].upstreamKeyer.keyers[j].keySource = true;
                this.data[i].upstreamKeyer.tally = true;
              }
            }
          }
        }

        //DS keyer
        for(var j in commands.downstreamKeyer.data) {
          if(commands.downstreamKeyer.data[j].fillSource !== undefined && commands.downstreamKeyer.data[j].keySource !== undefined) {
            this.data[i].downstreamKeyer.keyers[j] = {
              "fillSource": false,
              "keySource": false
            };

            if(commands.downstreamKeyer.data[j].fillSource.id == i) {
              if(commands.downstreamKeyer.data[j].state === true 
                || commands.downstreamKeyer.data[j].inTransition === true
                || commands.downstreamKeyer.data[j].isAutoTransitioning === true) {
                  this.data[i].downstreamKeyer.keyers[j].fillSource = true;
                  this.data[i].downstreamKeyer.tally = true;
                }
            }

            if(commands.downstreamKeyer.data[j].keySource.id == i) {
              if(commands.downstreamKeyer.data[j].state === true 
                || commands.downstreamKeyer.data[j].inTransition === true
                || commands.downstreamKeyer.data[j].isAutoTransitioning === true) {
                  this.data[i].downstreamKeyer.keyers[j].keySource = true;
                  this.data[i].downstreamKeyer.tally = true;
                }
            }
          }
        }
      }

      for(var i = 0; i < messageCallbacks.length; i++) {
        var msg = {
            "topic": "command",
            "payload": {
              "cmd": this.cmd,
              "data": this.data
          }
        }

        messageCallbacks[i](msg);
      }
      
      return true;
    },

    //What todo once we are connected
    afterInit(commands) {
      this.data = {};
      this.updateTallys(commands);
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    },  
  }}
}