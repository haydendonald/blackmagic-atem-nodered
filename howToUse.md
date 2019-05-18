# How to Use
In general the operation of the node is dependent on the ATEM it's self. This node stores information such as the input properties, keyer information etc but the ATEM is expected to update the information stored. The node is seperated into several commands that can be performed that all follow the research by SKAARHOJ found at https://www.skaarhoj.com/fileadmin/BMDPROTOCOL.html.
## General Command Layout
The general command layout is the same for most functions as seen below. In general the "raw" part of the command defines the raw information passed by the ATEM. The "cmd" portion defines what command has been found and processed with the "data" being the outputted information from the supported command.
```
//Received Information Format
var msg.payload = {
    "cmd": "The command",
    "raw": {
        "flag": "The flag of the packet that was sent",
        "length": "The length of the packet",
        "name": "The command name",
        "packet": "The raw packet"
    },
    "data": {
        "The data outputted by a supported Command."
    },
}
//Send Information Format
var msg.payload = {
    "cmd": "The command",
    "data": {
        "The data outputted by a supported Command. Note if this is empty it will return allstored data"
    },
}
```

## Example setting the program input to 0 on ME 0
```
[{"id":"78488d8.fa1d574","type":"function","z":"4ecf69fc.958c48","name":"Change Program Input On ME 0 To Input 1","func":"var msg1 = {\n    \"payload\": {\n        \"cmd\": \"programInput\",\n        \"data\": {\n            \"ME\": 0,\n            \"videoSource\": {\n                \"id\": 0\n            }\n        }\n    }\n}\nreturn msg1;","outputs":1,"noerr":0,"x":611,"y":180,"wires":[["6e96c850.4b84c8"]]},{"id":"6e96c850.4b84c8","type":"atem-atem","z":"4ecf69fc.958c48","name":"ATEM","network":"3260f992.1b9866","outputMode":"all","x":858,"y":179,"wires":[["a9196221.5360f"]]},{"id":"2b3e1a40.2130e6","type":"inject","z":"4ecf69fc.958c48","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"x":348,"y":180,"wires":[["78488d8.fa1d574"]]},{"id":"a9196221.5360f","type":"debug","z":"4ecf69fc.958c48","name":"","active":true,"console":"false","complete":"false","x":1019,"y":179,"wires":[]},{"id":"b9195ab8.f950f8","type":"comment","z":"4ecf69fc.958c48","name":"Remember to change the ip address","info":"Open ATEM and edit the network and set \nthe ip address of the atem.\n\nThe IP Address can be found in the ATEM setup utility","x":862.5,"y":129,"wires":[]},{"id":"3260f992.1b9866","type":"atem-network","z":"","name":"Test ATEM","ipAddress":"0.0.0.0"}]
```

## Raw Command (Get/Set)
Performs a raw command to the ATEM. The commands can be found at https://www.skaarhoj.com/fileadmin/BMDPROTOCOL.html.
### cmd = "raw"
### name = The name of the command to be passed
### packet = The raw buffer of the packet to be sent

```
//This will set ME 0 to input 0
var msg = {
    "payload": {
        "cmd": "raw",
        "data": {
            "name": "CPgI",
            "packet": new Buffer.from([0, 0, 0, 0])
        }
    }
}
```

## Program Input (Get/Set)
Changes the program input on a ME
### cmd = "programInput"
### ME = The ME to perform the action on
Where the MEs start at 0. So ME 1 is 0
### videoSource = The video source to change the ME to
This can contain either the id, shortName or longName
Integer of the macro id starting at 0

```
//This will set input 0 (Blk) to ME 0
var msg = {
    "payload": {
        "cmd": "programInput",
        "data": {
            "ME": 0,
            "videoSouce": {
                id: 0,
                shortName: "blk",
                longName: "black" //(Only one of the above is requred)
            }
        }
    }
}
```

## Preview Input (Get/Set)
Changes the preview input on a ME
### cmd = "previewInput"
### ME = The ME to perform the action on
Where the MEs start at 0. So ME 1 is 0
### videoSource = The video source to change the ME to
This can contain either the id, shortName or longName
Integer of the macro id starting at 0

```
//This will set input 0 (Blk) to ME 0
var msg = {
    "payload": {
        "cmd": "previewInput",
        "data": {
            "ME": 0,
            "videoSource": {
                id: 0,
                shortName: "blk",
                longName: "black" //(Only one of the above is requred)
            }
        }
    }
}
```

## Input Property (Get/Set)
Gets the properties of a input
### cmd = "inputProperty"
### id = The id of the input
### longName = The long name of the input
### shortName = The short name of the input
### avaliableExternalPortTypes = The avaliable external port types for the input
### externalPortTypes = The external port types set to the input
### portType = The port type of the input
### avaliability = The avaliability of the input
### MEAvaliabiity = The avaliability for MEs for the input
### inTransition = The input is in transition somewhere
### framesRemaining = If the input is in transition how many frames are left
### position = If the input is in transition what is the fader position
### tallys = The list of tallys
### tallys.programTally.state = If the input is live on the program on a ME
### tallys.programTally.ID = What ME the input is live on
### tallys.previewTally.state = If the input is live on the preview on a ME
### tallys.previewTally.ID = What ME the input is live on
### tallys.downstreamKeyerTallyFill.state = If the input is live on the keyer
### tallys.downstreamKeyerTallyFill.ID = What keyer it is live on
### tallys.downstreamKeyerTallyKey.state = If the input is live on the keyer
### tallys.downstreamKeyerTallyKey.ID = What keyer it is live on
### tallys.upstreamKeyerTallyFill.state = If the input is live on the keyer
### tallys.upstreamKeyerTallyFill.ID = What keyer it is live on
### tallys.upstreamKeyerTallyKey.state = If the input is live on the keyer
### tallys.upstreamKeyerTallyKey.ID = What keyer it is live on

```
//This will ask for all input properties
var msg = {
    "payload": {
        "cmd": "inputProperty",
        "data": {}
    }
}
```

## Perform Cut (Set)
Performs a cut transition on a ME
### cmd = "performCut"
### ME = The ME to perform the action on
Where the MEs start at 0. So ME 1 is 0

```
//This will perform a cut on ME 0
var msg = {
    "payload": {
        "cmd": "performCut",
        "data": {
            "ME": 0
        }
    }
}
```

## Perform Auto (Set)
Performs a auto transition on a ME
### cmd = "performAuto"
### ME = The ME to perform the action on
Where the MEs start at 0. So ME 1 is 0

```
//This will perform a cut on ME 0
var msg = {
    "payload": {
        "cmd": "performAuto",
        "data": {
            "ME": 0
        }
    }
}
```

## Downstream Keyer (Get/Set)
Controls the downstream keyers
### cmd = "downstreamKeyer"
### keyer[x] = The keyer
Where x is the keyer number 0 - 4
### id = The keyer id
### state = The keyer state
### keyer[x].fillSource = The fill source of this keyer
### keyer[x].keySource = The key source of this keyer
### keyer[x].state = The keyer state
### keyer[x].inTransition = If this keyer is in transition
### keyer[x].isAutoTransitioning = If this keyer is in a auto transition
### keyer[x].framesRemaining = The amount of frames remaining for the transition

```
//This will turn downstream keyer 0 on air
var msg = {
    "payload": {
        "cmd": "downstreamKeyer",
        "data": {
            "id": 0,
            "state: true
        }
    }
}
```

## Upstream Keyer (Get/Set)
Controls the upstream keyers
### cmd = "upstreamKeyer"
### keyer[x] = The keyer
Where x is the keyer number 0 - 4
### keyerId = The keyer id
### keyerState = The keyer state
### keyer[x].fillSource = The fill source of this keyer
### keyer[x].keySource = The key source of this keyer
### keyer[x].onAir = If this keyer is onAir
### keyer[x].inTransition = If this keyer is in transition
### keyer[x].isAutoTransitioning = If this keyer is in a auto transition
### keyer[x].framesRemaining = The amount of frames remaining for the transition

```
//This will turn upstream keyer 0 on ME 0 on air
var msg = {
    "payload": {
        "cmd": "downstreamKeyer",
        "data": {
            "ME": 0,
            "id": 0,
            "state: true
        }
    }
}
```

## Time (Get)
The time read from the ATEM
### cmd = "time"
### hour = The hour
### minute = The minute
### second = The second
### frame = The current frame number

```
//This will get the current time on the ATEM
var msg = {
    "payload": {
        "cmd": "time",
        "data": {}
    }
}
```

## Transition Position (Get/Set)
The time read from the ATEM
### cmd = "transitionPosition"
### ME = The ME the transition is current on
### inTransition = If the transition is transitioning
### framesRemaining = The frames remaining in the transition
### position = The current position of the transition
0 - 9999

```
//This will set the transition position on ME 0 to be half way
var msg = {
    "payload": {
        "cmd": "transitionPosition",
        "data": {
            "ME": 0,
            "position": 4999
        }
    }
}
```

## Macro Action (Set)
Performs a maro
### cmd = "macroAction"
### macroId = the macro id
Integer of the macro id starting at 0
### action = the type of action
- "run" - Runs the command
- "stop" - Stops the command
- "stoprecording" - Stops recoding a macro
- "insertwaitforuser" - Inserts a wait for the user
- "continue" - Continue the marco after a pause
- "deletemacro" - Deletes the macro

```
//This will run macro 0
var msg = {
    "payload": {
        "cmd": "macroAction",
        "data": {
            "macroId": 0,
            "action": "run"
        }
    }
}
```