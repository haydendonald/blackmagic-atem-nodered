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

## Example setting the program input to 0 on ME 0
```
[{"id":"78488d8.fa1d574","type":"function","z":"4ecf69fc.958c48","name":"Change Program Input On ME 0 To Input 1","func":"var msg1 = {\n    \"payload\": {\n        \"cmd\": \"programInput\",\n        \"data\": {\n            \"ME\": 0,\n            \"videoSource\": {\n                \"id\": 0\n            }\n        }\n    }\n}\nreturn msg1;","outputs":1,"noerr":0,"x":611,"y":180,"wires":[["6e96c850.4b84c8"]]},{"id":"6e96c850.4b84c8","type":"atem-atem","z":"4ecf69fc.958c48","name":"ATEM","network":"3260f992.1b9866","outputMode":"all","x":858,"y":179,"wires":[["a9196221.5360f"]]},{"id":"2b3e1a40.2130e6","type":"inject","z":"4ecf69fc.958c48","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"x":348,"y":180,"wires":[["78488d8.fa1d574"]]},{"id":"a9196221.5360f","type":"debug","z":"4ecf69fc.958c48","name":"","active":true,"console":"false","complete":"false","x":1019,"y":179,"wires":[]},{"id":"b9195ab8.f950f8","type":"comment","z":"4ecf69fc.958c48","name":"Remember to change the ip address","info":"Open ATEM and edit the network and set \nthe ip address of the atem.\n\nThe IP Address can be found in the ATEM setup utility","x":862.5,"y":129,"wires":[]},{"id":"3260f992.1b9866","type":"atem-network","z":"","name":"Test ATEM","ipAddress":"0.0.0.0"}]
```

## Macro Action
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