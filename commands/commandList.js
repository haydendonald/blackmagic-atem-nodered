module.exports = {
  flags: {
    sync: 0x01,
    connect: 0x02,
    repeat: 0x04,
    initializing: 0x05,
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
  packets: {
      requestHandshake: new Buffer([
        0x10, 0x14, 0x53, 0xAB,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x3A, 0x00, 0x00,
        0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
      ]),
      handshakeAnswerback: new Buffer([
        0x80, 0x0C, 0x53, 0xAB,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x03, 0x00, 0x00
      ])
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
      macroAction: require("./macroAction.js")
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
  }
}
