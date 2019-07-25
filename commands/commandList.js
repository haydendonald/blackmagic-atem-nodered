module.exports = {
  flags: {
    sync: 0x01,
    connect: 0x02,
    full: 0x03,
    repeat: 0x04,
    initializing: 0x05,
    unknown: 0x06,
    heartbeat: 0x11,
    error: 0x08,
    ack: 0x16
  },
  transitionStyles: {
    mix: 0x00,
    dip: 0x01,
    wipe: 0x02,
    dve: 0x03,
    sting: 0x04
  },
  tallyStates: {
    none: 0x00,
    program: 0x01,
    preview: 0x02
  },
  connectionStates: {
    disconnected: 0x00,
    connecting: 0x01,
    initializing: 0x02,
    connected: 0x03
  },
  packets: {
      // requestHandshake: new Buffer([
      //   0x10, 0x14, 0x53, 0xAB,
      //   0x00, 0x00, 0x00, 0x00,
      //   0x00, 0x3A, 0x00, 0x00,
      //   0x01, 0x00, 0x00, 0x00,
      //   0x00, 0x00, 0x00, 0x00
      // ]),
      // handshakeAnswerback: new Buffer([
      //   0x80, 0x0C, 0x53, 0xAB,
      //   0x00, 0x00, 0x00, 0x00,
      //   0x00, 0x03, 0x00, 0x00
      // ])
      requestHandshake: new Buffer([
        0x10, 0x14, 0x00, 0x00, //The two last bits need to be a random id
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x26, 0x00, 0x00,
        0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
      ]),
      handshakeAccepted: new Buffer([
        0x10, 0x14, 0x00, 0x00, //The two last bits need to be the random id
        0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x00
      ]),
      handshakeAnswerback: new Buffer([
        0x80, 0x0c, 0x00, 0x00, ////The two last bits need to be the random id
        0x00, 0x00, 0x00, 0x00,
        0x00, 0xfa, 0x00, 0x00
      ]),
      disconnect: new Buffer([
        0x10, 0x14, 0x00, 0x00, ////The two last bits need to be the random id
        0x00, 0x00, 0x00, 0x00,
        0x00, 0xf6, 0x00, 0x00,
        0x04, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
      ])
  },
  //Check if a variable is not null or undefined
  exists: function(variable) {
    return variable !== null && variable !== undefined;
  },
  list: {
      version: require("./version.js"),
      time: require("./time.js"),
      programInput: require("./programInput.js"),
      previewInput: require("./previewInput.js"),
      inputProperty: require("./inputProperty.js"),
      performCut: require("./performCut.js"),
      performAuto: require("./performAuto.js"),
      transitionPosition: require("./transitionPosition.js"),
      upstreamKeyer: require("./upstreamKeyer.js"),
      downstreamKeyer: require("./downstreamKeyer.js"),
      auxSource: require("./auxSource.js"),
      macroAction: require("./macroAction.js"),
      downstreamKeyerConfig: require("./downstreamKeyerConfig.js"),
      upstreamKeyerConfig: require("./upstreamKeyerConfig.js"),
      warning: require("./warning.js"),
      topology: require("./topology.js"),
      macroProperties: require("./macroProperties.js"),
      transitionMix: require("./transitionMix.js")
      //superSource: require("./superSource.js")
  },
  //Return the get for set and set for get command name
  findInvertedDirectionName(name) {
    for(var key in this.list) {
      if(this.list[key].get.toUpperCase() == name.toUpperCase()) {
        return this.list[key].set;
      }
      if(this.list[key].set.toUpperCase() == name.toUpperCase()) {
        return this.list[key].get;
      }
    }
  },
  findFlag(id) {
    for(var key in this.flags) {
        if(this.flags[key] == parseInt(id)) {
            return key;
        }
    }
    return id;
  },
  findCommand(name){
    for(var key in this.list) {
        if(this.list[key].get.toUpperCase() == name.toUpperCase()) {
            return this.list[key];
        }
        if(key.toUpperCase() == name.toUpperCase()) {
            return this.list[key];
        }
    }
    return null;
  },
  close(){
    for(var key in this.list) {
      this.list[key].close();
    }
  }
}
