#How to Use
In general the operation of the node is dependent on the ATEM it's self. This node stores information such as the input properties, keyer information etc but the ATEM is expected to update the information stored. The node is seperated into several commands that can be performed that all follow the research by SKAARHOJ found at https://www.skaarhoj.com/fileadmin/BMDPROTOCOL.html.
##General command layout
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
        "The data outputted by a supported Command"
    },
}
//Send Information Format
var msg.payload = {
    "cmd": "The command",
    "data": {
        "The data outputted by a supported Command"
    },
}
```

## Macro Action
###cmd = "macroAction"
###macroId = the macro id
Integer of the macro id starting at 0
###action = the type of action
- "run" - Runs the command
- "stop" - Stops the command
- "stoprecording" - Stops recoding a macro
- "insertwaitforuser" - Inserts a wait for the user
- "continue" - Continue the marco after a pause
- "deletemacro" - Deletes the macro


//Macro Action
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


//Program Input
//This will put input 0 on ME 0
var msg = {
    "payload": {
        "cmd": "programInput",
        "data": {
            "videoSource": {
                "id": 0
            }
        }
    }
}