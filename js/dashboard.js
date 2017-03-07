var websocketIP = "192.168.42.1";
//var websocketIP = "localhost";


/*
* On window load, open a websocket between the window and the server
* Create a master on window opening
*/
var vrtracker; // = VRTrackerWebsocket(websocketIP);

var cameraMap = new Map();
var tagMap = new Map();
var userMap = new Map();


/*
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
        //wsFailedAlert.style.display = "none";
        //wsSuccessAlert.style.display = "block";
        //document.getElementById("info-text").innerHTML = ChooseCameraInfos;

        //Envoi du message pour recuperer les informations sur les cameras
        socket.send(askCamerasInformation);
        //setInterval(getCamerasInformation, 5000);
        setTimeout(askSystemInfo,3000);
        socket.send("cmd=camerasposition");
        //Envoi du message apres un certain temps
    };
    // Handle any errors that occur.
    socket.onerror = function(error) {
        //wsFailedAlert.style.display = "block";
        //wsSuccessAlert.style.display = "none";
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
*/
var wsFailedAlert = document.getElementById('ws_failed_alert');
var wsSuccessAlert = document.getElementById('ws_success_alert');
function VRTrackerWebsocket (websocketType){
    console.log("Constructing websocket");
    this.websocketType = websocketType;
    //console.log(socket);
    this.socket = new WebSocket('ws://' + websocketType + ':7777/master/');//new WebSocket('ws://' + websocketIP + ':7777/user/');
    console.log("variable socket ",this.socket);

    this.socket.onopen = function(event) {
        wsFailedAlert.style.display = "none";
        wsSuccessAlert.style.display = "block";
        console.log("Websocket connected");
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
        console.log(message);
        parseMessage(message);
    }
}

VRTrackerWebsocket.prototype.createWebsocket = function(websocketType){

    this.socket = new WebSocket('ws://' + websocketType + ':7777/master/');//new WebSocket('ws://' + websocketIP + ':7777/user/');
    console.log("variable socket ",this.socket);

    this.socket.onopen = function(event) {
        wsFailedAlert.style.display = "none";
        wsSuccessAlert.style.display = "block";
        console.log("Websocket connected");
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
        console.log(message);
        parseMessage(message);
    }
}

VRTrackerWebsocket.prototype.sendMessage = function(message){
    this.socket.send(message);
}

VRTrackerWebsocket.prototype.getCamerasInformation = function(){
    this.socket.send(askCamerasInformation);
}

VRTrackerWebsocket.prototype.askSystemInfo = function(){
    console.log("envoie message systems");

    this.socket.send("cmd=systeminfos");
}

VRTrackerWebsocket.prototype.askTagInformation = function(){
    var message = "cmd=taginformation";
    this.socket.send(message);
}

VRTrackerWebsocket.prototype.restartGateway = function(){
    var message = "cmd=restart";
    this.socket.send(message);
}

function askCamerasInformation(){
    var message = "cmd=camerasinformation";
    sendMessage(socket, message);
}

function createElement(type, version, info){

}

window.onload=function(){
    vrtracker = new VRTrackerWebsocket(websocketIP)
    //addCamera("test");
    // Show a disconnected message when the WebSocket is closed.
    //console.log(vrtracker.socket);
}

window.setInterval(function(){
    if(vrtracker.socket.readyState === vrtracker.socket.CLOSED){
        vrtracker.createWebsocket();
    }
    (vrtracker.askSystemInfo());

}, 5000);

window.onclose=function(){
    vrtracker.socket.close();
    document.getElementById("calibrationBtn").disabled = true;
}

function addCamera(mac){
    console.log("adding camera");
    if(mac != ""){
        var camera = document.getElementById("camera-" + mac);
        if(camera != undefined){
            camera.innerHTML = '<svg class="glyph stroked app window with content"><use xlink:href="#stroked-camera"/></svg>'
            +'</br><p> mac: ' + mac + '</p>'
            +'<p> version: '  + cameraMap.get(mac).get("version") + '</p>'
            +'<p> calibrated: '  + cameraMap.get(mac).get("calibrated") + '</p>';

        }else{
            var liste = document.getElementById("cameras-grid");
            var newCamera = document.createElement('div');
            newCamera.setAttribute("class", "col-lg-3 col-md-4 col-sm-6");
            newCamera.setAttribute("id", "camera-" + mac);
            newCamera.innerHTML = '<svg class="glyph stroked app window with content"><use xlink:href="#stroked-camera"/></svg>'
            +'</br><p> mac: ' + mac + '</p>'
            +'<p> version: '  + cameraMap.get(mac).get("version") + '</p>'
            +'<p> calibrated: '  + cameraMap.get(mac).get("calibrated") + '</p>';
            liste.appendChild(newCamera);
        }
    }

}

function addUser(mac){
    var newUser = document.getElementById("user-" + mac);
    if(newUser == undefined){
        var liste = document.getElementById("users-grid");
        newUser = document.createElement('div');
        newUser.setAttribute("class", "col-lg-3 col-md-4 col-sm-6");
        newUser.setAttribute("id", "user-" + mac);
        liste.appendChild(newUser);
    }
    newUser.innerHTML = '<svg class="glyph stroked app window with content"><use xlink:href="#stroked-male-user"/></svg>'
    +'</br><p> mac: ' + mac + '</p>'
    +'<p> Tags:</p>';
    //for (var i = 0; i < userMap.get(mac).get("tags").length; i++) {
    for (var [key, value] of userMap.get(mac).get("tags")) {
        newUser.innerHTML += '<p>' + key + '</p>';
    }
}

function addTag(mac){
    var newTag = document.getElementById("tag-" + mac);
    if(newTag == undefined){
        var liste = document.getElementById("tags-grid");
        newTag = document.createElement('div');
        newTag.setAttribute("class", "col-lg-3 col-md-4 col-sm-6");
        newTag.setAttribute("id", "tag-" + mac);
        liste.appendChild(newTag);
    }
    newTag.innerHTML = '<svg class="glyph stroked app window with content"><use xlink:href="#stroked-tag"/></svg>'
    +'</br><p> mac: ' + mac + '</p>'
    +'<p> battery: '  + tagMap.get(mac).get("battery") + '%</p>'
    +'<p> status: '  + tagMap.get(mac).get("status") + '</p>'
    +'<p> version: '  + tagMap.get(mac).get("version") + '</p>';
}

var countElementGateway = new Map();
countElementGateway.set("cameras", 0);
countElementGateway.set("tags", 0);
countElementGateway.set("users", 0);
countElementGateway.set("masters", 0);
var positionCount = 0;

function parseMessage(message){
    var messageContent = message.split("&");
    var cmd, information;
    var contentMap = new Map();
    try{
        var cmdContent = messageContent[0].split("=");
        cmd = cmdContent[1];
        contentMap.delete("cmd");
        for (var i = 1; i < messageContent.length; i++ ) {
            information = messageContent[i].split("=");
            contentMap.set(information[0], information[1]);
        }
    }catch (e) {
        console.error("Parsing error:", e);
    }
    console.log("message", messageContent);
    switch (cmd) {
        case "camerasinformation":{
            if(messageContent.length > 0){
                var currentMac = "";
                for (var i = 1; i < messageContent.length; i++ ) {
                    information = messageContent[i].split("=");
                    switch (information[0]){
                        case "uid":
                            currentMac = information[1];
                            if(!cameraMap.has(information[1])){
                                cameraMap.set(currentMac, new Map());
                                cameraMap.get(currentMac).set("version", "");
                                cameraMap.get(currentMac).set("calibrated", "false");
                            }
                            addCamera(currentMac);
                            break;
                        case "version":
                            cameraMap.get(currentMac).set("version", information[1]);
                            break;
                        case "calibrated":
                            cameraMap.get(currentMac).set("calibrated", information[1]);
                            break;
                        default:
                            console.log("error:", information);
                            break;
                    }

                }

            }else{
                console.log("message trop court");
            }
            break;
        }
        case "systeminfos":{
            try {
                //console.log("Mise a jour des valeurs");
                countElementGateway.set("cameras", contentMap.get("cameras"));
                countElementGateway.set("tags", contentMap.get("tags"));
                countElementGateway.set("users", contentMap.get("users"));
                countElementGateway.set("masters", contentMap.get("masters"));
                document.getElementById("camera-count").innerHTML = countElementGateway.get("cameras");
                document.getElementById("tag-count").innerHTML = countElementGateway.get("tags");
                document.getElementById("user-count").innerHTML = countElementGateway.get("users");
                document.getElementById("master-count").innerHTML = countElementGateway.get("masters");
            } catch (e) {
                console.error("Parsing error", e);
            }
            break;
        }
        case "error":{
            if(contentMap.has("msg")){
                switch (contentMap.get("msg")) {

                    default:
                    break;
                }
            }
            break;
        }
        case "info":{
            if(contentMap.has("msg")){

            }
            break;
        }
        case "tagsinfo":{
            console.log("message", messageContent);
            if(messageContent.length > 0){
                var currentMac = "";
                for (var i = 1; i < messageContent.length; i++ ) {
                    information = messageContent[i].split("=");
                    switch (information[0]){
                        case "uid":
                            currentMac = information[1];
                            if(!tagMap.has(information[1])){
                                tagMap.set(currentMac, new Map());
                                tagMap.get(currentMac).set("version", "");
                                tagMap.get(currentMac).set("battery", "0");
                                tagMap.get(currentMac).set("status", "lost");
                            }
                            addTag(currentMac);
                            break;
                        case "version":
                            tagMap.get(currentMac).set("version", information[1]);
                            break;
                        case "battery":
                            tagMap.get(currentMac).set("battery", information[1]);
                            break;
                        case "status":
                            tagMap.get(currentMac).set("status", information[1]);
                            break;
                        default:
                            console.log("error:", information);
                            break;
                    }

                }

            }else{
                console.log("message trop court");
            }
            break;
        }
        case "usersinfo":{
            console.log("message", messageContent);
            if(messageContent.length > 0){
                var currentMac = "";
                console.log("treating message");
                for (var i = 1; i < messageContent.length; i++ ) {
                    information = messageContent[i].split("=");
                    switch (information[0]){
                        case "uid":
                            currentMac = information[1];
                            if(!userMap.has(information[1])){
                                userMap.set(currentMac, new Map());
                                userMap.get(currentMac).set("tags", new Map());
                            }
                            addUser(currentMac);
                            break;
                        default:
                            userMap.get(currentMac).get("tags").set(information[1], true);
                            break;
                    }

                }

            }else{
                console.log("message trop court");
            }
            break;
        }
        default:
            break;
    }
}

//verify if the string is a number
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function changeNumberFormat(string){
    var part = string.split(".");
    if(part.length == 2){
        var indice = part[1].length - 1;
        while(part[1][indice] == "0" && indice > 0){
            indice--;
        }
        return string.substr(0, part[0].length + 2 + indice);
    }else{
        if(part.length == 1){
            return string + ".0";
        }else{
            console.log("Error format");
        }
    }
}

function restartGateway(){
    console.log("send restart system");
    vrtracker.restartGateway();
}
