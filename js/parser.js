var countTablePointCamera = new Map();
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
    switch (cmd) {
        case "xyzcalibrated":{
            var x, y, z, coordinate;
            x = contentMap.get("x");
            y = contentMap.get("y");
            z = contentMap.get("z");
            contentMap.delete("x");
            contentMap.delete("y");
            contentMap.delete("z");
            var message = "Calibration point detected by " + contentMap.size + " camera(s) ";
            coordinate = changeNumberFormat(x) + "&" + changeNumberFormat(y) + "&" + changeNumberFormat(z);
            message += coordinate + " : ";
            for (var [key, value] of contentMap){
                if(countTablePointCamera.has(value)){
                    countTablePointCamera.set(value, countTablePointCamera.get(value)+1);
                }else{
                    countTablePointCamera.set(value, 1);
                }
                message += value + "; ";
                //On ajoute la camera auquelle ce point de calibration est associe
                if(pointToCameraMap.has(coordinate)){
                    pointToCameraMap.get(coordinate).push(value);
                }
            }
            hideCalibrationMessages();
            document.getElementById("calibration-success").innerHTML = message;
            document.getElementById("calibration-success").style.display = "block";
            calibrationDetected++;
            nextCalibrationIndex++;
            showNextCalibrationPoint();
            enablePingAgain = false;
            if(nextCalibrationIndex < calibrationPoint.length )
                updatePointCount(coordinate);
            break;
        }
        case "camerasinformation":{
            var liste = document.getElementById('available-cameras');
            //On supprime le message
            var ligne = liste.getElementsByTagName("tr");
            var longueur = ligne.length;
            var noCameraMessage = document.getElementById("noCameraConnectedMessage");
            noCameraMessage.style.display = "none";

            if(contentMap.size > 0){
                for (var [key, value] of contentMap) {
                    if(macToNumberMap.has(value)){
                    }else{
                        //Ajout des cameras disponibles
                        if(key.includes("camera"))
                            addTableAvailableCamera(value);
                    }
                }
            }else{
                noCameraMessage.style.display = "table-cell";
            }
            for(var i = 2; i < longueur; i++){
                    var macAdress = liste.childNodes[2].getElementsByTagName("th");
            }
            break;
        }
        case "cameracalibration":{
            //Cas de xyzcalibrated
            var x,y,z;
            x = contentMap.get("x");
            y = contentMap.get("y");
            z = contentMap.get("z");
            contentMap.delete("x");
            contentMap.delete("y");
            contentMap.delete("z");
            break;
        }
        case "calibrationfailed":{
            break;
        }
        case "position":{
            var map = {};
            var datas = [];
            if((positionCount % 3) == 0){
                try{
                    var cmdContent = messageContent[0].split("=");
                    cmd = cmdContent[1];
                    pointData = {};
                    for (var i = 1; i < messageContent.length; i++ ) {
                        information = messageContent[i].split("=");
                        if(information[0] == "uid"){
                            map.uid = information[1];
                        }
                        else if(information[0] == "x"){
                            map.x = information[1];
                        }
                        else if(information[0] == "y"){
                            map.y = information[1];
                        }
                        else if(information[0] == "z"){
                            map.z = information[1];
                            datas.splice(datas.length, 0, clone(map));
                        }
                    }
                    updateTagPosition(datas);
                }catch (e) {
                    console.error("Parsing error:", e);
                }
            }else{
                positionCount++;
            }
            break;
        }
        case "camerasposition":{
            var camerasPositionMap = {};
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
        case "calibrationfailed":{
            var errorMessage;
            if(contentMap.size != 0){
                if(contentMap.size == 1){
                    errorMessage = "The camera " + contentMap[0] + " has not been calibrated";
                }else{
                    errorMessage = "The "+ contentMap.size +" cameras ";
                    for (var [key, value] of contentMap) {
                        errorMessage = value + ", ";
                    }
                    errorMessage = " have not been calibrated !";
                }
                alert(errorMessage);
            }
            break;
        }
        case "calibrationtagconnected":{
            tagConnected = true;
            break;
        }
        case "error":{
            if(contentMap.has("msg")){
                switch (contentMap.get("msg")) {
                    case "tagdisconnected":{

                        break;
                    }
                    case "notagconnected":{
                        tagConnected = false;
                        break;
                    }
                    case "pointnotdetected":{
                        if(calibrationViewActivated){
                            hideCalibrationMessages();
                            document.getElementById("calibration-failed").innerHTML = "Calibration Point not detected ! Send again a Ping !";
                            document.getElementById("calibration-failed").style.display = "block";
                        }
                        enablePingAgain = false;
                        break;
                    }
                    case "nocalibrationpoint":{

                        break;
                    }
                    case "calibrationtagdisconnected":{
                        tagConnected = false;
                        alert("Calibration tag has been disconnected")
                        break;
                    }
                    case "notenoughtag":{
                        alert("You need at least two tags for auto-calibration");
                        document.getElementById("auto-calibration-btn").style.display = "block";
                        document.getElementById("stop-auto-calibration-btn").style.display = "none";
                    }
                    default:
                    break;
                }
            }
            break;
        }
        case "info":{
            if(contentMap.has("msg")){
                if(contentMap.get("msg") == "assignmentsuccess"){
                    sendMessage(socket, "cmd=orientation&orientation=false&uid=" + contentMap.get("uid0"));
                }else if (contentMap.get("msg") == "ping") {
                    updateCalibration(true);
                }
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
        case "calibratedcamera":{
            var camerasPositionMap = {};
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
            var numberCalibrated = 0;
            var numberNotCalibrated = 0;
            var messageCameraCalibrated = "";
            for (var i = 0; i < datas.length; i++) {
                messageCameraCalibrated += "<li>camera" + " (" + datas[i].uid + "), position : ";
                numberCalibrated++;
                messageCameraCalibrated += "("+ datas[i].x + ",  ";
                messageCameraCalibrated +=  datas[i].y + ", ";
                messageCameraCalibrated +=  datas[i].z + ") </li> ";
            }
            document.getElementById("CC").innerHTML = (messageCameraCalibrated);
            if(numberCalibrated>0)
                document.getElementById("calibrated-camera").style.display = "block";
            break;
        }
        default:
            break;
    }
}

function clone(obj) {
   if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
   return copy;
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
