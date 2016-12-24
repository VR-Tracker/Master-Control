// Get references to elements on the page.
//Variable local
//var websocket-ip: "' + websocketIP + '";
var LOCAL_DEBUGGING = false;
var websocketIP;
if(LOCAL_DEBUGGING){
    websocketIP = "localhost";
}else{
    websocketIP = "vrtracker.local";
}


 var calibrationBtn = document.getElementById('calibrationBtn');
 var calibrating = false;
 var socket;

 var count = 0;
 var nombreCamera = 0;
 var countTable = [0];
 var selectedTable = [false];
 var cameraMac = [];
 var addedElementMap = new Map();//TODO changer avec une map l'utilisation des deux vecteurs
 var macNumberMap = new Map();
 var selectedCameraCoordinateMap = new Map();
 //TODO ameliorer les map en utilisant directemetn la mac comme id !
var pointAssociatedCamera = new Map();

 window.onload=function(){
      socket = new WebSocket('ws://' + websocketIP + ':7777/master/');
      socket.onopen = function(event) {
      //socketStatus.innerHTML = 'Connected to: ' + event.currentTarget.URL;
      //socketStatus.className = 'open';
      socket.send("Hey I'm a master");
      console.log("connection started...");
        };
        // Handle any errors that occur.
        socket.onerror = function(error) {
          console.log('WebSocket Error: ' + error);
        }
        // Handle messages sent by the server.
        socket.onmessage = function(event) {
          //getting the time of the message
          var message = event.data;
          console.log(event.data);
        }
        // Send a message when the form is submitted.
        calibrationBtn.onclick = function(e) {
          e.preventDefault();

          var send = false;
          var message;
          if(!calibrating){
              console.log("sending message calibration");
              message = "cmd=startcalibration";
              calibrationBtn.className = "btn btn-danger btn-md";
              calibrationBtn.innerHTML = "Stop Calibration";
              calibrating = true;
          }else{
              message = "cmd=stopcalibration";
              calibrationBtn.className = "btn btn-primary";
              calibrationBtn.innerHTML = "Start Calibration";
              calibrating = false;
              viderListe("selected-cameras");
              clearCoordinateTable();
          }
          var numeroCamera = 0;
          for (var [key, value] of addedElementMap) {
              if(value){
                  message += "&camera" + numeroCamera + "=" +key;
                  send = true;
                  addElementCoordinateTable(key);
                  selectedCameraCoordinateMap.set(key,false);
              }
          }
          console.log(message);
          if(send){
                envoyerMessage(socket, message);
          }
          else {
              console.log("aucune camera selectionne");
          }
          //getting the time of the message
          //d = new Date();
          //document.getElementById("date").innerHTML = d;

          // Retrieve the message from the textarea.
         // var message = messageField.value;
          // Send the message through the WebSocket.
          /*socket.send(message);
          // Add the message to the messages list.
          messagesList.innerHTML += '<li class="left clearfix"><span class="chat-img pull-left">'
               + '<img src="http://placehold.it/80/30a5ff/fff" alt="User Avatar" class="img-circle" /></span>'
          + '<div class="chat-body clearfix"><div class="header">'
          + '<strong class="primary-font">John Doe</strong> <small class="text-muted" >' + d.toString() + '</small></div><p>'
          + message
          + '</p></div></li>';*/
          // Clear out the message field.
         // messageField.value = '';
          }

}

function envoyerMessage(websocket, message){
    websocket.send(message);
}

window.onclose=function(){
  socket.close();
  console.log("connection closed");
}

addTableAvailableCamera("12:21:A1:E3");
function addTableAvailableCamera(mac){
    nombreCamera++;
    //var liste = document.getElementById("available-cameras");
    var liste = document.getElementById("available-cameras");
    var newElement = document.createElement('tr');
    newElement.setAttribute("id", "camera-" + nombreCamera);
    console.log(newElement.id);
    newElement.innerHTML = '<th data-field="camera"> camera-' + nombreCamera + '</th>'
                            + '<th data-field="mac">' + mac + '</th>';
    liste.appendChild(newElement);
    countTable.push(0);
    selectedTable.push(false);
    addedElementMap.set(mac, false);
    macNumberMap.set(nombreCamera, mac);
    console.log(addedElementMap);
    console.log(macNumberMap);
    console.log("camera numero : " + nombreCamera);
    //TODO faire attention au parametre passe
    var temp = nombreCamera;
    newElement.onclick = function() {changeColor(newElement.id, temp)};

}

addTableAvailableCamera("12:21:A1:E4");
//viderListe("available-cameras");


function viderListe(nomListe){
    console.log("mise a zero de la liste");
    var liste = document.getElementById(nomListe);
    var element = liste.getElementsByTagName("tr");
    var longueur = element.length;
    var mac;
    console.log(element);
    console.log("longueur", element.length);
    var tr = liste.getElementsByTagName("tr");
    for(var i = 1; i <= element.length; i++){
        console.log("on enleve un element ", i);
        //On enleve le premier element (le header ne comptant pas)
        mac = element[1].getElementsByTagName("th")[1].innerHTML;
        console.log(element[1]);
        element[1].parentNode.removeChild(element[1]);
        addedElementMap.set(mac, false);
    }
    //TODO remettre les elements a false
}

function changeColor(id, numeroCamera){
    console.log("changement de couleur pour camera-" + numeroCamera);
    countTable[numeroCamera] = (countTable[numeroCamera] + 1) % 2;
    console.log(document.getElementById(id));
    var ligne = document.getElementById(id); // forecolor
    if(countTable[numeroCamera] == 1){
        if(numeroCamera!=0){
        ligne.style.backgroundColor = "#f3de67";

        selectedTable[numeroCamera] = true;
        //addedElementMap[macNumberMap[numeroCamera]] = true;
        }
    }
    else {
        if(numeroCamera==0)
            ligne.style.backgroundColor = "#f1f1f1";
        else {
            ligne.style.backgroundColor = "#ffffff";
        }
        selectedTable[numeroCamera] = false;
        //addedElementMap[macNumberMap[numeroCamera]] = false;
    }
}

function selectCamera(){
    //console.log(macNumberMap[0] + " deja ajoute : " + addedElementMap[macNumberMap[i]]);
    console.log("map", addedElementMap);

    var camera, mac;
    table = document.getElementById("available-cameras");
    tr = table.getElementsByTagName("tr");
    for (var i = 1; i < tr.length; i++) {
        console.log("camera " + macNumberMap.get(i) + " " + addedElementMap.get(macNumberMap.get(i)));
        if(selectedTable[i] && !addedElementMap.get(macNumberMap.get(i))){
            //console.log(tr[i]);
            camera = tr[i].getElementsByTagName("th")[0].innerHTML;
            mac = tr[i].getElementsByTagName("th")[1].innerHTML;
            console.log(camera, mac);
            //cameraMac.push(mac);

            addTableSelectedCamera(camera, mac);
        }
    }
}
var selectedNumber = 0;
var countTableCoordinate = [0];
function addTableSelectedCamera(camera, mac){
    //var liste = document.getElementById("available-cameras");
    var liste = document.getElementById("selected-cameras");
    var newElement = document.createElement('tr');
    newElement.innerHTML = '<th>' + camera + '</th>'
                            + '<th>' + mac + '</th>';
    liste.appendChild(newElement);
    console.log("camera : " + camera + " " + mac);
    addedElementMap.set(mac, true);
    //newElement.onclick = function() {changeColor(newElement.id, temp)};
    console.log(addedElementMap);
}

function startCalibration(){
    console.log("sending message calibration");
    var send = false;
    var message = "cmd=startcalibration";
    var numeroCamera = 0;
    for (var [key, value] of addedElementMap) {
        if(value){
            message += "&camera" + numeroCamera + "=" +key;
            send = true;
        }
    }
    console.log(message);
    if(send)
        envoyerMessage(socket, message);
    else {
        console.log("aucune camera selectionne");
    }
}

function createCoordinateCameraTable(){
    var send = false;
    var message = "cmd=startcalibration";
    var numeroCamera = 0;
    for (var [key, value] of addedElementMap) {
        if(value){
            message += "&camera" + numeroCamera + "=" +key;
            send = true;
            numeroCamera++;
        }
    }
    console.log(message);
    if(send)
        envoyerMessage(socket, message);
    else {
        console.log("aucune camera selectionne");
    }
}

function addElementCoordinateTable(mac){
    selectedNumber++;
    var liste = document.getElementById("coordinate-cameras");
    var newElement = document.createElement('tr');
    newElement.setAttribute("id", "selected-camera-" + selectedNumber);
    newElement.innerHTML = '<th>' + mac + '</th>';
    liste.appendChild(newElement);
    countTableCoordinate.push(0);
    selectedCameraCoordinateMap.set(mac, false);

    pointAssociatedCamera.set(mac, []);
    var temp = selectedNumber;
    newElement.onclick = function() {changeColorCoordinateTable(newElement.id, temp, mac)};

}

function clearCoordinateTable(){
    var liste = document.getElementById("coordinate-cameras");
    var element = liste.getElementsByTagName("tr");
    var longueur = element.length;
    var tr = liste.getElementsByTagName("tr");
    for(var i = 1; i <= element.length; i++){
        //On enleve le premier element (le header ne comptant pas)
        element[1].parentNode.removeChild(element[1]);
    }
    selectedNumber = 0;
    countTableCoordinate = [0];
    //TODO remettre les elements a false
}

function changeColorCoordinateTable(id, numeroCamera, mac){
    countTableCoordinate[numeroCamera] = (countTableCoordinate[numeroCamera] + 1) % 2;
    console.log("changement de couleur pour camera-" + numeroCamera);
    console.log(document.getElementById(id));
    var ligne = document.getElementById(id); // forecolor
    if(countTableCoordinate[numeroCamera] == 1){
        if(numeroCamera!=0){
            console.log("changing color to yellow");
            ligne.style.backgroundColor = "#10ff64";
            selectedCameraCoordinateMap.set(mac, true);
        }
    }
    else {
        console.log("changing color to white");
        ligne.style.backgroundColor = "#ffffff";
        selectedCameraCoordinateMap.set(mac, false);
    }
}

function addNewPointCalibration(){
    console.log("sending message calibration");
    var send = false;
    var x = document.getElementById("x-coordinate").value;
    var y = document.getElementById("y-coordinate").value;
    var z = document.getElementById("z-coordinate").value;
    console.log(x,y,z);
    var message = "cmd=xyzcalibration";
    message += "&x=" + x;
    message += "&y=" + y;
    message += "&z=" + z;
    var numeroCamera = 0;
    for (var [key, value] of selectedCameraCoordinateMap) {
        if(value){
            message += "&camera" + numeroCamera + "=" +key;
            send = true;
            numeroCamera++;
            var tab = [x, y, z];
            //value.push(tab);
            //ajout des points
            pointAssociatedCamera.get(key).push(tab);
            console.log(pointAssociatedCamera.get(key));
            //pointAssociatedCamera.set(key, pointAssociatedCamera.get(key).push([x, y, z]));
        }
    }
    console.log(pointAssociatedCamera);
    console.log(message);
    if(send)
        envoyerMessage(socket, message);
    else {
        console.log("aucune camera selectionne");
    }
}
//		  input = document.getElementById("myInput");
