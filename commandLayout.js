//Command Layout


//Receive
var msg.payload = {
    "raw": {
        "flag": "The flag of the packet that was sent",
        "length": "The length of the packet",
        "name": "The command name",
        "packet": "The raw packet"
    },
    "data": {
        "The data outputted by a supported Command"
    },
    "cmd": "The command",
}


//Send
var msg.payload = {
    "cmd": "The command",
    "data": {
        "The data specific to the command"
    }
}





