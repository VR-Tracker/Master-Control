
var websocketIP = "vrtracker.local";
var askCamerasInformation = "cmd=camerasinformation"

var wsFailedAlert = document.getElementById('ws_failed_alert');
var wsSuccessAlert = document.getElementById('ws_success_alert');
var calibrating = false;
var socket;
var calibrationBtn = document.getElementById('calibrationBtn');
var count = 0;
var nombreCamera = 0;
var countTable = [0];
var selectedTable = [false];
var cameraMac = [];
var addedElementMap = new Map();// Map contenant les differentes cameras et sachant laquelle est selectionne
var macNumberMap = new Map();// Map de correspondance entre numero et mac
var macToNumberMap = new Map();
var selectedCameraCoordinateMap = new Map(); //
var pointAssociatedCamera = new Map();
var cameraNumberPoints = new Map();
var pointToCameraMap = new Map(); // map ayant pour cle les coordonnees du points et comme valeurs, un tableau
var calibrationPoint = []; //Store the different calibration point
var ChooseCameraInfos = "<p>Either choose every cameras for a full calibration or only a few of them if you need to re-calibrate.</br>To help you identify the cameras, you can see them slightly flash green when you select it in the list.</p>";
var PointInfo = "<p>Now add a set of Real World Coordinates. At least 4 points must be seen by each camera. It's recommended to use meters as the default unit of measure during the calibration. You can add as many 3D positions as you want, the more add the better accuracy you will get.</br>Once you are ready, hit <strong>Space</strong> and follow the instructions.</p>";
var CalibrationInfo = "<p>After adding all the different coordinate for the calibration, you have to possibility to do the calibration :"+
"<p></p><ul><li>Press </li></ul></p>";
var StopCalibrationInfoSucces = "<p>After adding all the different coordinate for the calibration, you have to possibility to do the calibration :"+
"<p></p><ul><li>Press </li></ul></p>";
var StopCalibrationInfoFailed = "<p>After adding all the different coordinate for the calibration, you have to possibility to do the calibration :"+
"<p></p><ul><li>Press </li></ul></p>";

/*
* On window load, open a websocket between the window and the server
* Create a master on window opening
*/
window.onload=function(){
    createWebsocket();
    // Send a message when the button start calibration is clicked.
    calibrationBtn.onclick = function(e) {
        e.preventDefault();
        var send = false;
        var message;
        if(!calibrating){
            console.log("sending message calibration");
            message = "cmd=startcalibration";
            calibrating = true;
        }
        console.log(document.getElementById("info-text"));

        document.getElementById("info-text").innerHTML = PointInfo;

        var numeroCamera = 0; // variable pour distinguer les cameras
        for (var [mac, isSelected] of addedElementMap) {
            //Creation du message
            if(isSelected){
                message += "&camera" + numeroCamera + "=" +mac;
                send = true;
                selectedCameraCoordinateMap.set(mac,false);
                pointAssociatedCamera.set(mac, []);
                numeroCamera++;
            }
        }
        console.log(message);
        if(send){
            //If message is sent, we change the button
            calibrationBtn.className = "btn btn-danger btn-md";
            calibrationBtn.innerHTML = "Calibrating...";
            calibrationBtn.disabled = true;
            //And we disable the reset button, enable the possibility to add a point
            document.getElementById("stop-calibration-btn").style.display = "table-cell";
            document.getElementById("add-coordinate").disabled = false;
            sendMessage(socket, message);
            displayCount();
        }
        else {
            calibrating = false;
            console.log("aucune camera selectionne");
        }
    }
}


window.onclose=function(){
    socket.close();
    console.log("connection closed");
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

function getCamerasInformation(){
    if(!calibrating)
        socket.send(askCamerasInformation);
}

function createWebsocket(){
    socket = new WebSocket('ws://' + websocketIP + ':7777/master/');
    socket.onopen = function(event) {
        wsFailedAlert.style.display = "none";
        wsSuccessAlert.style.display = "block";
        console.log("connection master...");
        document.getElementById("info-text").innerHTML = ChooseCameraInfos;
        document.getElementById("calibrationBtn").disabled = false;

        //Envoi du message pour recuperer les informations sur les cameras
        socket.send(askCamerasInformation);
        setInterval(getCamerasInformation, 5000);
        //Envoi du message apres un certain temps
    };
    // Handle any errors that occur.
    socket.onerror = function(error) {
        wsFailedAlert.style.display = "block";
        wsSuccessAlert.style.display = "none";
        console.log('WebSocket Error: ' + error);
        document.getElementById("calibrationBtn").disabled = true;
    }
    // Handle messages sent by the server.
    socket.onmessage = function(event) {
        //getting the time of the message
        var message = event.data;
        parseMessage(message);
        //console.log(event.data);
    }
}

/*
* Add the camera according to the mac address in the avaible camera table
* Create all the associate input in the different table and map
*/
function addTableAvailableCamera(mac){

 /*   var nocameraconnected = document.getElementById("noCameraConnectedMessage");
    return nocameraconnected.parentNode.removeChild(nocameraconnected);
   */
    nombreCamera++;
    //Get the html element
    var liste = document.getElementById("available-cameras");
    var newElement = document.createElement('tr');
    //Create the corresponding html element
    newElement.setAttribute("id", "camera-" + nombreCamera);
    newElement.innerHTML = '<th data-field="camera"> camera-' + nombreCamera + '</th>'
    + '<th data-field="mac">' + mac + '</th>'
    + '<th data-field="count" class="count" style="text-align:center">0</th>';
    liste.appendChild(newElement);
    //Create the different input in the tables and maps
    countTable.push(0);
    selectedTable.push(false);
    addedElementMap.set(mac, false);
    macNumberMap.set(nombreCamera, mac);
    macToNumberMap.set(mac, nombreCamera);
    var temp = nombreCamera;
    //Connect the color change on click
    newElement.onclick = function() {changeColor(newElement.id, temp)};

}

/*
* Change color when click on a certain row of the table
* Create a master on opening window
*/
function changeColor(id, numeroCamera){
    if(!calibrating){
        countTable[numeroCamera] = (countTable[numeroCamera] + 1) % 2;
        var ligne = document.getElementById(id);
        if(countTable[numeroCamera] == 1){
            ligne.style.backgroundColor = "#f3de67";
            //Update the corresponding tables/maps
            selectedTable[numeroCamera] = true;
            addedElementMap.set(macNumberMap.get(numeroCamera), true);
            //Envoie du message pour dire a la camera d'allumer sa led
            var message = "cmd=selectcamera&uid=" + macNumberMap.get(numeroCamera);
            sendMessage(socket, message);
        }
        else{
            ligne.style.backgroundColor = "#ffffff";
            selectedTable[numeroCamera] = false;
            addedElementMap.set(macNumberMap.get(numeroCamera), false);
            var message = "cmd=unselectcamera&uid=" + macNumberMap.get(numeroCamera);
            sendMessage(socket, message);
        }
    }
}

/*
* reset the color of the different row in the table
*/
function resetColor(table){
    console.log("mise a zero des choix");
    var liste = document.getElementById(table);
    var element = liste.getElementsByTagName("tr");
    var longueur = element.length;
    var mac;
    for(var i = 1; i < element.length; i++){
        if(countTable[i] == 1){
            //On enleve le premier element (le header ne comptant pas)
            element[i].style.backgroundColor = "#ffffff";
            addedElementMap.set(macNumberMap.get(i), false);
            countTable[i] = 0;
        }
    }
}

function selectCamera(){
    var camera, mac;
    table = document.getElementById("available-cameras");
    tr = table.getElementsByTagName("tr");
    for (var i = 1; i < tr.length; i++) {
        if(selectedTable[i] && !addedElementMap.get(macNumberMap.get(i))){
            camera = tr[i].getElementsByTagName("th")[0].innerHTML;
            mac = tr[i].getElementsByTagName("th")[1].innerHTML;
            addTableSelectedCamera(camera, mac);
        }
    }
}

// update the corresponding map for selected camera
function addTableSelectedCamera(camera, mac){
    addedElementMap.set(mac, true);
}

function addNewPointCalibration(){
    console.log("sending message calibration");
    var send = false;
    var x = document.getElementById("x-coordinate").value;
    var y = document.getElementById("y-coordinate").value;
    var z = document.getElementById("z-coordinate").value;
    //Replace comma with dot
    x = x.replace(/,/,".");
    y = y.replace(/,/,".");
    z = z.replace(/,/,".");
    var xValue = isNumeric(x);
    var yValue = isNumeric(y);
    var zValue = isNumeric(z);
    if(xValue && yValue && zValue){
        x = changeNumberFormat(x);
        y = changeNumberFormat(y);
        z = changeNumberFormat(z);
        var message = "cmd=xyzcalibration";
        message += "&x=" + x;
        message += "&y=" + y;
        message += "&z=" + z;
        var numeroCamera = 0;
        for (var [key, value] of addedElementMap) {
            if(value){
                message += "&camera" + numeroCamera + "=" + key;
                send = true;
                numeroCamera++;
                var tab = [x, y, z];
                //ajout des points
                pointAssociatedCamera.get(key).push(tab);
            }
        }
        if(send){
            sendMessage(socket, message);
            addPoint3DTable(x, y, z);
            calibrationPoint.push([x, y, z]);
        }
        else {
            console.log("aucune camera selectionne pour envoi point");
        }
    }else{
        var errorMessage = "Point not valid : coordinate ";
        var number = 0;
        if(!xValue){
            errorMessage += "x";
            number++;
        }
        if(number > 0 && !yValue){
            errorMessage += ", y";
            number++;
            if(!zValue){
                errorMessage += ", z";
                number++;
            }
        }else{
            if(!yValue){
                errorMessage += "y";
                number++;
                if(!zValue){
                    errorMessage += ", z";
                    number++;
                }
            }else{
                if(!zValue){
                    errorMessage += "z";
                    number++;
                }
            }
        }
        if(number == 1){
            errorMessage += " is not valid";
        }else{
            errorMessage += " are not valid";
        }
        alert(errorMessage);
    }
}

function startCalibration(){
    console.log("sending message calibration");
    var send = false;
    //Create the corresponding message
    var message = "cmd=startcalibration";
    var numeroCamera = 0;
    for (var [key, value] of addedElementMap) {
        if(value){
            message += "&camera" + numeroCamera + "=" +key;
            send = true;
        }
    }
    if(send){
        //If there any selected camera we send the message
        sendMessage(socket, message);
        document.getElementById("stop-calibration-btn").style.display = "table-cell";
        document.getElementById("x-coordinate").disabled = false;
        document.getElementById("y-coordinate").disabled = false;
        document.getElementById("z-coordinate").disabled = false;
        calibrationBtn.disabled = true;
    }
    else {
        console.log("aucune camera selectionne");
        alert("aucune camera selectionne");
    }
    CALIBRATING = true;
}

function stopCalibration(){
    //TODO a verifier si on remet tout a zero ou non
    resetColor('available-cameras');
    var message = "cmd=stopcalibration";
    calibrationBtn.className = "btn btn-primary";
    calibrationBtn.innerHTML = "Start Calibration";
    calibrating = false;
    //Creation du message
    var numeroCamera = 0;
    for (var [key, value] of addedElementMap) {
        if(value){
            message += "&camera" + numeroCamera + "=" +key;
            send = true;
            selectedCameraCoordinateMap.set(key,false);
        }
    }
    //clear array
    calibrationPoint = [];
    nextCalibrationIndex = 0;
    nombreCamera = 0;
    calibrationDetected = 0;
    //Restart the state of start calibration button
    calibrationBtn.className = "btn btn-primary btn-md";
    calibrationBtn.innerHTML = "Start Calibration";
    calibrationBtn.disabled = true;
    document.getElementById("stop-calibration-btn").style.display = "none";
    document.getElementById("add-coordinate").disabled = true;

    sendMessage(socket, message);

    resetTablePoint3D();
    var liste = document.getElementById('available-cameras');
    var ligne = liste.getElementsByTagName("tr");
    var longueur = ligne.length;
    for (var i = 0; i < longueur - 2; i++) {
        ligne[2].parentNode.removeChild(ligne[2]);
    }
    hideCount();
    CALIBRATING = false;
}

function addPoint3DTable(x, y, z){
    //create the row in the point 3D table for associated x, y, z
    var id = x + "-" + y + "-" + z;
    if(!pointToCameraMap.has(id)){
        var liste = document.getElementById("points-camera");
        var newPoint = document.createElement('tr');
        newPoint.setAttribute("id", id);
        newPoint.innerHTML = '<th>(x=' + x + ", y=" + y + ", z=" + z + ')</th>'
        + '<th style="text-align:center;" id="associated-' + x + '-'
        + y + '-' + z + '">(0)</th><th><div>'
        + '<svg class="glyph stroked cancel" style="width:30%;height=auto%; '
        + 'align:center; display:table-cell;" id="point-'+x+'-'+y+'-'+z+'" '
        + 'onclick="deletePoint(\''+x+'-'+y+'-'+z+'\')"><use xlink:href="'
        + '#stroked-cancel"/></svg></div></th>';
        pointToCameraMap.set(id, [])
        liste.appendChild(newPoint);
    }else{
        alert("Point already added !");
    }
}

function resetTablePoint3D(){
    var liste = document.getElementById("points-camera");
    var element = liste.getElementsByTagName("tr");
    var longueur = element.length;
    for(var i = 1; i < longueur; i++){
        //On enleve le premier element (le header ne comptant pas)
        element[1].parentNode.removeChild(element[1]);
    }
    pointToCameraMap.clear();
    countTablePointCamera.clear();
    macNumberMap.clear();
    macToNumberMap.clear();

}

function updatePointCount(id){
    var countView = document.getElementsByClassName("count");
    console.log("updating countable",countView);
    for (var i = 1; i < countView.length; i++) {
        countView[i].innerHTML = countTablePointCamera.get(macNumberMap.get(i));
    }
    var point = document.getElementById("associated-" + id);
    console.log(pointToCameraMap);
    var description = "(" + pointToCameraMap.get(id).length + ")";
    /*for (var i = 0; i < pointToCameraMap.get(id).length; i++) {
        description += pointToCameraMap.get(id)[i];
        if(i < pointToCameraMap.get(id).size - 1)
        description += ", ";
    }*/
    point.innerHTML = description;
}

function displayCount(){
    //Show the number of point detected by a camera
    var countView = document.getElementsByClassName("count");
    console.log(countView);
    for (var i = 0; i < countView.length; i++) {
        countView[i].style.display = "table-cell";
    }
}

function hideCount(){
    //Hide the number of point detected by a camera
    var countView = document.getElementsByClassName("count");
    console.log(countView);
    for (var i = 0; i < countView.length; i++) {
        countView[i].style.display = "none";
    }
}

function deletePoint(id){
    //Delete the selected point in the point table
    console.log("On enleve le point:" + id);
    var point = document.getElementById(id);
    point.parentNode.removeChild(point);
    var tab = pointToCameraMap.get(id); // tableau contenant les points associes
    //Mise a jour de du nombre de points apres suppression
    if(typeof tab !== 'undefined'){
        for (var i = 0; i < tab.length; i++) {
            countTablePointCamera.set(tab[i],
                    countTablePointCamera.get(tab[i]) - 1);
        }
        var countView = document.getElementsByClassName("count");
        console.log("updating countable",countView);
        for (var i = 1; i < countView.length; i++) {
            countView[i].innerHTML = countTablePointCamera.get(macNumberMap.get(i));
        }
        var point = document.getElementById("associated-" + id);
        console.log(pointToCameraMap);
        var description = "(" + pointToCameraMap.get(id).length + ")";
        /*for (var i = 0; i < pointToCameraMap.get(id).length; i++) {
            description += pointToCameraMap.get(id)[i];
            if(i < pointToCameraMap.get(id).size - 1)
            description += ", ";
        }*/
        point.innerHTML = description;
        //On supprime la cle de la map
        pointToCameraMap.delete(id);
    }else{
        console.log("Point non associe");
    }
    var coordinates = id.split("-");
    var message = "cmd=deletecalibpoint";
    message += "&x=" + coordinates[0];
    message += "&y=" + coordinates[1];
    message += "&z=" + coordinates[2];
    //On envoie le point a supprimer

    console.log("avant", calibrationPoint);
    for (var i = 0; i < calibrationPoint.length; i++) {
        if(calibrationPoint[i][0] == coordinates[0] && calibrationPoint[i][1] == coordinates[1] && calibrationPoint[i][2] == coordinates[2]){
            calibrationPoint.splice(i, 1);
            if(i < calibrationDetected){
                calibrationCount--;
                calibrationDetected--;
            }
        }
    }
    console.log("Apres",calibrationPoint);
    sendMessage(socket, message);
}

function removeArrayPoint(array, indice){
    array[indice] = array.length - 1;
    array.pop();
}
