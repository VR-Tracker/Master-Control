var websocketIP = "192.168.42.1";
//var websocketIP = "localhost";


/*
* On window load, open a websocket between the window and the server
* Create a master on window opening
*/
window.onload=function(){
    createWebsocket();
    // Show a disconnected message when the WebSocket is closed.
    socket.onclose = function(event) {
        console.log("socket closed");
    }
}


window.onclose=function(){
    socket.close();
    document.getElementById("calibrationBtn").disabled = true;
}

window.setInterval(function(){
    if(socket.readyState === socket.CLOSED){
        createWebsocket();
    }
}, 2000);

function sendMessage(websocket, message){
    websocket.send(message);
}


function createWebsocket(){
    socket = new WebSocket('ws://' + websocketIP + ':7777/master/');
    socket.onopen = function(event) {
        wsFailedAlert.style.display = "none";
        wsSuccessAlert.style.display = "block";
        document.getElementById("info-text").innerHTML = ChooseCameraInfos;

        //Envoi du message pour recuperer les informations sur les cameras
        socket.send(askCamerasInformation);
        //setInterval(getCamerasInformation, 5000);
        setTimeout(askSystemInfo,3000);
        socket.send("cmd=camerasposition");
        //Envoi du message apres un certain temps
    };
    // Handle any errors that occur.
    socket.onerror = function(error) {
        wsFailedAlert.style.display = "block";
        wsSuccessAlert.style.display = "none";
        console.log('WebSocket Error: ' + error);
        //document.getElementById("calibrationBtn").disabled = true;
    }
    // Handle messages sent by the server.
    socket.onmessage = function(event) {
        //getting the time of the message
        var message = event.data;
        parseMessage(message);
    }
}

function askSystemInfo(){
    var message = "cmd=systemversions";
    sendMessage(socket, message);
}

function askCamerasInformation(){
    var message = "cmd=camerasinformation";
    sendMessage(socket, message);
}

function createElement(type, version, info){
    
}
