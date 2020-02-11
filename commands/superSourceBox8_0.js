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
    if(this.data[data[0] + 1] === undefined || this.data[data[0] + 1] === null){this.data[data[0] + 1] = {};}

    //This version works 8.0+
    if(commandList.list.version.getVersion() < commandList.version.V8_0){return false;}

    this.data[data[0] + 1][data[1] + 1] = {
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
      "cropRight": data.readUInt16BE(20) / 1000
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
      var packet = Buffer.alloc(24).fill(0);

      //SetMask 0-1 not sure what it does so just setting it to 1 unless told otherwise
      var setMaskString = new Array(16).fill("1");
      if(commandList.exists(command.payload.data.setMask)) {
        if(!commandList.exists(command.payload.data.setMask.enabled)){error = "Set mask enabled is missing";}
        else if(command.payload.data.setMask.enabled == false){setMaskString[0] = "0";}
        if(!commandList.exists(command.payload.data.setMask.inputSource)){error = "Set mask inputSource is missing";}
        else if(command.payload.data.setMask.inputSource == false){setMaskString[1] = "0";}
        if(!commandList.exists(command.payload.data.setMask.xPosition)){error = "Set mask xPosition is missing";}
        else if(command.payload.data.setMask.xPosition == false){setMaskString[2] = "0";}
        if(!commandList.exists(command.payload.data.setMask.yPosition)){error = "Set mask yPosition is missing";}
        else if(command.payload.data.setMask.yPosition == false){setMaskString[3] = "0";}
        if(!commandList.exists(command.payload.data.setMask.size)){error = "Set mask size is missing";}
        else if(command.payload.data.setMask.size == false){setMaskString[4] = "0";}
        if(!commandList.exists(command.payload.data.setMask.cropped)){error = "Set mask cropped is missing";}
        else if(command.payload.data.setMask.cropped == false){setMaskString[5] = "0";}
        if(!commandList.exists(command.payload.data.setMask.cropTop)){error = "Set mask cropTop is missing";}
        else if(command.payload.data.setMask.cropTop == false){setMaskString[6] = "0";}
        if(!commandList.exists(command.payload.data.setMask.cropBottom)){error = "Set mask cropBottom is missing";}
        else if(command.payload.data.setMask.cropBottom == false){setMaskString[7] = "0";}
        if(!commandList.exists(command.payload.data.setMask.cropLeft)){error = "Set mask cropLeft is missing";}
        else if(command.payload.data.setMask.cropLeft == false){setMaskString[8] = "0";}
        if(!commandList.exists(command.payload.data.setMask.cropRight)){error = "Set mask cropRight is missing";}
        else if(command.payload.data.setMask.cropRight == false){setMaskString[9] = "0";}
      }
      packet.writeUInt16BE(parseInt(setMaskString.toString().replace(/\,/g,""), 2), 0);

      if(!commandList.exists(command.payload.data.superSourceID)){error = "Super Source ID is missing";}
      else if(!commandList.exists(command.payload.data.box)){error = "Box is missing";}
      else if(parseInt(command.payload.data.box) < 1 || parseInt(command.payload.data.box) > 4) {error="Box is out of range 1-4";}
      else {
        if(error === null) {
          packet[2] = parseInt(command.payload.data.superSourceID) - 1;
          packet[3] = parseInt(command.payload.data.box) - 1;

          //Check if we need to set values from memory
          if(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)] === undefined || this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)] === null) {
            if(commandList.exists(command.payload.data.enabled) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.inputNumber) == false && commandList.exists(command.payload.data.videoSource) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.xPosition) == false || commandList.exists(command.payload.data.yPosition) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.size) == false || commandList.exists(command.payload.data.cropEnabled) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.cropTop) == false || commandList.exists(command.payload.data.cropBottom) == false){error="Cannot set values from memory as they have not been read yet";}
            if(commandList.exists(command.payload.data.cropLeft) == false || commandList.exists(command.payload.data.cropRight) == false){error="Cannot set values from memory as they have not been read yet";}
          }

          if(error === null) {
            //Enabled
            if(commandList.exists(command.payload.data.enabled)) {packet[4] = command.payload.data.enabled ? 1:0;}
            else{packet[4] = this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].enabled ? 1:0;}

            //Video source
            if(commandList.exists(command.payload.data.inputNumber) && commandList.exists(command.payload.data.videoSource)){error="Both inputNumber and videoSource are defined only one is required";}     
            else if(commandList.exists(command.payload.data.inputNumber)) {packet.writeUInt16BE(parseInt(command.payload.data.inputNumber), 6);}
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
                packet.writeUInt16BE(input.id, 6);
              }
            }
            else {packet.writeUInt16BE(parseInt(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].inputNumber), 6);}

            //X Position
            if(commandList.exists(command.payload.data.xPosition)) {packet.writeInt16BE(parseFloat(command.payload.data.xPosition) * 100, 8);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].xPosition) * 100, 8);}

            //Y Position
            if(commandList.exists(command.payload.data.yPosition)) {packet.writeInt16BE(parseFloat(command.payload.data.yPosition) * 100, 10);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].yPosition) * 100, 10);}

            //Size
            if(commandList.exists(command.payload.data.size)) {packet.writeUInt16BE(parseFloat(command.payload.data.size) * 1000, 12);}
            else{packet.writeUInt16BE(parseFloat(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].size) * 1000, 12);}

            //Crop Enabled
            if(commandList.exists(command.payload.data.cropEnabled)) {packet[14] = command.payload.data.cropEnabled ? 1:0;}
            else{packet[14] = this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].cropEnabled ? 1:0;}

            //Crop Top
            if(commandList.exists(command.payload.data.cropTop)) {packet.writeInt16BE(parseFloat(command.payload.data.cropTop) * 1000, 16);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].cropTop) * 1000, 16);}

            
            //Crop Bottom
            if(commandList.exists(command.payload.data.cropBottom)) {packet.writeInt16BE(parseFloat(command.payload.data.cropBottom) * 1000, 18);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].cropBottom) * 1000, 18);}

            
            //Crop Left
            if(commandList.exists(command.payload.data.cropLeft)) {packet.writeInt16BE(parseFloat(command.payload.data.cropLeft) * 1000, 20);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].cropLeft) * 1000, 20);}

            
            //Crop Right
            if(commandList.exists(command.payload.data.cropRight)) {packet.writeInt16BE(parseFloat(command.payload.data.cropRight) * 1000, 22);}
            else{packet.writeInt16BE(parseFloat(this.data[parseInt(command.payload.data.superSourceID)][parseInt(command.payload.data.box)].cropRight) * 1000, 22);}

          }
        }
      }

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