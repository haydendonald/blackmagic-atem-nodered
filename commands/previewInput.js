module.exports = {
  get: "PrvI",
  set: "CPvI",
  cmd: "previewInput",
  data: {},
  close() {
    this.data = {};
  },
  initializeData(data, flag, commandList) {
    var command = {"payload":{"data":{}}};
    this.processData(data, flag, command, commandList, false);
  },
  processData(data, flag, command, commandList, sendTallyUpdates=true) {
    command.payload.cmd = this.cmd;
    command.payload.data.ME = data[0];
    command.payload.data.inputNumber = data.readUInt16BE(2);
    command.payload.data.videoSource = commandList.list.inputProperty.findInput(data.readUInt16BE(2));

    //Add the transition position params if they don't exist
    if(this.data[command.payload.data.ME] == undefined || this.data[command.payload.data.ME] == null) {
      command.payload.data.inTransition = false;
      command.payload.data.framesRemaining = false;
      command.payload.data.position = false;
    }
    
    commandList.list.inputProperty.updateTallysME(data[0], "previewTally", command.payload.data.videoSource, sendTallyUpdates);

    //Send the input properties of the updated inputs
    if(sendTallyUpdates && flag==commandList.flags.initializing) {
      for(var i in messageCallbacks) {
          var msg = {
            "topic": "command",
            "payload": {
              "cmd": commandList.list.inputProperty.cmd,
              "data": commandList.list.inputProperty.data,
            }
          }
        messageCallbacks[i](msg);
      }
    }

    this.data[command.payload.data.ME] = command.payload.data;
    command.payload.data = this.data;
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

    //If the data is null return the value
    if(command.payload.data == undefined || command.payload.data == null) {error="The data parameter was null";}
    else {
      //Sending a empty ME will return all MEs
      if(command.payload.data.ME == undefined || command.payload.data.ME == null){
        msg.direction = "node";
        msg.command.payload.data = this.data;
      }
      //Else if the video source is empty return the MEs current video source
      else if(command.payload.data.videoSource == undefined || command.payload.data.videoSource == null) {
        msg.direction = "node";
        msg.command.payload.data = this.data[command.payload.data.ME];
      }
      //Else set the video source on the ME
      else {
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

        if(videoSource == null){error = "A video source identifier is required (id, shortName, longName)";}
        else {
          videoSource = commandList.list.inputProperty.findInput(videoSource);
          if(videoSource == null) {error = "That video source was not found";}
          else {
            if(this.data[command.payload.data.ME] == null) {error = "That ME was not found";}
            else {
              //Generate the packet
              var packet = Buffer.alloc(4).fill(0);
              packet[0] = command.payload.data.ME;
              packet.writeInt16BE(videoSource.id, 2);
              msg.direction = "server";
              msg.command.packet = packet;

              //Check if the input is currently on this ME, if it is don't resend it
              if(this.data[command.payload.data.ME].videoSource.id == videoSource.id) {
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
              }
            }
          }
        }
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
  //Update the transition position
  updateTransitionPosition(ME, inTransition, framesRemaining, position) {
    this.data[ME].inTransition = inTransition;
    this.data[ME].framesRemaining = framesRemaining;
    this.data[ME].position = position;
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