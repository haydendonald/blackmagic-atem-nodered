module.exports = {
  get: "AuxS",
  set: "CAuS",
  cmd: "auxSource",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList);
  },
  processData(data, flag, command, commandList) {
    this.data[data[0]] = {
      "inputNumber": data.readUInt16BE(2),
      "videoSource": commandList.list.inputProperty.findInput(data.readUInt16BE(2))
    }
    command.payload.data = this.data;
    command.payload.cmd = this.cmd;
    
    //return flag==commandList.flags.initializing;
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
    if(command.payload.data == undefined || command.payload.data == null) {error="The data parameter was null";}
    else {
      if(command.payload.data.id == undefined || command.payload.data.id == null) {
        msg.direction = "node";
        msg.command.payload.data = this.data;
      }
      else if(command.payload.data.videoSource !== undefined && command.payload.data.videoSource !== null) {
        //Find the searcher for the video source
        videoSource = null;
        if(command.payload.data.videoSource.id == undefined || command.payload.data.videoSource.id == null) {
          if(command.payload.data.videoSource.longName == undefined || command.payload.data.videoSource.longName == null) {
            if(command.payload.data.videoSource.shortName == undefined || command.payload.data.videoSource.shortName == null) {
            }
            else {videoSource = command.payload.data.videoSource.shortName; }
          }
          else {videoSource = command.payload.data.videoSource.longName;}
        }
        else {videoSource = command.payload.data.videoSource.id;}
        videoSource = commandList.list.inputProperty.findInput(videoSource);

        if(videoSource == undefined || videoSource == null){error="That input source was not found";}
        else if(command.payload.data.mask !== undefined && command.payload.data.mask !== null){
          //Set the input source
          var packet = Buffer.alloc(4).fill(0);
          packet[0] = command.payload.data.mask ? 1 : 0;
          packet[1] = command.payload.data.id;
          packet.writeInt16BE(videoSource.id, 2);
          msg.direction = "server";
          msg.command.packet = packet;
        }
        else {error="A mask parameter is required";}
      }
      else {
        //Return the current input source
         msg.direction = "node";
         msg.command.payload.data = this.data;
      }
    }

    if(error != null) {
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
    return msg;
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