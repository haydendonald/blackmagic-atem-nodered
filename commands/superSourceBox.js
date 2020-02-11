//Not complete
module.exports = {
  get: "SSBP",
  set: "CSBP",
  cmd: "superSourceBox",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList);
  },
  processData(data, flag, command, commandList) {
    this.data[data[1] + 1] = {
      "enabled": data[2] == true,
      "inputNumber": data.readUInt16BE(4),
      "videoSource": commandList.list.inputProperty.findInput(data.readUInt16BE(4)),
      "xPosition": data.readInt16BE(6) / 100,
      "yPosition": data.readInt16BE(8) / 100,
      "size": data.readUInt16BE(10) / 1000,
      "cropEnabled": data[12] == 1,
      "cropTop": data.readUInt16BE(14) / 1000,
      "cropBottom": data.readUInt16BE(16) / 1000,
      "cropLeft": data.readUInt16BE(18) / 1000,
      "cropRight": data.readUInt16BE(20) / 1000,
      // "setMask?": {
      //   "enabled": data.readUInt16BE(22).toString(2)[0] == "1",
      //   "inputSource": data.readUInt16BE(22).toString(2)[1] == "1",
      //   "xPosition": data.readUInt16BE(22).toString(2)[2] == "1",
      //   "yPosition": data.readUInt16BE(22).toString(2)[3] == "1",
      //   "size": data.readUInt16BE(22).toString(2)[4] == "1",
      //   "cropped": data.readUInt16BE(22).toString(2)[5] == "1",
      //   "cropTop": data.readUInt16BE(22).toString(2)[6] == "1",
      //   "cropBottom": data.readUInt16BE(22).toString(2)[7] == "1",
      //   "cropLeft": data.readUInt16BE(22).toString(2)[8] == "1",
      //   "cropRight": data.readUInt16BE(22).toString(2)[9] == "1"
      // }
    };

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
      var packet = Buffer.alloc(23).fill(0);

      //SetMask 0-1 not sure what it does so just setting it to 0 unless told otherwise
      if(commandList.exists(command.payload.data.setMask)) {
        var setMaskString = new Array(16).fill("0");
        if(!commandList.exists(command.payload.data.setMask.enabled)){error = "Set mask enabled is missing";}
        else if(command.payload.data.setMask.enabled == true){setMaskString[0] = "1";}
        if(!commandList.exists(command.payload.data.setMask.inputSource)){error = "Set mask inputSource is missing";}
        else if(command.payload.data.setMask.inputSource == true){setMaskString[1] = "1";}
        if(!commandList.exists(command.payload.data.setMask.xPosition)){error = "Set mask xPosition is missing";}
        else if(command.payload.data.setMask.xPosition == true){setMaskString[2] = "1";}
        if(!commandList.exists(command.payload.data.setMask.yPosition)){error = "Set mask yPosition is missing";}
        else if(command.payload.data.setMask.yPosition == true){setMaskString[3] = "1";}
        if(!commandList.exists(command.payload.data.setMask.size)){error = "Set mask size is missing";}
        else if(command.payload.data.setMask.size == true){setMaskString[4] = "1";}
        if(!commandList.exists(command.payload.data.setMask.cropped)){error = "Set mask cropped is missing";}
        else if(command.payload.data.setMask.cropped == true){setMaskString[5] = "1";}
        if(!commandList.exists(command.payload.data.setMask.cropTop)){error = "Set mask cropTop is missing";}
        else if(command.payload.data.setMask.cropTop == true){setMaskString[6] = "1";}
        if(!commandList.exists(command.payload.data.setMask.cropBottom)){error = "Set mask cropBottom is missing";}
        else if(command.payload.data.setMask.cropBottom == true){setMaskString[7] = "1";}
        if(!commandList.exists(command.payload.data.setMask.cropLeft)){error = "Set mask cropLeft is missing";}
        else if(command.payload.data.setMask.cropLeft == true){setMaskString[8] = "1";}
        if(!commandList.exists(command.payload.data.setMask.cropRight)){error = "Set mask cropRight is missing";}
        else if(command.payload.data.setMask.cropRight == true){setMaskString[9] = "1";}
        packet.writeUInt16BE(parseInt(setMaskString.toString().replace(/\,/g,""), 2), 0);
      }

      if(!commandList.exists(command.payload.data.box)){error = "Box is missing";}
      else if(parseInt(command.payload.data.box) < 1 || parseInt(command.payload.data.box) > 4) {error="Box is out of range 1-4";}
      else {
        if(error === null) {
          packet[2] = parseInt(command.payload.data.box) - 1;

          //Check if we need to set values from memory
          if(this.data[parseInt(command.payload.data.box)] === undefined || this.data[parseInt(command.payload.data.box)] === null) {
            if(commandList.exists(command.payload.data.enabled) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.inputNumber) == false && commandList.exists(command.payload.data.videoSource) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.xPosition) == false || commandList.exists(command.payload.data.yPosition) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.size) == false || commandList.exists(command.payload.data.cropEnabled) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.cropTop) == false || commandList.exists(command.payload.data.cropBottom) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.cropLeft) == false || commandList.exists(command.payload.data.cropRight) == false){error="Cannot set values from memory as they have not been read yet";}
          }

          if(error === null) {
            //Enabled
            if(commandList.exists(command.payload.data.enabled)) {packet[3] = command.payload.data.enabled ? 1:0;}
            else{packet[3] = this.data[parseInt(command.payload.data.box)].enabled ? 1:0;}

            //Video source
            if(commandList.exists(command.payload.data.inputNumber) && commandList.exists(command.payload.data.videoSource)){error="Both inputNumber and videoSource are defined only one is required";}     
            else if(commandList.exists(command.payload.data.inputNumber)) {packet.writeUInt16BE(parseInt(command.payload.data.inputNumber), 4);}
            else if(commandList.exists(command.payload.data.videoSource)) {
              //Attempt to find the video source and set it
              var search = "";
              if(command.payload.data.videoSource.id !== undefined && command.payload.data.videoSource.id !== null) {
                search = command.payload.data.videoSource.id;
              }
              else if(command.payload.data.videoSource.shortName !== undefined && command.payload.data.videoSource.shortName !== null) {
                search = command.payload.data.videoSource.shortName;
              }         
              else if(command.payload.data.videoSource.longName !== undefined && command.payload.data.videoSource.longName !== null) {
                search = command.payload.data.videoSource.longName;
              }

              var input = commandList.list.inputProperty.findInput(search);
              if(input == null || input == undefined){error = "Video source was not found";}
              else {
                packet.writeUInt16BE(input.id, 4);
              }
            }
            else {packet.writeUInt16BE(parseInt(this.data[parseInt(command.payload.data.box)].inputNumber), 4);}

            //X Position
            if(commandList.exists(command.payload.data.xPosition)) {packet.writeInt16BE(parseFloat(command.payload.data.xPosition) * 100, 6);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.box)].xPosition) * 100, 6);}

            //Y Position
            if(commandList.exists(command.payload.data.yPosition)) {packet.writeInt16BE(parseFloat(command.payload.data.yPosition) * 100, 8);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.box)].yPosition) * 100, 8);}

            //Size
            if(commandList.exists(command.payload.data.size)) {packet.writeUInt16BE(parseFloat(command.payload.data.size) * 1000, 10);}
            else{packet.writeUInt16BE(parseFloat(this.data[parseInt(command.payload.data.box)].size) * 1000, 10);}

            //Crop Enabled
            if(commandList.exists(command.payload.data.cropEnabled)) {packet[12] = command.payload.data.cropEnabled ? 1:0;}
            else{packet[12] = this.data[parseInt(command.payload.data.box)].cropEnabled ? 1:0;}

            //Crop Top
            if(commandList.exists(command.payload.data.cropTop)) {packet.writeInt16BE(parseFloat(command.payload.data.cropTop) * 1000, 14);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.box)].cropTop) * 1000, 14);}

            
            //Crop Bottom
            if(commandList.exists(command.payload.data.cropBottom)) {packet.writeInt16BE(parseFloat(command.payload.data.cropBottom) * 1000, 16);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.box)].cropBottom) * 1000, 16);}

            
            //Crop Left
            if(commandList.exists(command.payload.data.cropLeft)) {packet.writeInt16BE(parseFloat(command.payload.data.cropLeft) * 1000, 18);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.box)].cropLeft) * 1000, 18);}

            
            //Crop Right
            if(commandList.exists(command.payload.data.cropRight)) {packet.writeInt16BE(parseFloat(command.payload.data.cropRight) * 1000, 20);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.box)].cropRight) * 1000, 20);}

          }
        }
      }
      

      console.log(packet);


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
  afterInit(commandList) {
    //Update the video source
    for(var i in this.data) {
      this.data[i].videoSource = commandList.list.inputProperty.findInput(this.data[i].inputNumber);
    }

    return {
      "cmd": this.cmd,
      "data": this.data
    }
  }
}