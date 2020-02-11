module.exports = {
  get: "CCdP",
  set: "CCmd",
  cmd: "cameraControl",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList);
  },
  processData(data, flag, command, commandList) {
    if(this.data[data[0]] === undefined || this.data[data[0]] === null){
      this.data[data[0]] = {
        "iris": undefined,
        "focus": undefined,
        "overallGain": undefined,
        "whiteBalance": undefined,
        "zoomSpeed": undefined,
        "lift": {
          "red": undefined,
          "green": undefined,
          "blue": undefined,
          "yellow": undefined
        },
        "gamma": {
          "red": undefined,
          "green": undefined,
          "blue": undefined,
          "yellow": undefined
        },
        "gain": {
          "red": undefined,
          "green": undefined,
          "blue": undefined,
          "yellow": undefined
        },

        "lumMix": undefined,
        "hue": undefined,
        "shutter": undefined,
        "contrast": undefined,
        "saturation": undefined,
      };
    }

    //Set values based off adjustment domain
    switch(data[1]) {
      case commandList.cameraOptions.adjustmentDomain.lens: {
        switch(data[2]) {
          case commandList.cameraOptions.lensFeature.focus: {
            this.data[data[0]].focus = (data.readUInt16BE(16) / 65535) * 100;
            break;
          }
          case commandList.cameraOptions.lensFeature.autoFocused: {
            this.data[data[0]].focus = "auto";
            break;
          }
          case commandList.cameraOptions.lensFeature.iris: {
            this.data[data[0]].iris = (data.readUInt16BE(16) / 2048) * 100;
            break;
          }
          case commandList.cameraOptions.lensFeature.zoom: {
            this.data[data[0]].zoomSpeed = (data.readInt16BE(16) / 2048) * 100;
            break;
          }
        }
        break;
      }
      case commandList.cameraOptions.adjustmentDomain.camera: {
        switch(data[2]) {
          case commandList.cameraOptions.cameraFeature.lowerGain: {
            for(var parameter in commandList.cameraOptions.cameraFeature.lowerGainValues) {
              if(commandList.cameraOptions.cameraFeature.lowerGainValues[parameter] == data.readUInt16BE(16)) {
                this.data[data[0]].overallGain = parameter;
                break;
              }
              else {
                this.data[data[0]].overallGain = data.readUInt16BE(16);
              }
            }
            break;
          }
          case commandList.cameraOptions.cameraFeature.gain: {
            for(var parameter in commandList.cameraOptions.cameraFeature.gainValues) {
              if(commandList.cameraOptions.cameraFeature.gainValues[parameter] == data.readUInt16BE(16)) {
                this.data[data[0]].overallGain = parameter;   
                break;     
              }
              else {
                this.data[data[0]].overallGain = data.readUInt16BE(16);
              }
            }
            break;
          }
          case commandList.cameraOptions.cameraFeature.whiteBalance: {
            this.data[data[0]].whiteBalance = data.readUInt16BE(16);
            break;
          }
          case commandList.cameraOptions.cameraFeature.shutter: {
            for(var parameter in commandList.cameraOptions.cameraFeature.shutterValues) {
              if(commandList.cameraOptions.cameraFeature.shutterValues[parameter] == data.readUInt16BE(18)) {
                this.data[data[0]].shutter = parameter;   
                break;     
              }
              else {
                this.data[data[0]].shutter = data.readUInt16BE(18);
              }
            }
            break;
          }
        }
        break;
      }
      case commandList.cameraOptions.adjustmentDomain.chip: {
        switch(data[2]) {
          case commandList.cameraOptions.chipFeature.lift: {
            this.data[data[0]].lift.red = data.readInt16BE(16) / 4096;
            this.data[data[0]].lift.green = data.readInt16BE(18) / 4096;
            this.data[data[0]].lift.blue = data.readInt16BE(20) / 4096;
            this.data[data[0]].lift.yellow = data.readInt16BE(22) / 4096;
            break;
          }
          case commandList.cameraOptions.chipFeature.gamma: {
            this.data[data[0]].gamma.red = data.readInt16BE(16) / 8192;
            this.data[data[0]].gamma.green = data.readInt16BE(18) / 8192;
            this.data[data[0]].gamma.blue = data.readInt16BE(20) / 8192;
            this.data[data[0]].gamma.yellow = data.readInt16BE(22) / 8192;
            break;
          }
          case commandList.cameraOptions.chipFeature.gain: {
            console.log("yeet");
            this.data[data[0]].gain.red = data.readUInt16BE(16) / 2047.9375;
            this.data[data[0]].gain.green = data.readUInt16BE(18) / 2047.9375;
            this.data[data[0]].gain.blue = data.readUInt16BE(20) / 2047.9375;
            this.data[data[0]].gain.yellow = data.readUInt16BE(22) / 2047.9375;
            break;
          }
          case commandList.cameraOptions.chipFeature.aperture: {
            //Not supported
            break;
          }
          case commandList.cameraOptions.chipFeature.contrast: {
            this.data[data[0]].contrast = (data.readUInt16BE(18) / 4096) * 100;
            break;
          }
          case commandList.cameraOptions.chipFeature.lum: {
            this.data[data[0]].lumMix = (data.readUInt16BE(16) / 2048) * 100;
            break;
          }
          case commandList.cameraOptions.chipFeature.sat: {
            this.data[data[0]].hue = (data.readUInt16BE(16) / 4096) * 100;
            this.data[data[0]].saturation = (data.readInt16BE(18) / 2048) * 100;
            break;
          }
        }
        break;
      }
    }

    command.payload.cmd = this.cmd;
    command.payload.data = this.data;

    return true;
  },
  sendData(command, commandList) {
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
      var packets = [];

      if(!commandList.exists(command.payload.data.cameraId)){error = "Camera ID is missing";}
      else {
        //Loop though the adjustment domains and generate the packets
        for(var domain in commandList.cameraOptions.adjustmentDomain) {
          switch(domain) {
            case "lens": {
              for(var subDomain in commandList.cameraOptions.lensFeature) {
                var tempPacket = new Buffer.alloc(24).fill(0);
                tempPacket[0] = parseInt(command.payload.data.cameraId);
                tempPacket[1] = commandList.cameraOptions.adjustmentDomain[domain];
                tempPacket[2] = commandList.cameraOptions.lensFeature[subDomain];
                if(command.payload.data.isRelative === undefined || command.payload.data.isRelative === null) {tempPacket[3] = 1;}else{tempPacket[3] = command.payload.data.isRelative ? 1:0;}

                switch(subDomain) {
                  case "focus": {
                    if(commandList.isValid(command.payload.data.focus)) {
                      if(command.payload.data.focus !== "auto") {
                        tempPacket.writeUInt16BE(parseFloat(command.payload.data.focus) * 655.35, 16);
                        packets.push(tempPacket);
                      }
                    }
                    else if(this.data[tempPacket[0]].focus !== "auto") {
                      tempPacket.writeUInt16BE(this.data[tempPacket[0]].focus * 655.35, 16);
                      packets.push(tempPacket);
                    }
                    break;
                  }
                  case "autoFocused": {
                    if(commandList.isValid(command.payload.data.focus)) {
                      if(command.payload.data.focus === "auto") {
                        packets.push(tempPacket);
                      }
                    }
                    break;
                  }
                  case "iris": {

                    break;
                  }
                  case "zoom": {
                    break;
                  }
                }
              }





              break;
            }
            case "camera": {
              break;
            }
            case "chip": {
              break;
            }
          }
        }
      }








      if(error != null) {
        //An error occured
        var msg = {
          "direction": "node",
          "command": {
            "payload": {
              "cmd": this.cmd,
              "data": error
            }
          }
        }

        return msg;
      }
      else {
        //Generate the payloads
        var msgs = [];           
        for(var packet in packets) {
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

          msg.direction = "server";
          msg.command.packet = packets[packet];

          msgs.push(msg);
        }

        console.log(msgs);
        return [msgs];
      }
    }
  },
  //What todo once we are connected
  afterInit(commandList) {
    return {
      "cmd": this.cmd,
      "data": this.data
    }
  }
}