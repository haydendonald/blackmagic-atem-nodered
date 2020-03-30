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
  version: {
    V8_0: 2.28
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
  cameraOptions: {
    adjustmentDomain: {
      lens: 0x00,
      camera: 0x01,
      chip: 0x08
    },
    lensFeature: {
      focus: 0x00,
      autoFocused: 0x01,
      iris: 0x02,
      autoIris:0x05,
      zoomPosition: 0x08,
      zoom: 0x09
    },
    cameraFeature: {
      lowerGain: 0x0D,
      gain: 0x01,
      whiteBalance: 0x02,
      shutter: 0x05,
      lowerGainValues: {
        "-12db": 0xF4B3,
        "-6db": 0xFA00,
        // "0db": 0x0000,
        // "6db": 0x0600,
        // "12db": 0x0C00,
        // "18db": 0x1249,
        // "24db": 0x1800,
      },
      gainValues: {
        // "-12db": 0x0000,
        // "-6db": 0x0000,
        // "0db": 660,
         "0db": 572,
        // "6db": 0x0400,
       "6db": 1084,
        // "12db": 0x080C,
        "12db": 2108,
        //"18db": 01000,
        "18db": 4156,
        //"18db": 4244,
        "24db": 8252,
        //"24db": 8340,
      },
      shutterValues: {
        "1/24": 41667,
        "1/25": 40000,
        "1/30": 33333,
        "1/50": 20000,
        "1/60": 16667,
        "1/75": 13333,
        "1/90": 11111,
        "1/100": 10000,
        "1/120": 8333,
        "1/150": 6667,
        "1/180": 5556,
        "1/250": 4000,
        "1/360": 2778,
        "1/500": 2000,
        "1/725": 1379,
        "1/1000": 1000,
        "1/1450": 690,
        "1/2000": 500,
      }
    },
    chipFeature: {
      lift: 0x00,
      gamma: 0x01,
      gain: 0x02,
      aperture: 0x03,
      contrast: 0x04,
      lum: 0x05,
      sat: 0x06
    },
    setParameter: {
      shutter: new Buffer([0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
      whiteBalance: new Buffer([0x02, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00]),
      overallGain: new Buffer([0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]),
      zoom: new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00]),
      iris: new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00]),
      auto: new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      gain: new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00]),
      gamma: new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00]),
      lift: new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00]),
      contrast: new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00]),
      lum: new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00]),
      saturation: new Buffer([0x80, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00])
    }
  },
  audioMixer: {
    inputTypes: {
      externalvideo: 0x00,
      mediaplayer: 0x01,
      externalaudio: 0x02
    },
    plugTypes: {
      internal: 0x00,
      sdi: 0x01,
      hdmi: 0x02,
      component: 0x03,
      composite: 0x04,
      svideo: 0x05,
      xlr: 0x20,
      aesebu: 0x40,
      rca: 0x80
    },
    mixOptions: {
      off: 0x00,
      on: 0x01,
      afv: 0x02
    }
  },

  //Check if a variable is not null or undefined
  exists: function(variable) {
    return variable !== null && variable !== undefined;
  },

  //Is the variable valid?
  isValid(variable) {
    return variable !== undefined && variable !== null;
  },

  //Find a flag
  findFlag(id) {
    for(var key in this.flags) {
        if(this.flags[key] == parseInt(id)) {
            return key;
        }
    }
    return id;
  },

  //Packets object
  packets: function() {
    return {
      requestHandshake: new Buffer([
        0x10, 0x14, 0x00, 0x00, //The two last bits need to be a random id
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x26, 0x00, 0x00,
        0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
      ]),
      handshakeAccepted: new Buffer([
        0x10, 0x14, 0x00, 0x00 //The two last bits need to be the random id
        // 0x00, 0x00, 0x00, 0x00, 
        // 0x00, 0x00, 0x00, 0x00
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
    }
  },

  list: function() {
    return {
      version: require("./version.js").object(),
      time: require("./time.js").object(),
      programInput: require("./programInput.js").object(),
      previewInput: require("./previewInput.js").object(),
      inputProperty: require("./inputProperty.js").object(),
      performCut: require("./performCut.js").object(),
      performAuto: require("./performAuto.js").object(),
      transitionPosition: require("./transitionPosition.js").object(),
      upstreamKeyer: require("./upstreamKeyer.js").object(),
      downstreamKeyer: require("./downstreamKeyer.js").object(),
      auxSource: require("./auxSource.js").object(),
      macroAction: require("./macroAction.js").object(),
      downstreamKeyerConfig: require("./downstreamKeyerConfig.js").object(),
      upstreamKeyerConfig: require("./upstreamKeyerConfig.js").object(),
      warning: require("./warning.js").object(),
      topology: require("./topology.js").object(),
      macroProperties: require("./macroProperties.js").object(),
      transitionMix: require("./transitionMix.js").object(),
      superSourceBox: require("./superSourceBoxPre8_0.js").object(),
      superSourceBox: require("./superSourceBox8_0.js").object(),
      cameraControl: require("./cameraControl.js").object(),
      audioMixerInput: require("./audioMixerInput.js").object(),
      audioMixerMonitor: require("./audioMixerMonitor.js").object()
      //superSource: require("./superSource.js")
    }
  },

  //Return the get for set and set for get command name
  findInvertedDirectionName(name, commands) {
    for(var key in commands) {
      if(commands[key].get.toUpperCase() == name.toUpperCase()) {
        return commands[key].set;
      }
      if(commands[key].set.toUpperCase() == name.toUpperCase()) {
        return commands[key].get;
      }
    }
  },

  //Find a command and return it
  findCommand(name, commands){
    for(var key in commands) {
        if(commands[key].get.toUpperCase() == name.toUpperCase()) {
            return commands[key];
        }
        if(key.toUpperCase() == name.toUpperCase()) {
            return commands[key];
        }
    }
    return null;
  },

  //Ask all commands to close and clear their data
  close(commands){
    for(var key in commands) {
      commands[key].close();
    }
  }
}
