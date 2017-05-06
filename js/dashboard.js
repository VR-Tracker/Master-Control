var websocketIP = "192.168.42.1";

/*
* On window load, open a websocket between the window and the server
* Create a master on window opening
*/
var vrtracker; // = VRTrackerWebsocket(websocketIP);

var cameraMap = new Map();
var tagMap = new Map();
var userMap = new Map();

var wsFailedAlert = document.getElementById('ws_failed_alert');
var wsSuccessAlert = document.getElementById('ws_success_alert');

//addFakeCamera("FakeCameraMac");
//addFakeCamera("FakeCameraMac2");
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
        (vrtracker.askSystemInfo());
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

}, 2000);

window.onclose=function(){
    vrtracker.socket.close();
    document.getElementById("calibrationBtn").disabled = true;
}

$(window).resize(function(){
   $('#camera-canvas').height($('#camera-canvas').width() / 1.333);
});


// For testing purposes only
function addFakeCamera(currentMac){
    cameraMap.set(currentMac, new Map());
    cameraMap.get(currentMac).set("version", "42");
    cameraMap.get(currentMac).set("calibrated", "false");
    cameraMap.get(currentMac).set("sensitivity", 50);
    cameraMap.get(currentMac).set("minblobsize", 2);
    cameraMap.get(currentMac).set("maxblobsize", 120);
    addCamera(currentMac);
}

function updateSensitivitySlider(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-sensitivity-input")).val(input.value);
    cameraMap.get(mac).set("sensitivity", input.value);
    sendCameraSettings(mac);
}


function updateMinBlobSizeSlider(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-minblobsize-input")).val(input.value);
    cameraMap.get(mac).set("minblobsize", input.value);
    sendCameraSettings(mac);
}

function updateMaxBlobSizeSlider(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-maxblobsize-input")).val(input.value);
    cameraMap.get(mac).set("maxblobsize", input.value);
    sendCameraSettings(mac);
}


function updateSensitivityInput(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-sensitivity-slider")).val(input.value);
    cameraMap.get(mac).set("sensitivity", input.value);
    sendCameraSettings(mac);
}


function updateMinBlobSizeInput(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-minblobsize-slider")).val(input.value);
    cameraMap.get(mac).set("minblobsize", input.value);
    sendCameraSettings(mac);
}

function updateMaxBlobSizeInput(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-maxblobsize-slider")).val(input.value);
    cameraMap.get(mac).set("maxblobsize", input.value);
    sendCameraSettings(mac);
}

// Return the Selected Camera MAC address using tits ID
function getSelectedCameraMac(){
    var liste = document.getElementById("cameras-grid");
    for (var i=1; i < liste.childNodes.length; i++) {
        if($(liste.childNodes[i]).hasClass('selected')){
            return liste.childNodes[i].id.split("-")[1];
        }
    }
}

function sendCameraSettings(mac){
    var message = "cmd=setcamerasettings&uid=" + mac + "&sensitivity=" + cameraMap.get(mac).get("sensitivity") + "&maxblobsize=" + cameraMap.get(mac).get("maxblobsize") + "&minblobsize=" + cameraMap.get(mac).get("minblobsize");
    console.log(message);
    sendMessage(message);
}

function saveCameraSettings(){
    var mac = getSelectedCameraMac();
    var message = "cmd=savecamerasettings&uid=" + mac + "&sensitivity=" + cameraMap.get(mac).get("sensitivity") + "&maxblobsize=" + cameraMap.get(mac).get("maxblobsize") + "&minblobsize=" + cameraMap.get(mac).get("minblobsize");
    console.log(message);
    sendMessage(message);
}

function selectcamera(camera){
    var liste = document.getElementById("cameras-grid");

    console.log($(camera).hasClass('selected'));
    if($(camera).hasClass('selected')){
        var mac = camera.id.split("-")[1];
        var message = "cmd=disabletransferpoints";
        $(camera).removeClass("selected");
        $(document.getElementById("cameras-settings-ext")).hide(800);
        sendMessage(message);
    }
    else {
        $(camera).addClass("selected");
        $(document.getElementById("cameras-settings-ext")).show(800);
        var mac = camera.id.split("-")[1];
        $(document.getElementById("camera-maxblobsize-slider")).val(cameraMap.get(mac).get("maxblobsize"));
        $(document.getElementById("camera-maxblobsize-input")).val(cameraMap.get(mac).get("maxblobsize"));
        $(document.getElementById("camera-minblobsize-slider")).val(cameraMap.get(mac).get("minblobsize"));
        $(document.getElementById("camera-minblobsize-input")).val(cameraMap.get(mac).get("minblobsize"));
        $(document.getElementById("camera-sensitivity-slider")).val(cameraMap.get(mac).get("sensitivity"));
        $(document.getElementById("camera-sensitivity-input")).val(cameraMap.get(mac).get("sensitivity"));
        var message = "cmd=transferpoints&uid=mac";
        sendMessage(message);
    }

    for (var i=1; i < liste.childNodes.length; i++) {
        if(camera.id != liste.childNodes[i].id){
            liste.childNodes[i].classList.remove("selected");
        }
    }

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
            newCamera.setAttribute("class", "col-lg-3 col-md-4 col-sm-6 camera-window");
            newCamera.setAttribute("onclick", "selectcamera(this)");
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
                        case "sensitivity":
                            cameraMap.get(currentMac).set("sensitivity", information[1]);
                            break;
                        case "minblobsize":
                            cameraMap.get(currentMac).set("minblobsize", information[1]);
                            break;
                        case "maxblobsize":
                            cameraMap.get(currentMac).set("maxblobsize", information[1]);
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
