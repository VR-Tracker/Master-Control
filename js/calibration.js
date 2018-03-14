var websocketIP = "192.168.42.1";
var askCamerasInformation = "cmd=camerasinformation"

var wsFailedAlert = document.getElementById('ws_failed_alert');
var wsSuccessAlert = document.getElementById('ws_success_alert');
var calibrating = false;
var socket;
var calibrationBtn = document.getElementById('calibrationBtn');
var count = 0;
var nombreCamera = 0;
var countTable = [0];
var numberOfSelectedCamera = 0;
var selectedTable = [false];
var cameraMac = [];
var addedElementMap = new Map();// Map contenant les differentes cameras et sachant laquelle est selectionne
var macNumberMap = new Map();// Map de correspondance entre numero et mac
var macToNumberMap = new Map();
var selectedCameraCoordinateMap = new Map(); //
var pointAssociatedCamera = new Map();
var cameraNumberPoints = new Map();
var pointToCameraMap = new Map(); // map ayant pour cle les coordonnees du points et comme valeurs, un tableau
var validatedCalibration = new Map();
var calibrationPoint = []; //Store the different calibration point
var timeOutMessage = "";
var addingReferencePoints = false;
var autoCalibrationActivated = false; //Currently disactivated as it is not fully functional
/*
    Info panel information
*/
var ChooseCameraInfos = "<p>Either choose every cameras for a full calibration or only a few of them if you need to re-calibrate.</br>To help you identify the cameras, you can see them slightly flash green when you select it in the list.</p>";
var PointInfo = "<p>You are now in the calibration mode, you should be able to see the selected cameras with a blue light, and the calibration tag should have turned its light in purple."
+"</br></br>Add the different positions that you want to use for the calibration."
+" Each cameras have to see at least 4 points for the calibration.</br></br>"
+" The more calibration point you use the more precise the system will be.</p>";
var CalibrationInfo = "<p>After adding all the different points for the calibration, place the tag on the selected position. You have to two possibilities to do the calibration :"+
"<p></p><ul><li>Press the Space Bar. You will have the different instructions that will be displayed</li>"+
"<li>Click on the Calibrate button in the Calibration view.</li></ul>"+
"At each calibration point, you should see the tag flashing. The columns \"Associated point(s)\" and \"Cameras tracked\" will update at each detected calibration point."+
"</br>You should save the points entered in the <strong>multiple coordinates area</strong> in a text file if you need to recalibrate :)."
var StopCalibration = "<p>Now that the calibration is finished, you should be able to use the system. We have added a Visualizer window, so that you can see the tracking system in action."+
"</br>Just click on the Visualizer tab on the menu :).</p>";


/*
* On window load, open a websocket between the window and the server
* Create a master on window opening
*/
window.onload=function(){
    createWebsocket();
    // Send a message when the button start calibration is clicked.
    updateAutocalibrationDisplay();

    calibrationBtn.onclick = function(e) {
        e.preventDefault();
        var send = false;
        var message;
        if(!calibrating){
            message = "cmd=startcalibration";
            calibrating = true;
        }

        var numeroCamera = 0; // variable pour distinguer les cameras
        for (var [mac, isSelected] of addedElementMap) {
            //Creation du message
            if(isSelected){
                message += "&camera" + numeroCamera + "=" +mac;
                send = true;
                selectedCameraCoordinateMap.set(mac,false);
                pointAssociatedCamera.set(mac, []);
                validatedCalibration.set(mac,false);
                numeroCamera++;
            }
        }
        numberOfSelectedCamera = numeroCamera;
        if(send){
            console.log("Sent");
            CALIBRATING = true;
            //If message is sent, we change the button
            //   FADE IN the next Panel
            document.getElementById("add-3D-point-panel").style.opacity = 1;
            document.getElementById("add-3D-point-panel").style.display = "block";
            document.getElementById("add-3D-point-panel").className += " fadein";
            document.getElementById("add-3D-point-list").style.opacity = 1;
            document.getElementById("add-3D-point-list").style.display = "block";
            document.getElementById("add-3D-point-list").className += " fadein";
            document.getElementById("not-enough-3d").style.opacity = 1;
            document.getElementById("not-enough-3d").style.display = "block";
            document.getElementById("not-enough-3d").className += " fadein";
            document.getElementById("not-enough-3d").innerHTML = "At least 4 points must be entered, <u>and seen by each camera</u> !";

            document.getElementById("calibration-finished").style.opacity = 0;
            document.getElementById("calibration-finished").display = "none";

            document.getElementById('x-coordinate').removeAttribute("disabled");
            document.getElementById("y-coordinate").removeAttribute("disabled");
            document.getElementById("z-coordinate").removeAttribute("disabled");

            document.getElementById("info-text").innerHTML = PointInfo;

            document.getElementById("add-coordinate").removeAttribute("disabled");

            calibrationBtn.className = "btn btn-danger btn-md";
            calibrationBtn.innerHTML = "Calibrating...";
            calibrationBtn.disabled = true;

            //And we disable the reset button, enable the possibility to add a point
            document.getElementById("stop-calibration-btn").style.display = "inline";
            if(autoCalibrationActivated)
            {
                document.getElementById("auto-calibration-btn").style.display = "inline";
                document.getElementById("auto-calibration-btn").disabled = true;
            }
            sendMessage(socket, message);
            displayCount();
        }
        else {
            calibrating = false;
            alert("No camera selected");
        }
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

function getCamerasInformation(){
    if(!calibrating)
    socket.send(askCamerasInformation);
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
        socket.send("cmd=camerasposition");
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
    }
}

function askSystemInfo(){
    var message = "cmd=systemversions";
    sendMessage(socket, message);
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
    newElement.innerHTML = '<th style="width:20%; data-field="camera"> camera-' + nombreCamera + '</th>'
    + '<th style="width:25%; data-field="mac">' + mac + '</th>';
    if(camerasPositionMap.has(mac))
    {
        newElement.innerHTML += '<th style="width:40%; data-field="position">' + 'X: '  + truncateDigit(camerasPositionMap.get(mac).get("x"))+ ', Y: '
        + truncateDigit(camerasPositionMap.get(mac).get("y")) + ', Z: ' + truncateDigit(camerasPositionMap.get(mac).get("z")) + '</th>';
    }else{
        newElement.innerHTML += '<th style="width:40%; data-field="position"> Not Calibrated </th>';
    }
    newElement.innerHTML += '<th style="width:15%; data-field="count" class="count" style="text-align:center">0</th>';
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

function updateCameraDisplay(mac)
{
    var liste = document.getElementById('available-cameras');
    //On supprime le message
    var ligne = liste.getElementsByTagName("tr");
    var longueur = ligne.length;
    var noCameraMessage = document.getElementById("noCameraConnectedMessage");
    noCameraMessage.style.display = "none";

    if(macToNumberMap.has(mac)){
    }else{
        //Ajout des cameras disponibles
        addTableAvailableCamera(mac);

    }

    for(var i = 2; i < longueur; i++){
            var macAdress = liste.childNodes[2].getElementsByTagName("th");
    }

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
        var countCameraSelected = 0;
        for (cam in selectedTable){
            if(selectedTable[cam] == true){
                countCameraSelected++;
            }
        }
        if(countCameraSelected < 1){
            document.getElementById("calibrationBtn").disabled = true;
        }
        else {
            document.getElementById("calibrationBtn").disabled = false;
        }
    }
}

/*
* reset the color of the different row in the table
*/
function resetColor(table){
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

function enterCalibrationView(){
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}

function addNewPointCalibration(){
    var send = false;
    var x = document.getElementById("x-coordinate").value;
    var y = document.getElementById("y-coordinate").value;
    var z = document.getElementById("z-coordinate").value;
    //Replace comma with dot
    if(!isEmpty(x) && !isEmpty(y) && !isEmpty(z)){
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
            if(addPoint3DTable(x, y, z)){
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
                    calibrationPoint.push([x, y, z]);
                }else{
                    console.log("No camera selected for new calibration point");
                }

                // Enable button if at least 4 points are entered
                if(calibrationPoint.length >=4){
                    document.getElementById("not-enough-3d").style.display = "none";
                    document.getElementById("enough-3d").style.display = "block";
                    document.getElementById("enough-3d").innerHTML = "Enough points have been entered but remember, the more the better ;)";

                    document.getElementById("enterCalibViewBtn").style.opacity = 1;
                    document.getElementById("enterCalibViewBtn").style.display = "block";
                    document.getElementById("enterCalibViewBtn").className += " fadein";
                }else{
                    if(addingReferencePoints && calibrationPoint.length >=3){
                        document.getElementById("not-enough-3d").style.display = "none";
                        document.getElementById("enough-3d").style.display = "block";
                        document.getElementById("enough-3d").innerHTML = "Enough points have been entered ! :)";

                        document.getElementById("enterCalibViewBtn").style.opacity = 1;
                        document.getElementById("enterCalibViewBtn").style.display = "block";
                        document.getElementById("enterCalibViewBtn").className += " fadein";
                    }else{
                        document.getElementById("not-enough-3d").style.display = "block";
                        document.getElementById("enough-3d").style.display = "none";
                        document.getElementById("enterCalibViewBtn").style.opacity = 0;
                        document.getElementById("enterCalibViewBtn").style.display = "none";
                    }

                }
            }else{
                alert("Point already added !");
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
    }else{
        var points = document.getElementById("multiple-coordinates").value;
        points = removeBreaks();
        pointsTable = points.split(";");
        pointsTable.pop();
        for (var i = 0; i < pointsTable.length; i++) {
            point = pointsTable[i].split(",");
            if(point.length === 3){
                var xValue = isNumeric(point[0]);
                var yValue = isNumeric(point[1]);
                var zValue = isNumeric(point[2]);
                if(xValue && yValue && zValue){
                    point[0] = changeNumberFormat(point[0]);
                    point[1] = changeNumberFormat(point[1]);
                    point[2] = changeNumberFormat(point[2]);
                    //= addPoint3DTable();
                    if(addPoint3DTable(point[0],point[1],point[2])){
                        var message = "cmd=xyzcalibration";
                        message += "&x=" + point[0];
                        message += "&y=" + point[1];
                        message += "&z=" + point[2];
                        var numeroCamera = 0;
                        for (var [key, value] of addedElementMap) {
                            if(value){
                                message += "&camera" + numeroCamera + "=" + key;
                                send = true;
                                numeroCamera++;
                                var tab = [point[0],point[1],point[2]];
                                //ajout des points
                                pointAssociatedCamera.get(key).push(tab);
                            }
                        }
                        if(send){
                            setTimeout(sendMessage.bind(null, socket, message), 100*(i+1));
                            calibrationPoint.push([point[0],point[1],point[2]]);
                        }
                        else {
                            console.log("No camera selected for new calibration point");
                        }

                        // Enable button if at least 4 points are entered
                        if(calibrationPoint.length >=4){
                            document.getElementById("not-enough-3d").style.display = "none";
                            document.getElementById("enough-3d").style.display = "block";
                            document.getElementById("enough-3d").innerHTML = "Enough points have been entered but remember, the more the better ;)";

                            document.getElementById("enterCalibViewBtn").style.opacity = 1;
                            document.getElementById("enterCalibViewBtn").style.display = "block";
                            document.getElementById("enterCalibViewBtn").className += " fadein";
                        }else{
                            if(addingReferencePoints && calibrationPoint.length >=3){
                                document.getElementById("not-enough-3d").style.display = "none";
                                document.getElementById("enough-3d").style.display = "block";
                                document.getElementById("enough-3d").innerHTML = "Enough points have been entered ! :)";

                                document.getElementById("enterCalibViewBtn").style.opacity = 1;
                                document.getElementById("enterCalibViewBtn").style.display = "block";
                                document.getElementById("enterCalibViewBtn").className += " fadein";
                            }else{
                                document.getElementById("not-enough-3d").style.display = "block";
                                document.getElementById("enough-3d").style.display = "none";
                                document.getElementById("enterCalibViewBtn").style.opacity = 0;
                                document.getElementById("enterCalibViewBtn").style.display = "none";
                            }

                        }
                    }
                }
            }else{
                console.log("Input error !");
                alert("Coordinates not recognized ! Follow the template X,Y,Z;");
            }
        }
    }
    if(calibrationPoint.length > 3){
        document.getElementById("info-text").innerHTML = CalibrationInfo;
    }
}

function startCalibration(){
    //Fonction on utlise
    var send = false;
    var message;
    if(!calibrating){
        message = "cmd=startcalibration";
        calibrating = true;
    }
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
    numberOfSelectedCamera = numeroCamera;
    if(send){
        CALIBRATING = true;
        //If message is sent, we change the button
        //   FADE IN the next Panel
        document.getElementById("add-3D-point-panel").style.opacity = 1;
        document.getElementById("add-3D-point-panel").style.display = "block";
        document.getElementById("add-3D-point-panel").className += " fadein";
        document.getElementById("add-3D-point-list").style.opacity = 1;
        document.getElementById("add-3D-point-list").style.display = "block";
        document.getElementById("add-3D-point-list").className += " fadein";
        document.getElementById("not-enough-3d").style.opacity = 1;
        document.getElementById("not-enough-3d").style.display = "block";
        document.getElementById("not-enough-3d").className += " fadein";
        document.getElementById("not-enough-3d").innerHTML = "3 points must be entered, <u>and seen by each camera</u> !";

        document.getElementById("calibration-finished").style.opacity = 0;
        document.getElementById("calibration-finished").display += " none";

        document.getElementById('x-coordinate').removeAttribute("disabled");
        document.getElementById("y-coordinate").removeAttribute("disabled");
        document.getElementById("z-coordinate").removeAttribute("disabled");

        document.getElementById("info-text").innerHTML = PointInfo;

        document.getElementById("add-coordinate").removeAttribute("disabled");

        calibrationBtn.className = "btn btn-danger btn-md";
        calibrationBtn.innerHTML = "Calibrating...";
        calibrationBtn.disabled = true;

        //And we disable the reset button, enable the possibility to add a point
        document.getElementById("stop-calibration-btn").style.display = "inline";
        if(autoCalibrationActivated)
        {
            document.getElementById("auto-calibration-btn").style.display = "inline";
            document.getElementById("auto-calibration-btn").disabled = true;
        }
        sendMessage(socket, message);
        displayCount();
    }
    else {
        calibrating = false;
        alert("No camera selected");
    }
}

function stopCalibration(){
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
    calibrationCount = 0;
    //Restart the state of start calibration button
    calibrationBtn.className = "btn btn-primary btn-md";
    calibrationBtn.innerHTML = "Start Calibration";
    calibrationBtn.disabled = true;
    document.getElementById("stop-calibration-btn").style.display = "none";
    if(autoCalibrationActivated)
    {
        document.getElementById("auto-calibration-btn").style.display = "block";
    }
    document.getElementById("add-coordinate").disabled = true;

    sendMessage(socket, message);
    //showCalibratedCamera();
    resetTablePoint3D();
    var liste = document.getElementById('available-cameras');
    var ligne = liste.getElementsByTagName("tr");
    var longueur = ligne.length;
    for (var i = 0; i < longueur - 2; i++) {
        ligne[2].parentNode.removeChild(ligne[2]);
    }
    hideCount();
    CALIBRATING = false;

    calibrated = false;
    if(calibrated){
        document.getElementById("calibration-finished").style.opacity = 1;
        document.getElementById("calibration-finished").className += " fadein";

    }

    document.getElementById("calibrationBtn").innerHTML = "Validate Camera Selection";
    document.getElementById("add-3D-point-panel").style.opacity = 0;
    document.getElementById("add-3D-point-panel").style.display = "none";
    document.getElementById("add-3D-point-list").style.opacity = 0;
    document.getElementById("add-3D-point-list").style.display = "none";
    document.getElementById("not-enough-3d").style.opacity = 0;
    document.getElementById("not-enough-3d").style.display = "none";
    document.getElementById("enough-3d").style.display = "none";
    document.getElementById("enterCalibViewBtn").style.opacity = 0;
    document.getElementById("enterCalibViewBtn").style.display = "none";
    if(autoCalibrationActivated)
    {
        document.getElementById("auto-calibration-btn").disabled = false;
    }
    document.getElementById("add-reference-btn").style.display = "none";


}

function addPoint3DTable(x, y, z){
    //create the row in the point 3D table for associated x, y, z
    var id = x + "&" + y + "&" + z;
    if(!pointToCameraMap.has(id)){
        var liste = document.getElementById("points-camera");
        var newPoint = document.createElement('tr');
        newPoint.setAttribute("id", id);
        newPoint.innerHTML = '<th>(x=' + x + ", y=" + y + ", z=" + z + ')</th>'
        + '<th style="text-align:center;" id="associated-' + x + "&"
        + y + "&" + z + '">(0)</th><th><div>'
        + '<svg class="glyph stroked cancel" style="width:30%;height=auto%; '
        + 'align:center; display:table-cell;" id="point-'+x+'-'+y+'-'+z+'" '
        + 'onclick="deletePoint(\''+x+'&'+y+'&'+z+'\')"><use xlink:href="'
        + '#stroked-cancel"/></svg></div></th>';
        pointToCameraMap.set(id, [])
        liste.appendChild(newPoint);
        return true;
    }else{
        return false;
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
    for (var i = 1; i < countView.length; i++) {
        countView[i].innerHTML = countTablePointCamera.get(macNumberMap.get(i));
    }
    var point = document.getElementById("associated-" + id);
    var description = "(" + pointToCameraMap.get(id).length + ")";
    point.innerHTML = description;
}

function displayCount(){
    //Show the number of point detected by a camera
    var countView = document.getElementsByClassName("count");
    for (var i = 0; i < countView.length; i++) {
        countView[i].style.display = "table-cell";
    }
}

function hideCount(){
    //Hide the number of point detected by a camera
    var countView = document.getElementsByClassName("count");
    for (var i = 0; i < countView.length; i++) {
        countView[i].style.display = "none";
    }
}

function deletePoint(id){
    //Delete the selected point in the point table
    var tab = pointToCameraMap.get(id); // tableau contenant les points associes
    //Mise a jour de du nombre de points apres suppression
    if(typeof tab !== 'undefined'){
        for (var i = 0; i < tab.length; i++) {
            countTablePointCamera.set(tab[i], countTablePointCamera.get(tab[i]) - 1);
        }
        var countView = document.getElementsByClassName("count");
        for (var i = 1; i < countView.length; i++) {
            countView[i].innerHTML = countTablePointCamera.get(macNumberMap.get(i));
        }
        var point = document.getElementById("associated-" + id);

        var description = "(" + pointToCameraMap.get(id).length + ")";
        point.innerHTML = description;
        //On supprime la cle de la map
        pointToCameraMap.delete(id);
    }else{
        console.log("Point not associated");
    }
    var coordinates = id.split("&");
    var message = "cmd=deletecalibpoint";
    message += "&x=" + coordinates[0];
    message += "&y=" + coordinates[1];
    message += "&z=" + coordinates[2];
    //On envoie le point a supprimer
    for (var i = 0; i < calibrationPoint.length; i++) {
        if(calibrationPoint[i][0] == coordinates[0] && calibrationPoint[i][1] == coordinates[1] && calibrationPoint[i][2] == coordinates[2]){
            calibrationPoint.splice(i, 1);
            if(i < calibrationDetected){
                calibrationCount--;
                calibrationDetected--;
            }
        }
    }
    sendMessage(socket, message);
    var tab = [coordinates[0],coordinates[1],coordinates[2]];
    for (var [key, value] of pointAssociatedCamera) {
        removeArrayElement([coordinates[0],coordinates[1],coordinates[2]], pointAssociatedCamera.get(key));
    }
    var point = document.getElementById(id);
    point.parentNode.removeChild(point);
}

function removeArrayPoint(array, indice){
    array[indice] = array.length - 1;
    array.pop();
}

function removeArrayElement(element, array){
    for (var i = 0; i < array.length; i++) {
        if(array[i] === element){
            array[i] = array[array.length - 1];
            array.pop();
            break;
        }
    }
}

function showCalibratedCamera(){
    var numberCalibrated = 0;
    var numberNotCalibrated = 0;
    var messageCameraCalibrated = "";
    var messageCameraNotCalibrated = "";

    for (var [key, value] of countTablePointCamera) {
        if(value >= 4){
            messageCameraCalibrated += "<li>camera" + " (" + key + ")</li>";
            numberCalibrated++;
        }else{
            messageCameraNotCalibrated += "<li>camera" + " (" + key + ")</li>";
            numberNotCalibrated++;
        }
    }
    document.getElementById("CC").innerHTML = (messageCameraCalibrated);
    document.getElementById("NCC").innerHTML = (messageCameraNotCalibrated);
    if(numberCalibrated>0)
        document.getElementById("calibrated-camera").style.display = "block";
    if(numberNotCalibrated>0)
        document.getElementById("notCalibrated-camera").style.display = "block";

}

function calibrate(){
    handleKeySpace();
}

function sendMessageWithTimeOut(){
    socket.send(timeOutMessage);
}

function moveToNextPoint(){
    document.getElementById("next-point-btn").style.display = "inline-block";
    var calibrationPosition = calibrationPoint[calibrationCount];
    var point = calibrationPosition[0]+'&'+calibrationPosition[1]+'&'+calibrationPosition[2];
    //updateCalibration();
    deletePoint(point);
    showNextCalibrationPoint();
}

function removeBreaks(){

    var noBreaksText = document.getElementById("multiple-coordinates").value;

    noBreaksText = noBreaksText.replace(/(\r\n|\n|\r)/gm,"<1br />");

    re1 = /<1br \/><1br \/>/gi;
    re1a = /<1br \/><1br \/><1br \/>/gi;

    noBreaksText = noBreaksText.replace(re1a,"<1br /><2br />");
    noBreaksText = noBreaksText.replace(re1,"<2br />");

    re2 = /\<1br \/>/gi;
    noBreaksText = noBreaksText.replace(re2, "");

    re3 = /\s+/g;
    noBreaksText = noBreaksText.replace(re3,"");

    re4 = /<2br \/>/gi;
    noBreaksText = noBreaksText.replace(re4,"\n\n");
    return noBreaksText;
}

function autoCalibration(){
    var send = false;
    //Create the corresponding message
    var message = "cmd=startautocalibration";
    var numeroCamera = 0;
    CALIBRATING = true;
    calibrationBtn.disabled = true;
    for (var [key, value] of addedElementMap) {
        if(value){
            message += "&camera" + numeroCamera + "=" +key;
            send = true;
        }
        numeroCamera++;
    }
    console.log(message);
    if(send){
        //If there any selected camera we send the message
        sendMessage(socket, message);
        AddReferencePoints()

    }
    else {
        console.log("No camera selected");
        alert("No camera selected");
    }
    document.getElementById("calibrated-camera").style.display = "none";
    document.getElementById("notCalibrated-camera").style.display = "none";

}



function nextCalibration(){
    //Create the corresponding message
    var message = "cmd=autocalibnext";
    sendMessage(socket, message);
}

function stopAutoCalibration(){
    var send = false;
    //Create the corresponding message
    var message = "cmd=stopautocalibration";
    //If there any selected camera we send the message
    sendMessage(socket, message);
    document.getElementById("stop-calibration-btn").style.display = "inline";
    if(autoCalibrationActivated)
    {
        document.getElementById("auto-calibration-btn").style.display = "inline";
        document.getElementById("stop-auto-calibration-btn").style.display = "none";
    }
    document.getElementById("calibrated-camera").style.display = "none";
    document.getElementById("notCalibrated-camera").style.display = "none";
    document.getElementById("add-reference-btn").style.display = "block";


}

function AddReferencePoints(){
    var send = false;
    var message;
    if(!calibrating){
        calibrating = true;
    }

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
    numberOfSelectedCamera = numeroCamera;
    if(send){
        CALIBRATING = true;
        //If message is sent, we change the button
        //   FADE IN the next Panel
        document.getElementById("add-3D-point-panel").style.opacity = 1;
        document.getElementById("add-3D-point-panel").style.display = "block";
        document.getElementById("add-3D-point-panel").className += " fadein";
        document.getElementById("add-3D-point-list").style.opacity = 1;
        document.getElementById("add-3D-point-list").style.display = "block";
        document.getElementById("add-3D-point-list").className += " fadein";
        document.getElementById("not-enough-3d").style.opacity = 1;
        document.getElementById("not-enough-3d").style.display = "block";
        document.getElementById("not-enough-3d").className += " fadein";
        document.getElementById("not-enough-3d").innerHTML = "At least 4 points must be entered, <u>and seen by each camera</u> !";

        document.getElementById("calibration-finished").style.opacity = 0;
        document.getElementById("calibration-finished").display += " none";

        document.getElementById('x-coordinate').removeAttribute("disabled");
        document.getElementById("y-coordinate").removeAttribute("disabled");
        document.getElementById("z-coordinate").removeAttribute("disabled");

        document.getElementById("info-text").innerHTML = PointInfo;

        document.getElementById("add-coordinate").removeAttribute("disabled");

        calibrationBtn.className = "btn btn-danger btn-md";
        calibrationBtn.innerHTML = "Calibrating...";
        calibrationBtn.disabled = true;

        //And we disable the reset button, enable the possibility to add a point
        document.getElementById("stop-calibration-btn").style.display = "inline";
        if(autoCalibrationActivated)
        {
            document.getElementById("auto-calibration-btn").style.display = "inline";
            document.getElementById("auto-calibration-btn").disabled = true;
        }
        sendMessage(socket, message);
        displayCount();
    }
    else {
        calibrating = false;
        alert("No camera selected");
    }
    addingReferencePoints = true;
}

function toggle(button)
{
  if(document.getElementById("check-").value=="OFF"){
      console.log("de");
   document.getElementById("check-").value="ON";}

  else if(document.getElementById("check-").value=="ON"){
      console.log("asda");
   document.getElementById("check-").value="OFF";}
}


function addCamera(mac){
    if(mac != ""){
        var liste = document.getElementById("cameras-grid");
        var newCamera = document.createElement('div');
        newCamera.setAttribute("class", "col-lg-3 col-md-4 col-sm-6 camera-window");
        newCamera.setAttribute("onclick", "select(this)");
        newCamera.setAttribute("id", "camera-" + mac);
        newCamera.innerHTML = '<svg class="glyph stroked app window with content"><use xlink:href="#stroked-camera"/></svg>'
        +'</br><p> mac: ' + mac + '</p>';
        newCamera.innerHTML += '<p>Old Position: (X: '  + truncateDigit(camerasPositionMap.get(mac).get("x"))+ ', Y: '
        + truncateDigit(camerasPositionMap.get(mac).get("y")) + ', Z: ' + truncateDigit(camerasPositionMap.get(mac).get("z")) + ')</p>';
        newCamera.innerHTML += '<label class="switch">'

        newCamera.innerHTML += '<p>New Position: (X: '  + truncateDigit(camerasNewPosition.get(mac).get("x"))+ ', Y: '
        + truncateDigit(camerasNewPosition.get(mac).get("y")) + ', Z: ' + truncateDigit(camerasNewPosition.get(mac).get("z")) + ')</p>';
        newCamera.innerHTML += '<label class="switch">'

        +'<input id= "check-' + mac + '" type="checkbox" data-toggle="toggle" data-on="Validated" data-off="Discarded" data-onstyle="success" data-offstyle="danger" checked onchange="updateValidation(\'' + mac + '\')">'
        +'<span class="slider round"></span>';

        liste.appendChild(newCamera);
        validatedCalibration.set(mac, true);
        if(liste.childNodes.length == 2){
            var button = document.getElementById("validation-btns");
            button.style.display = "block";
        }
    }

}


function select(camera){
    var liste = document.getElementById("cameras-grid");
    var message;
    if($(camera).hasClass('selected')){
        var mac = camera.id.split("-")[1];
        $(camera).removeClass("selected");
        message = "cmd=unselectcamera&uid=" + mac;
    }
    else {
        $(camera).addClass("selected");
        $(document.getElementById("cameras-settings-ext")).show(800);
        var mac = camera.id.split("-")[1];
        message = "cmd=selectcamera&uid=" + mac;
    }
    socket.send(message);
    for (var i=1; i < liste.childNodes.length; i++) {
        if(camera.id != liste.childNodes[i].id){
            liste.childNodes[i].classList.remove("selected");
            var mac = liste.childNodes[i].id.split("-")[1];
            message = "cmd=unselectcamera&uid=" + mac;
            socket.send(message);
        }
    }

}

function truncateDigit(digit){
    var index = digit.indexOf(".");
    if(index > -1){
        return digit.substr(0, index + 3);
    }else{
        return digit;
    }
}

function updateValidation(mac)
{
    var selection = document.getElementById("check-" + mac);
    validatedCalibration.set(mac, selection.checked);
}

function validateCalibration(validated)
{
    var message = "cmd=validate"
    if(validated){
        var count = 0;
        for (var [mac, isSelected] of validatedCalibration) {
            if(isSelected){
                message += "&camera" + count + "=" + mac;
                count++;
            }
        }
    }
    console.log(message);
    socket.send(message);
}

function updateAutocalibrationDisplay()
{
    console.log("Updating auto cali view");

    var boutonAuto = document.getElementById("auto-calibration-btn");
    var boutonNext = document.getElementById("next-calibration-btn");

    if(autoCalibrationActivated){
        boutonAuto.style.display = "block";
        boutonNext.style.display = "block";
    }else{
        console.log("disable autocalibration button");
        boutonAuto.style.display = "none";
        boutonNext.style.display = "none";
    }
}

function displayCalibratedCameras()
{
    document.getElementById("after-calibration-display").style.display = "block";
}

function generateCoordinate()
{

}
