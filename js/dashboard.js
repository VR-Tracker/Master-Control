var websocketIP = "192.168.42.1";

/*
* On window load, open a websocket between the window and the server
* Create a master on window opening
*/

var socket; // = VRTrackerWebsocket(websocketIP);

var cameraMap = new Map();
var tagMap = new Map();
var userMap = new Map();
var camerasPositionMap = new Map();
var wsFailedAlert = document.getElementById('ws_failed_alert');
var wsSuccessAlert = document.getElementById('ws_success_alert');
var gatewayLatestVersion = "searching...";
var cameraLatestVersion = "searching...";
var tagLatestVersion = "searching...";
var gatewayVersion;
var trackingPointActivated = false;
var hideUpdateVersionLink = true;
var retrieveVersionErrorMsg = "Can't retrieve latest gateway version"

function VRTrackerWebsocket (websocketType){

    this.websocketType = websocketType;
    socket = new WebSocket('ws://' + websocketType + ':7777/master/');//new WebSocket('ws://' + websocketIP + ':7777/user/');
    socket.binaryType = 'arraybuffer';

    socket.onopen = function(event) {
        wsFailedAlert.style.display = "none";
        wsSuccessAlert.style.display = "block";
        (vrtracker.askSystemInfo());
    };

    // Handle any errors that occur.
    socket.onerror = function(error) {
        wsFailedAlert.style.display = "block";
        wsSuccessAlert.style.display = "none";
    }
    // Handle messages sent by the server.
    socket.onmessage = function(event) {
        if (typeof event.data !== 'string') {
            var data3 = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(event.data)));
        } else {
            //getting the time of the message
            var message = event.data;
            parseMessage(message);
        }
    }
}

VRTrackerWebsocket.prototype.createWebsocket = function(websocketType){

    this.websocketType = websocketType;
    socket = new WebSocket('ws://' + websocketType + ':7777/master/');//new WebSocket('ws://' + websocketIP + ':7777/user/');
    socket.binaryType = 'arraybuffer';

    socket.onopen = function(event) {
        wsFailedAlert.style.display = "none";
        wsSuccessAlert.style.display = "block";
        (vrtracker.askSystemInfo());
    };
    // Handle any errors that occur.
    socket.onerror = function(error) {
        wsFailedAlert.style.display = "block";
        wsSuccessAlert.style.display = "none";
    }
    // Handle messages sent by the server.
    socket.onmessage = function(event) {
        if (typeof event.data !== 'string') {
            var data3 = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(event.data)));
        } else {
            //getting the time of the message
            var message = event.data;
            parseMessage(message);
        }
    }
}

VRTrackerWebsocket.prototype.sendMessage = function(message){
    socket.send(message);
}

VRTrackerWebsocket.prototype.getCamerasInformation = function(){
    //socket.send(askCamerasInformation);
}

VRTrackerWebsocket.prototype.askSystemInfo = function(){
    socket.send("cmd=systeminfos");
    socket.send("cmd=systemversions");
}

VRTrackerWebsocket.prototype.askTagInformation = function(){
    var message = "cmd=taginformation";
    socket.send(message);
}

VRTrackerWebsocket.prototype.restartGateway = function(){
    var message = "cmd=restart";
    socket.send(message);
}

function askCamerasInformation(){
    var message = "cmd=camerasinformation";
    sendMessage(socket, message);
}

function createElement(type, version, info){

}

window.onload=function(){
    getLatestVersion();
    vrtracker = new VRTrackerWebsocket(websocketIP)
    //addCamera("test");
    // Show a disconnected message when the WebSocket is closed.
}

window.setInterval(function(){
    if(socket.readyState === socket.CLOSED){
        vrtracker = new VRTrackerWebsocket(websocketIP)
    }
    //(vrtracker.askSystemInfo());

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
    cameraMap.get(currentMac).set("activated", false);
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

function updateGainSlider(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-gain-input")).val(input.value);
    cameraMap.get(mac).set("gain", input.value);
    sendCameraSettings(mac);
}

function updateExposureSlider(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-exposure-input")).val(input.value);
    cameraMap.get(mac).set("exposure", input.value);
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


function updateGainInput(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-gain-slider")).val(input.value);
    cameraMap.get(mac).set("gain", input.value);
    sendCameraSettings(mac);
}

function updateExposureInput(input){
    var mac = getSelectedCameraMac();
    $(document.getElementById("camera-exposure-slider")).val(input.value);
    cameraMap.get(mac).set("exposure", input.value);
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

// Return the Selected Camera MAC address using tits ID
function getSelectedTagMac(){
    var liste = document.getElementById("tags-grid");
    for (var i=1; i < liste.childNodes.length; i++) {
        if($(liste.childNodes[i]).hasClass('selected')){
            return liste.childNodes[i].id.split("-")[1];
        }
    }
}

function sendCameraSettings(mac){
    var message = "cmd=setcamerasettings&uid=" + mac
    + "&sensitivity=" + cameraMap.get(mac).get("sensitivity")
    + "&maxblobsize=" + cameraMap.get(mac).get("maxblobsize")
    + "&minblobsize=" + cameraMap.get(mac).get("minblobsize")
    + "&gain=" + cameraMap.get(mac).get("gain")
    + "&exposure=" + cameraMap.get(mac).get("exposure");
    socket.send(message);
}

function sendCameraGain(mac){
    var message = "cmd=gaincamera&uid=" + mac + "&value=" + cameraMap.get(mac).get("gain");
    socket.send(message);
}

function sendCameraExposure(mac){
    var message = "cmd=exposurecamera&uid=" + mac + "&value=" + cameraMap.get(mac).get("exposure");
    socket.send(message);
}

function saveCameraSettings(){
    var mac = getSelectedCameraMac();
    var message = "cmd=savecamerasettings&uid=" + mac
    + "&sensitivity=" + cameraMap.get(mac).get("sensitivity")
    + "&maxblobsize=" + cameraMap.get(mac).get("maxblobsize")
    + "&minblobsize=" + cameraMap.get(mac).get("minblobsize")
    + "&gain=" + cameraMap.get(mac).get("gain")
    + "&exposure=" + cameraMap.get(mac).get("exposure");
    socket.send(message);
}

function snapshotCamera(){
    var mac = getSelectedCameraMac();
    var message = "cmd=camerasnapshot&uid=" + mac;
    socket.send(message);
}

function selectcamera(camera){
    var liste = document.getElementById("cameras-grid");

    if($(camera).hasClass('selected')){
        var mac = camera.id.split("-")[1];
        var message = "cmd=disabletransferpoints";
        $(camera).removeClass("selected");
        $(document.getElementById("cameras-settings-ext")).hide(800);
        socket.send(message);

        message = "cmd=unselectcamera&uid=" + mac;
        socket.send(message);
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
        $(document.getElementById("camera-gain-slider")).val(cameraMap.get(mac).get("gain"));
        $(document.getElementById("camera-gain-input")).val(cameraMap.get(mac).get("gain"));
        $(document.getElementById("camera-exposure-slider")).val(cameraMap.get(mac).get("exposure"));
        $(document.getElementById("camera-exposure-input")).val(cameraMap.get(mac).get("exposure"));
        var message = "cmd=transferpoints&uid=" + mac;
        socket.send(message);

        message = "cmd=selectcamera&uid=" + mac;
        socket.send(message);
        var canvas = document.getElementById("camera-canvas");
        var ctx = canvas.getContext("2d");
        if(trackingPointActivated){
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if(cameraMap.get(mac).has("activated")){
            document.getElementById("activate-btn").style.display = "inline-block";
            if(cameraMap.get(mac).get("activated") == true){
                document.getElementById("activated-text").innerHTML = "Camera is currently activated"
                document.getElementById("activate-btn").innerHTML = "Desactivate";
                document.getElementById("activate-btn").onclick = function(){
                    desactivateCamera();
                }
            }else{
                document.getElementById("activated-text").innerHTML = "Camera is currently desactivated"
                document.getElementById("activate-btn").innerHTML = "Activate";
                document.getElementById("activate-btn").onclick = function(){
                    activateCamera();
                }
            }
        }else{
            document.getElementById("activate-btn").style.display = "none";
        }


    }

    for (var i=1; i < liste.childNodes.length; i++) {
        if(camera.id != liste.childNodes[i].id){
            liste.childNodes[i].classList.remove("selected");

            var mac = liste.childNodes[i].id.split("-")[1];
            var message = "cmd=unselectcamera&uid=" + mac;
            socket.send(message);
        }
    }

}

function selectTag(tag){
    var liste = document.getElementById("tags-grid");
    //Send the associated message if the current tag was selected
    if($(tag).hasClass('selected')){
        var mac = tag.id.split("-")[1];
        $(tag).removeClass("selected");
        var message = "cmd=unselecttag&uid=" + mac;
        //$("button").remove("#orientation-btn")
        socket.send(message);
    }
    else {
        $(tag).addClass("selected");
        var mac = tag.id.split("-")[1];
        var message = "cmd=selecttag&uid=" + mac;
        //var button = $('<button type="submit" class="btn btn-info" id="orientation-btn"></button>').text("Reoriente");
        //$(tag).append(button);
        socket.send(message);
    }
    //Update the other tags
    for (var i=1; i < liste.childNodes.length; i++) {
        if(tag.id != liste.childNodes[i].id && liste.childNodes[i].classList.contains('selected')){
            liste.childNodes[i].classList.remove("selected");
            var mac = liste.childNodes[i].id.split("-")[1];
            var message = "cmd=unselecttag&uid=" + mac;
            socket.send(message);
        }
    }

}

function addCamera(mac){
    if(mac != ""){
        var camera = document.getElementById("camera-" + mac);
        if(camera != undefined){
            updateCameraDisplay(mac);
            //+'<button type="submit" class="btn btn-info" id="activate-btn" onclick="activateCamera()">Activate</button>'
        }else{
            var liste = document.getElementById("cameras-grid");
            var newCamera = document.createElement('div');
            newCamera.setAttribute("class", "col-lg-3 col-md-4 col-sm-6 camera-window");
            newCamera.setAttribute("onclick", "selectcamera(this)");
            newCamera.setAttribute("id", "camera-" + mac);
            newCamera.innerHTML = '<svg class="glyph stroked app window with content"><use xlink:href="#stroked-camera"/></svg>'
            +'</br><p> mac: ' + mac + '</p>'
            +'<p> version: '  + cameraMap.get(mac).get("version") + '</p>'
            +'<p> calibrated: '  + cameraMap.get(mac).get("calibrated")
            +', activated: ' + cameraMap.get(mac).get("activated") + '</p>';
            if(cameraMap.get(mac).get("calibrated") == "true"){
                newCamera.innerHTML += '<p> Position: (X: '  + truncateDigit(cameraMap.get(mac).get("x"))+ ', Y: '
                + truncateDigit(cameraMap.get(mac).get("y")) + ', Z: ' + truncateDigit(cameraMap.get(mac).get("z")) + ')</p>';
            }

            liste.appendChild(newCamera);
        }
    }
}

function updateCameraDisplay(mac){
    var camera = document.getElementById("camera-" + mac);
    camera.innerHTML = '<svg class="glyph stroked app window with content"><use xlink:href="#stroked-camera"/></svg>'
    +'</br><p> mac: ' + mac + '</p>'
    +'<p> IP: '  + cameraMap.get(mac).get("ip") + '</p>'
    +'<p> version: '  + cameraMap.get(mac).get("version") + '</p>'
    +'<p> calibrated: '  + cameraMap.get(mac).get("calibrated")
    +', activated: ' + cameraMap.get(mac).get("activated") + '</p>';

    if(cameraMap.get(mac).get("calibrated") == "true"){
        camera.innerHTML +='<p> Position: (X: '  + truncateDigit(cameraMap.get(mac).get("x")) + ', Y: '
        + truncateDigit(cameraMap.get(mac).get("y")) + ', Z: ' + truncateDigit(cameraMap.get(mac).get("z")) + ')</p>';
    }
}

function removeCamera(mac){
    var camerasGrid = document.getElementById('cameras-grid');
    //$("#camera-" + mac).remove();
    var cameraToRemove = document.getElementById("camera-" + mac);
    if(camerasGrid != undefined && cameraToRemove != undefined){
        camerasGrid.remove(cameraToRemove);
        countElementGateway.set("cameras", countElementGateway.get("cameras") - 1);
        document.getElementById("camera-count").innerHTML = countElementGateway.get("cameras");
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
    for (var [key, value] of userMap.get(mac).get("tags")) {
        newUser.innerHTML += '<p>' + key + '</p>';
    }
}

function removeUser(mac){
    //$("#user-" + mac).remove();
    var usersGrid = document.getElementById("users-grid");
    var userToRemove = document.getElementById("user-" + mac);
    if(usersGrid != undefined && userToRemove != undefined){
        usersGrid.remove(userToRemove);
        countElementGateway.set("users", countElementGateway.get("users") - 1);
        document.getElementById("user-count").innerHTML = countElementGateway.get("users");
    }
}

function addTag(mac){
    var newTag = document.getElementById("tag-" + mac);
    var liste = document.getElementById("tags-grid");
    if(newTag == undefined){
        newTag = document.createElement('div');
        newTag.setAttribute("class", "col-lg-3 col-md-4 col-sm-6");
        newTag.setAttribute("id", "tag-" + mac);
        newTag.setAttribute("onclick", "selectTag(this)");
        liste.appendChild(newTag);

    }
    newTag.innerHTML = '<svg class="glyph stroked app window with content"><use xlink:href="#stroked-tag"/></svg>'
    +'</br><p> mac: ' + mac + '</p>'
    +'<p> battery: '  + tagMap.get(mac).get("battery") + '%</p>'
    +'<p> orientation: '  + tagMap.get(mac).get("orientation") + '</p>'
    +'<p> status: '  + tagMap.get(mac).get("status") + '</p>'
    +'<p> #users: '  + tagMap.get(mac).get("users") + '</p>'
    +'<p> version: '  + tagMap.get(mac).get("version") + '</p>'
    +'<button type="submit" class="btn btn-info orientation-btn" onclick="reorienteTag(\'' + mac + '\')">Reoriente</button>';
}

function removeTag(mac){
    //$("#tag-" + mac).remove();
    var tagsGrid = document.getElementById("tags-grid");
    var tagToRemove = document.getElementById("tag-" + mac);
    if(tagsGrid != undefined && tagToRemove != undefined){
        tagsGrid.remove(tagToRemove);
        countElementGateway.set("tags", countElementGateway.get("tags") - 1);
        document.getElementById("tag-count").innerHTML = countElementGateway.get("tags");
    }
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
    //console.log(message);
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
                            cameraMap.get(currentMac).set("sensitivity", 60);
                            cameraMap.get(currentMac).set("minblobsize", 0);
                            cameraMap.get(currentMac).set("maxblobsize", 400);
                            cameraMap.get(currentMac).set("gain", 0);
                            cameraMap.get(currentMac).set("exposure", 400);
                            cameraMap.get(currentMac).set("version", "");
                            cameraMap.get(currentMac).set("calibrated", "false");
                            cameraMap.get(currentMac).set("ip", "");
                            cameraMap.get(currentMac).set("x", "0");
                            cameraMap.get(currentMac).set("y", "0");
                            cameraMap.get(currentMac).set("z", "0");
                            cameraMap.get(currentMac).set("activated", false);
                            cameraMap.get(currentMac).set("trackedPoints", 0);
                        }
                        break;
                        case "version":
                        cameraMap.get(currentMac).set("version", information[1]);
                        break;
                        case "calibrated":
                        if(information[1] == "true"){
                            cameraMap.get(currentMac).set("calibrated", information[1], true);
                        }else{
                            cameraMap.get(currentMac).set("calibrated", information[1], false);
                        }
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
                        case "gain":
                        cameraMap.get(currentMac).set("gain", information[1]);
                        break;
                        case "exposure":
                        cameraMap.get(currentMac).set("exposure", information[1]);
                        break;
                        case "ip":
                        cameraMap.get(currentMac).set("ip", information[1]);
                        break;
                        case "x":
                        cameraMap.get(currentMac).set("x", information[1]);
                        break;
                        case "y":
                        cameraMap.get(currentMac).set("y", information[1]);
                        break;
                        case "z":
                        cameraMap.get(currentMac).set("z", information[1]);
                        break;
                        case "activated":
                            if(information[1] == "y"){
                                cameraMap.get(currentMac).set("activated", true);
                            }
                            else {
                                cameraMap.get(currentMac).set("activated", false);
                            }
                            break;
                        case "desactivated":
                        cameraMap.get(currentMac).set("activated", false);
                        case "trackedpoints":
                        cameraMap.get(currentMac).set("trackedPoints", information[1]);
                        break;
                        default:
                        console.log("error:", information);
                        break;
                    }
                    addCamera(currentMac);
                }
                /*for (var [key, value] of cameraMap) {
                    addCamera(key);
                }*/
            }
            break;
        }
        case "systeminfos":{
            try {
                //TO Modify
                if(contentMap.has("cameras")){
                    countElementGateway.set("cameras", contentMap.get("cameras"));
                    document.getElementById("camera-count").innerHTML = countElementGateway.get("cameras");
                }
                if(contentMap.has("tags")){
                    countElementGateway.set("tags", contentMap.get("tags"));
                    document.getElementById("tag-count").innerHTML = countElementGateway.get("tags");
                }
                if(contentMap.has("users")){
                    countElementGateway.set("users", contentMap.get("users"));
                    document.getElementById("user-count").innerHTML = countElementGateway.get("users");
                }
                if(contentMap.has("masters")){
                    countElementGateway.set("masters", contentMap.get("masters"));
                    document.getElementById("master-count").innerHTML = countElementGateway.get("masters");
                }
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
        case "snapshot":{
             if(messageContent.length > 0){
                var currentMac = "";
                for (var i = 1; i < messageContent.length; i++ ) {
                    information = messageContent[i].split("=");
                    switch (information[0]){
                        case "uid":
                        currentMac = information[1];
                        break;
                        case "data":
                            var c=document.getElementById("camera-canvas");
                            var ctx=c.getContext("2d");

                            var imgData=ctx.createImageData(640,480);

                            var lookup = []
                            var revLookup = []
                            var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
                            for (var i = 0, len = code.length; i < len; ++i) {
                              lookup[i] = code[i]
                              revLookup[code.charCodeAt(i)] = i
                            }
                            var index = 0;
                            for (var i=0;i<480;i++)
                              {
                              for (var j=0;j<640;j++)
                                  {
                                  imgData.data[(479-i)*4*640+4*(639-j)+0]=revLookup[information[1].charCodeAt(index)]<<4 +revLookup[information[1].charCodeAt(index+1)];
                                  imgData.data[(479-i)*4*640+4*(639-j)+1]=revLookup[information[1].charCodeAt(index)]<<4 +revLookup[information[1].charCodeAt(index+1)];
                                  imgData.data[(479-i)*4*640+4*(639-j)+2]=revLookup[information[1].charCodeAt(index)]<<4 +revLookup[information[1].charCodeAt(index+1)];
                                  imgData.data[(479-i)*4*640+4*(639-j)+3]=255;
                                  index+=2;
                                  }
                              }
                            ctx.putImageData(imgData,0,0);

                        break;
                        default:
                        console.log("error:", information);
                        break;
                    }

                }
            }else{
                console.log("Unrecognized message");
            }
            break;
        }
        case "info":{
            if(contentMap.has("msg")){

            }
            break;
        }
        case "tagsinfo":{
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
                        case "orientation":
                        tagMap.get(currentMac).set("orientation", information[1]);
                        break;
                        case "users":
                        tagMap.get(currentMac).set("users", information[1]);
                        break;
                        default:
                        console.log("error:", information);
                        break;
                    }
                }
                //Add tag display
                for (var [key, value] of tagMap) {
                    addTag(key);
                }
            }else{
                console.log("Unrecognized message");
            }
            break;
        }
        case "usersinfo":{
            if(messageContent.length > 0){
                var currentMac = "";
                for (var i = 1; i < messageContent.length; i++ ) {
                    information = messageContent[i].split("=");
                    switch (information[0]){
                        case "uid":
                        currentMac = information[1];
                        if(!userMap.has(currentMac)){
                            userMap.set(currentMac, new Map());
                            userMap.get(currentMac).set("tags", new Map());
                        }
                        break;
                        default:
                        userMap.get(currentMac).get("tags").set(information[1], true);
                        break;
                    }
                }
                //Update User display
                for (var [key, value] of userMap) {
                    addUser(key);
                }
            }
            break;
        }
        case "points":
        if(trackingPointActivated){
            var canvas = document.getElementById("camera-canvas");
            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var x,y;
            for (var i = 1; i < messageContent.length - 1; i++ ) {
                information = messageContent[i].split("=");
                x = parseFloat(information[1]);
                contentMap.set(information[0], information[1]);
                information = messageContent[++i].split("=");
                y = parseFloat(information[1]);
                contentMap.set(information[0], information[1]);
                ctx.beginPath();
                ctx.arc(x,480-y,2,0,2*Math.PI);
                ctx.stroke();
            }
        }

        break;
        case "camerasposition":{
            var datas = [];
            if((positionCount % 3) == 0){
                try{
                    var cmdContent = messageContent[0].split("=");
                    cmd = cmdContent[1];
                    for (var i = 1; i < messageContent.length; i++ ) {
                        information = messageContent[i].split("=");
                        if(information[0] == "uid"){
                            camerasPositionMap.uid = information[1];
                        }
                        else if(information[0] == "x"){
                            camerasPositionMap.x = information[1];
                        }
                        else if(information[0] == "y"){
                            camerasPositionMap.y = information[1];
                        }
                        else if(information[0] == "z"){
                            camerasPositionMap.z = information[1];
                            datas.splice(datas.length, 0, clone(camerasPositionMap));
                        }
                    }
                }catch (e) {
                    console.error("Parsing error:", e);
                }
            }else{
                positionCount++;
            }
            break;
        }
        case "userdeconnection":{
            if(contentMap.has("uid")){
                removeUser(contentMap.get("uid"));
            }
            break;
        }
        case "gatewayversion":{
            gatewayVersion = contentMap.get("uid");
            updateGatewayVersionDisplay(contentMap.get("uid"), gatewayLatestVersion);
            break;
        }
        case "camerasversion":{
            updateCameraVersionDisplay(contentMap, cameraLatestVersion);
            break;
        }
        case "tagsversion":{
            updateTagVersionDisplay(contentMap, tagLatestVersion);
            break;
        }
        case "userdeconnection":{
            var userMac = contentMap.get("uid");
            removeUser(userMac);
            break;
        }
        case "deletetag":{
            var tagMac = contentMap.get("uid");
            removeTag(tagMac);
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
    vrtracker.restartGateway();
}

function truncateDigit(digit){
    var index = digit.indexOf(".");
    if(index > -1){
        return digit.substr(0, index + 3);
    }else{
        return digit;
    }
}

function activateCamera(){
    var mac = getSelectedCameraMac();
    socket.send("cmd=activatecamera&uid=" + mac);

    document.getElementById("activated-text").innerHTML = "Camera is currently activated"
    document.getElementById("activate-btn").innerHTML = "Desactivate";
    document.getElementById("activate-btn").onclick = function(){
        desactivateCamera();
    }
    cameraMap.get(mac).set("activated", true);
    updateCameraDisplay(mac);
}

function desactivateCamera(){
    var mac = getSelectedCameraMac();
    socket.send("cmd=desactivatecamera&uid=" + mac);
    document.getElementById("activated-text").innerHTML = "Camera is currently desactivated"
    document.getElementById("activate-btn").innerHTML = "Activate";
    document.getElementById("activate-btn").onclick = function(){
        activateCamera();
    }
    cameraMap.get(mac).set("activated", false);
    updateCameraDisplay(mac);
}

function getGatewayLatestVersion(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            var split = xmlHttp.responseText.split(".");
            var version = split[1] + "." + split[2];
            gatewayLatestVersion = version;
        }else{
            gatewayLatestVersion = "error";
        }
    }
    xmlHttp.open("GET", "https://vrtracker.xyz/devicesupdate/checkupdate.php?device=gateway", true); // true for asynchronous
    xmlHttp.send("hello");
}

function afficherRequete(data){
    console.log("data", data);
}
function getCameraLatestVersion(){
    //https://vrtracker.xyz/devicesupdate/checkupdate.php?device=camera
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            var split = xmlHttp.responseText.split(".");
            var version = split[1] + "." + split[2];
            cameraLatestVersion = version;
        }
    }
    xmlHttp.open("GET", "https://vrtracker.xyz/devicesupdate/checkupdate.php?device=camera", true); // true for asynchronous
    xmlHttp.send(null);
    //xmlHttp.close();
}

function getTagLatestVersion(){
    //http://julesthuillier.com/vrtracker/arduino/checkupdate.php?device=tag
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            var split = xmlHttp.responseText.split(".");
            var version = 0 + "." + split[0].replace("tag","");
            tagLatestVersion = version;
        }else{
            tagLatestVersion = "error";
        }
    }
    xmlHttp.open("GET", "http://julesthuillier.com/vrtracker/arduino/checkupdate.php?device=tag", true); // true for asynchronous
    xmlHttp.send(null);
}

function updateGatewayVersionDisplay(version, newversion){
    var success = document.getElementById("gateway-software-state");//.style.display = "block";
    var fail = document.getElementById("gateway-software-state-fail");//.innerHTML = (messageCameraCalibrated);
    var retrieveProblem;
    if(version === newversion){
        success.style.display = "block";
        fail.style.display = "none";
        success.children[1].innerHTML = "Current version: " + gatewayVersion;
    }else{
        fail.style.display = "block";
        success.style.display = "none";
        var message = "";
        if (typeof newversion != 'undefined'){
            message = "Latest version: " + newversion;
            if (typeof version != 'undefined'){
                message += "</br>Current version: " + version;
                fail.children[1].innerHTML = message;
            }
            if(newversion == 'error'){
                hideUpdateVersionLink = false;
                message = retrieveVersionErrorMsg
                fail.children[0].innerHTML = message;
            }
        }else{
            hideUpdateVersionLink = false;
            message = retrieveVersionErrorMsg
            fail.children[1].innerHTML = message;
            displayCheckUpdate();
        }
        if(!hideSoftUpdate){
            displayCheckUpdate();
        }
    }
}

function updateCameraVersionDisplay(versions, newversion){
    var success = document.getElementById("camera-software-state");
    var fail = document.getElementById("camera-software-state-fail");
    var camerasToUpdate = [];
    var camerasVersion = [];
    var macList = [];
    if(cameraLatestVersion.search("search") != -1){
        success.style.display = "none";
        fail.style.display = "block";
        fail.children[0].innerHTML = "";
        hideUpdateVersionLink = false;
        message = retrieveVersionErrorMsg;
    }else{
        for (var [cmd, info] of versions) {
            if(cmd.includes("uid")){
                macList.push(info);
            }
            if(cmd.includes("version")){
                camerasVersion.push(info);
            }
        }

        for (var i = 0; i < camerasVersion.length; i++) {
            if(!(camerasVersion[i] === newversion)){
                camerasToUpdate.push(i);
            }
        }
        if(camerasToUpdate.length === 0){
            success.style.display = "block";
            fail.style.display = "none";
            success.children[1].innerHTML = "Current version: " + cameraLatestVersion;
        }else{
            success.style.display = "none";
            fail.style.display = "block";
            var message = "";
            message += "Current version: </br><ul>"
            for (var i = 0; i < camerasToUpdate.length; i++) {
                message += "<li> MAC: " + macList[i] + ", version:";
                message += camerasVersion[camerasToUpdate[i]] + "</li>";
            }
            message += "</ul>"
            if((typeof cameraLatestVersion != 'undefined') && cameraLatestVersion != "error"){
                message += "Latest version: " + cameraLatestVersion;
            }else{
                hideUpdateVersionLink = false;
                fail.children[0].innerHTML = "";
                message += retrieveVersionErrorMsg;
            }
        }
    }
    fail.children[1].innerHTML = message;
    if(!hideSoftUpdate){
        displayCheckUpdate();
    }

}

function updateTagVersionDisplay(versions, newversion){
    var success = document.getElementById("tag-software-state");
    var fail = document.getElementById("tag-software-state-fail");
    var tagsToUpdate = [];
    var tagsVersion = [];
    var macList = [];
    if(newversion.search("search") != -1){
        success.style.display = "none";
        fail.style.display = "block";
        fail.children[0].innerHTML = "";
        hideUpdateVersionLink = false;
        message = retrieveVersionErrorMsg;
    }else{
        for (var [cmd, info] of versions) {
            if(cmd.includes("uid")){
                macList.push(info);
            }
            if(cmd.includes("version")){
                tagsVersion.push(info);
            }
        }

        for (var i = 0; i < tagsVersion.length; i++) {
            if(!(tagsVersion[i] === newversion)){
                tagsToUpdate.push(i);
            }
        }
        if(tagsToUpdate.length === 0){
            success.style.display = "block";
            fail.style.display = "none";
            success.children[1].innerHTML = "Current version: " + tagLatestVersion;
            hideUpdateVersionLink = false;
        }else{
            success.style.display = "none";
            fail.style.display = "block";
            var message = "";
            message += "Current version: </br><ul>"
            for (var i = 0; i < tagsToUpdate.length; i++) {
                message += "<li> MAC: " + macList[i] + ", version:" +
                + tagsVersion[tagsToUpdate[i]] + "</li>";
            }
            message += "</ul>"
            if(typeof tagLatestVersion != 'undefined' && tagLatestVersion != "error"){
                message += "Latest version: " + tagLatestVersion;
            }else {
                hideUpdateVersionLink = false;
                fail.children[0].innerHTML = "";
                message += retrieveVersionErrorMsg;
            }
        }
    }
    fail.children[1].innerHTML = message;
    if(!hideSoftUpdate){
        displayCheckUpdate();
    }
}

function getLatestVersion(){
    getGatewayLatestVersion();
    getCameraLatestVersion();
    getTagLatestVersion();
}

function reorienteTag(mac){
    var message = "cmd=reoriente&uid=" + mac;
    vrtracker.sendMessage(message);
}

function displayCheckUpdate(){
    var softUpdate = document.getElementById("software-update-button");
    softUpdate.style.display = "none";
}

function hideSoftUpdate(){
    var softUpdate = document.getElementById("software-update-button");
    softUpdate.style.display = "block";
}

function updateTagsDisplay(tagMac){

}

function updateUsersDisplay(userMac){

}
