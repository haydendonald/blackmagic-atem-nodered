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
    //If this is the first time initalise the camera information
    if(this.data[data[0]] === undefined || this.data[data[0]] === null) {
      this.data[data[0]] = {
        "id": data[0],
        "lens": {
          "iris": undefined,
          "focus": undefined,
          "zoom": undefined
        },
        "camera": {
          "gain": undefined,
          "whiteBalance": undefined,
          "shutter": undefined
        },
        "chip": {
          "liftR": undefined,
          "gammaR": undefined,
          "gainR": undefined,
          "lumMix": undefined,
          "hue": undefined,
          "liftG": undefined,
          "gammaG": undefined,
          "gainG": undefined,
          "contrast": undefined,
          "saturation": undefined,
          "liftB": undefined,
          "gammaB": undefined,
          "gainB": undefined,
          "liftY": undefined,
          "gammaY": undefined,
          "gainY": undefined,
          "aperture": undefined
        }
      }
    }

    //Now process the data
    var adjustmentDomain = data[1];
    var feature = data[2];

    console.log(adjustmentDomain + ":" + feature);


    switch(adjustmentDomain) {
      case commandList.cameraOptions.adjustmentDomain.lens: {
        switch(feature) {
          case commandList.cameraOptions.lensFeature.focus: {
            this.data[data[0]].lens.focus = data.readInt16BE(16);
            break;
          }
          case commandList.cameraOptions.lensFeature.autoFocused: {
            this.data[data[0]].lens.focus = "autoFocused";
            break;
          }
          case commandList.cameraOptions.lensFeature.iris: {
            this.data[data[0]].lens.iris = data.readInt16BE(16);
            break;
          }
          case commandList.cameraOptions.lensFeature.zoom: {
            this.data[data[0]].lens.zoom = data.readInt16BE(16);
            break;
          }
        }
        break;
      }
      case commandList.cameraOptions.adjustmentDomain.camera: {
        switch(feature) {
          case commandList.cameraOptions.cameraFeature.gain: {
            var gain = "unknown";
            console.log(data.readUInt16BE(16));
            Object.keys(commandList.cameraOptions.cameraFeature.gainValues).forEach(function(key ,index) {
              if(commandList.cameraOptions.cameraFeature.gainValues[key] == data.readUInt16BE(16)) {
                console.log(key);
                gain = key;
              }
            });
            this.data[data[0]].camera.gain = gain;
            break;
          }
          case commandList.cameraOptions.cameraFeature.whiteBalance: {
            break;
          }
          case commandList.cameraOptions.cameraFeature.shutter: {
            break;
          }
        }
        break;
      }
      case commandList.cameraOptions.adjustmentDomain.chip: {
        switch(feature) {
          case commandList.cameraOptions.chipFeature.lift: {
            this.data[data[0]].chip.liftR = data.readInt16BE(16);
            this.data[data[0]].chip.liftG = data.readInt16BE(18);
            this.data[data[0]].chip.liftB = data.readInt16BE(20);
            this.data[data[0]].chip.liftY = data.readInt16BE(22);
            break;
          }
          case commandList.cameraOptions.chipFeature.gamma: {
            this.data[data[0]].chip.gammaR = data.readInt16BE(16);
            this.data[data[0]].chip.gammaG = data.readInt16BE(18);
            this.data[data[0]].chip.gammaB = data.readInt16BE(20);
            this.data[data[0]].chip.gammaY = data.readInt16BE(22);
            break;
          }
          case commandList.cameraOptions.chipFeature.gain: {
            this.data[data[0]].chip.gainR = data.readInt16BE(16);
            this.data[data[0]].chip.gainG = data.readInt16BE(18);
            this.data[data[0]].chip.gainB = data.readInt16BE(20);
            this.data[data[0]].chip.gainY = data.readInt16BE(22);
            break;
          }
          case commandList.cameraOptions.chipFeature.aperture: {
            this.data[data[0]].chip.aperture = data.readInt16BE(16);
            break;
          }
          case commandList.cameraOptions.chipFeature.contrast: {
            this.data[data[0]].chip.contrast = data.readInt16BE(16);
            break;
          }
          case commandList.cameraOptions.chipFeature.lum: {
            this.data[data[0]].chip.lumMix = data.readInt16BE(16);
            break;
          }
          case commandList.cameraOptions.chipFeature.hueSaturation: {
            this.data[data[0]].chip.hue = data.readInt16BE(16);
            this.data[data[0]].chip.saturation = data.readInt16BE(18);
            break;
          }
        }
        break;
      }
    }









    //console.log(this.data[1]);




    command.payload.data = this.data;
    command.payload.cmd = this.cmd;
    
    return flag==commandList.flags.sync;
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

    if(command.payload.data == undefined || command.payload.data == null) {
      msg.direction = "node";
      msg.command.payload.data = this.data;
    }
    else {
      console.log("not supported!");
      // var me = parseInt(command.payload.data.ME);
      // var rate = parseInt(command.payload.data.rate);
      // if(me == undefined || me == null || Number.isNaN(me)) {
      //   error="The ME was not stated this is expected to be the ME number starting at 0";
      // }
      // if(rate == undefined || rate == null || Number.isNaN(rate)) {
      //   error="The rate was not stated this is a expected to be a number between 1-250 (frames)";
      // }
      // if(rate < 1 || rate > 250){
      //   error="The rate needs to be between 1 and 250 (frames) you sent " + command.payload.data.rate;
      // }

      // if(error === null) {
      //   //Process packet
      //   var packet = Buffer.alloc(4).fill(0);
      //   packet[0] = command.payload.data.ME;
      //   packet[1] = command.payload.data.rate;
      //   msg.direction = "server";
      //   msg.command.packet = packet;
      // }
      // else {
      //   //We had an error
      //   var msg = {
      //     "direction": "node",
      //     "command": {
      //       "payload": {
      //         "cmd": this.cmd,
      //         "data": error
      //       }
      //     }
      //   }
      // }
    }
    return msg;
  },
  //What todo once we are connected
  afterInit(commandList) {
    return {
      "cmd": this.cmd,
      "data": this.data
    }
  }
}