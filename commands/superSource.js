const commandList = require("./commandList.js");

module.exports = {
  object: function() { return {
    get: "SSrc",
    set: "CSSc",
    cmd: "superSource",
    data: {},
    close() {
      console.log(new Buffer("1111").toString('hex', 4));
      this.data = {};
    },
    initializeData(data, flag, commands) {
      var command = {"payload":{"data":{}}};
      this.processData(data, flag, command, commands);
    },
    processData(data, flag, command, commands) {
      this.data = {
        "fillSourceID": data.readUInt16BE(0),
        "fillSource": commands.inputProperty.findInput(data.readUInt16BE(0)),
        "keySourceID": data.readUInt16BE(2),
        "keySource": commands.inputProperty.findInput(data.readUInt16BE(2)),
        "isForeground": data[4] == 0x01,
        "isPremultiplied": data[5] == 0x01,
        "clip": data.readUInt16BE(6),
        "gain": data.readUInt16BE(8),
        "invertKey": data[10] == 0x01,
        "borderEnabled": data[11] == 0x01,
        "borderBevel": data[12],
        "borderOuterWidth": data.readUInt16BE(14),
        "borderInnerWidth": data.readUInt16BE(16),
        "borderOuterSoftness": data[18],
        "borderInnerSoftness": data[19],
        "borderBevelSoftness": data[20],
        "borderBevelPosition": data[21],
        "borderHue": data.readUInt16BE(22),
        "borderSaturation": data.readUInt16BE(24),
        "borderLuma": data.readUInt16BE(26),
        "lightSourceDirection": data.readUInt16BE(28),
        "lightSourceAltitude": data[30]
      }
  
      command.payload.cmd = this.cmd;
      command.payload.data = this.data;
  
      console.log(this.data);
  
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
      if(!commandList.exists(command.payload.data) || command.payload.data == {}) {
        msg.payload.data = this.data;
        return msg;
      }
      else {
        var packet = Buffer.alloc(35).fill(0);
        //Set parameters
  
        //Set mask
        if(!commandList.exists(command.payload.data.setMask)){error="Set mask is missing";}
        else {
          if(commandList.exists(command.payload.setMask.fillSource)){error="Set mask - fillSource is missing";}
          else if(commandList.exists(command.payload.setMask.keySource)){error="Set mask - keySource is missing";}
          else if(commandList.exists(command.payload.setMask.forground)){error="Set mask - forground is missing";}
          else if(commandList.exists(command.payload.setMask.preMultiplied)){error="Set mask - preMultiplied is missing";}
          else if(commandList.exists(command.payload.setMask.clip)){error="Set mask - clip is missing";}
          else if(commandList.exists(command.payload.setMask.gain)){error="Set mask - gain is missing";}
          else if(commandList.exists(command.payload.setMask.invert)){error="Set mask - invert is missing";}
          else if(commandList.exists(command.payload.setMask.enabled)){error="Set mask - enabled is missing";}
          else if(commandList.exists(command.payload.setMask.bevel)){error="Set mask - bevel is missing";}
          else if(commandList.exists(command.payload.setMask.outerWidth)){error="Set mask - outerWidth is missing";}
          else if(commandList.exists(command.payload.setMask.innerWidth)){error="Set mask - innerWidth is missing";}
          else if(commandList.exists(command.payload.setMask.outerSoftness)){error="Set mask - outerSoftness is missing";}
          else if(commandList.exists(command.payload.setMask.innerSoftness)){error="Set mask - innerSoftness is missing";}
          else if(commandList.exists(command.payload.setMask.bevelSoftness)){error="Set mask - bevelSoftness is missing";}
          else if(commandList.exists(command.payload.setMask.bevelPosition)){error="Set mask - bevelPosition is missing";}
          else if(commandList.exists(command.payload.setMask.hue)){error="Set mask - hue is missing";}
          else if(commandList.exists(command.payload.setMask.saturation)){error="Set mask - saturation is missing";}
          else if(commandList.exists(command.payload.setMask.luma)){error="Set mask - luma is missing";}
          else if(commandList.exists(command.payload.setMask.direction)){error="Set mask - direction is missing";}
          else if(commandList.exists(command.payload.setMask.altitude)){error="Set mask - altitude is missing";}
          else {
            //Finally set the values
            console.log(new Buffer("1111").toString('hex'));
  
            //data[27].toString(2)[0] == "1",
  
  
            packet[0] = 
            packet[1]
            packet[2]
          }
  
  
        }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
      }
  
      // //If the data is null return the value
      // if(command.payload.data == undefined || command.payload.data == null) {error="The data parameter was null";}
      // else {
      //   if(command.payload.data.id == undefined || command.payload.data.id == null) {
      //     msg.direction = "node";
      //     msg.command.payload.data = this.data;
      //   }
      //   else if(command.payload.data.inputSource !== undefined && command.payload.data.inputSource !== null) {
      //     //Find the searcher for the video source
      //     videoSource = null;
      //     if(command.payload.data.inputSource.id == undefined || command.payload.data.inputSource.id == null) {
      //       if(command.payload.data.inputSource.longName == undefined || command.payload.data.inputSource.longName == null) {
      //         if(command.payload.data.inputSource.shortName == undefined || command.payload.data.inputSource.shortName == null) {
      //         }
      //         else {videoSource = command.payload.data.inputSource.shortName; }
      //       }
      //       else {videoSource = command.payload.data.inputSource.longName;}
      //     }
      //     else {videoSource = command.payload.data.inputSource.id;}
      //     videoSource = commandList.list.inputProperty.findInput(videoSource);
  
      //     if(videoSource == undefined || videoSource == null){error="That input source was not found";}
      //     else if(command.payload.data.mask !== undefined && command.payload.data.mask !== null){
      //       //Set the input source
      //       var packet = Buffer.alloc(4).fill(0);
      //       packet[0] = command.payload.data.mask ? 1 : 0;
      //       packet[1] = command.payload.data.id;
      //       packet.writeInt16BE(videoSource.id, 2);
      //       msg.direction = "server";
      //       msg.command.packet = packet;
      //     }
      //     else {error="A mask parameter is required";}
      //   }
      //   else {
      //     //Return the current input source
      //     msg.direction = "node";
      //     if(command.payload.data.id === undefined || command.payload.data.id === null) {
      //       msg.command.payload.data = this.data;
      //     }
      //     else {
      //       msg.command.payload.data = this.data[command.payload.data.id];
      //     }
      //   }
      // }
  
      // if(error != null) {
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
      // return msg;
    },
    //What todo once we are connected
    afterInit(commands) {
      // //Update the video source
      // for(var i in this.data) {
      //   this.data[i].inputSource = commandList.list.inputProperty.findInput(this.data[i].inputNumber);
      // }
  
      return {
        "cmd": this.cmd,
        "data": this.data
      }
    }    
  }}
}