VRTrackerWebsocket = function (websocketIP){
    this.socket = WebSocket.call(this, 'ws://' + websocketIP + ':7777/user/');
    //this.ip =
    //this.socket = new WebSocket('ws://' + websocketIP + ':7777/user/');

    this.socket.onopen = function(event) {
        wsFailedAlert.style.display = "none";
        wsSuccessAlert.style.display = "block";
        console.log("Websocket connected");
        assingAllTags();
    };
    // Handle any errors that occur.
    this.socket.onerror = function(error) {
        wsFailedAlert.style.display = "block";
        wsSuccessAlert.style.display = "none";
        console.log('WebSocket Error: ' + error);
    }
    // Handle messages sent by the server.
    this.socket.onmessage = function(event) {
        //getting the time of the message
        var message = event.data;
        parseMessage(message);
    }
}

VRTrackerWebsocket.prototype.sendMessage = function(websocket, message){
    websocket.send(message);
}

VRTrackerWebsocket.prototype.getCamerasInformation = function(){
    if(!calibrating)
        socket.send(askCamerasInformation);
}
