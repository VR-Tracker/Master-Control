KEY_SPACE			= 32;
REMAP_KEY_T	= 5019;
KEY_ESCAPE =  27;
var CALIBRATING = true;
var nextCalibrationIndex = 0;
var calibrationCount = 0;
var calibrationDetected = 0;
var calibrationViewActivated = false;
var pingMessage = "cmd=pingcalibrationtag";
var enablePingAgain = false;
var tagConnected = true;
document.onkeydown = applyKey;
document.addEventListener('keypress', stopEscAction, false);

function handleKeySpace(winObj){

    hideCalibrationMessages();
    if(tagConnected){
        if(calibrationViewActivated){
            // --- Display Message
            if(calibrationPoint.length > 0){
                if(nextCalibrationIndex < calibrationPoint.length ){
                    var boutonNext = document.getElementById("next-point-btn");
                    if(nextCalibrationIndex > 0){
                        sendMessage(socket, pingMessage);
                        document.getElementById("calibration-inprocess").style.display = "block";
                        if(calibrationCount == calibrationDetected){
                            calibrationCount++;
                        }
                    }else{
                        nextCalibrationIndex++;
                        showNextCalibrationPoint();
                        boutonNext.style.display = "block";

                    }
                    enablePingAgain = true;
                    if(nextCalibrationIndex == calibrationPoint.length){
                        boutonNext.style.display = "None";
                    }
                }else{
                    if(nextCalibrationIndex == calibrationPoint.length){
                        if(calibrationDetected == calibrationCount){
                            //document.getElementById("calibration-inprocess").style.display = "block";
                            calibrationCount++;
                            sendMessage(socket, pingMessage);
                        }
                        if(!enablePingAgain){
                            enablePingAgain = true;
                        }
                        document.getElementById("calibration-inprocess").style.display = "block";
                    }else{
                        console.log("Ping non possible");
                    }
                }
            }else{
                masquerAffichageMessage();
            }
            // 2° --- Map the keyCode in another keyCode not used
            //winObj.keyCode = intKeyCode ;//= REMAP_KEY_T;
            //winObj.returnValue = false;
            return false;

        }else{
            calibrationViewActivated = true;
            if(nextCalibrationIndex != 0){
                affichageMessage();
            }else{
                nextCalibrationIndex++;
                showNextCalibrationPoint();
            }
        }
    }else{
        var text = "Connect a Tag !";
        document.getElementById("calibration-failed").innerHTML = "ERROR";
        document.getElementById("calibration-failed").style.display = "block";
        fullScreenMessage.innerHTML = text;
        affichageMessage();
        calibrationMessage.display = "none";
    }
}

function updateCalibration(ping){
    hideCalibrationMessages();
    if(tagConnected){
        if(calibrationViewActivated){
            // --- Display Message
            if(calibrationPoint.length > 0){
                if(nextCalibrationIndex < calibrationPoint.length ){
                    var boutonNext = document.getElementById("next-point-btn");
                    if(nextCalibrationIndex > 0){
                        document.getElementById("calibration-inprocess").style.display = "block";
                        if(calibrationCount == calibrationDetected){
                            calibrationCount++;
                        }
                    }else{
                        nextCalibrationIndex++;
                        showNextCalibrationPoint();
                        boutonNext.style.display = "block";

                    }
                    enablePingAgain = true;
                    if(nextCalibrationIndex == calibrationPoint.length){
                        boutonNext.style.display = "None";
                    }
                }else{
                    if(nextCalibrationIndex == calibrationPoint.length){
                        if(calibrationDetected == calibrationCount){
                            //document.getElementById("calibration-inprocess").style.display = "block";
                            calibrationCount++;
                        }
                        if(!enablePingAgain){
                            enablePingAgain = true;
                        }
                        document.getElementById("calibration-inprocess").style.display = "block";
                    }else{
                        console.log("Ping non possible");
                    }
                }
            }else{
                masquerAffichageMessage();
            }

            return false;

        }else{
            calibrationViewActivated = true;
            if(nextCalibrationIndex != 0){
                affichageMessage();
            }else{
                if(ping)
                    calibrationCount++;
                nextCalibrationIndex++;
                showNextCalibrationPoint();
            }
        }
    }else{
        var text = "Connect a Tag !";
        document.getElementById("calibration-failed").innerHTML = "ERROR";
        document.getElementById("calibration-failed").style.display = "block";
        fullScreenMessage.innerHTML = text;
        affichageMessage();
        calibrationMessage.display = "none";
    }
}

function applyKey (_event_){
    //If calibration mode is on we enable the space press action
    if(CALIBRATING){
        // --- Retrieve event object from current web explorer
        var winObj = checkEventObj(_event_);

        var intKeyCode = winObj.keyCode;
        // 1° --- Access with KEY SPACE
        if (intKeyCode == KEY_SPACE){
            handleKeySpace(winObj);
        }else{
            if(intKeyCode == KEY_ESCAPE){
                if(calibrationViewActivated){
                    masquerAffichageMessage();
                }
            }
        }
    }else{
        console.log("Not Calibrating");
    }
}

function checkEventObj ( _event_ ){
    // --- IE explorer
    if ( window.event )
    return window.event;
    // --- Netscape and other explorers
    else
    return _event_;
}

function masquerAffichageMessage(){
    document.getElementById("calibrationMessage").style.display = "none";
    document.getElementById("messageScreen").style.display = "none";
    document.getElementById("cover").style.display = "none";
    calibrationViewActivated = false
}

function hideCalibrationMessages(){
    document.getElementById("calibration-failed").style.display = "none";
    document.getElementById("calibration-success").style.display = "none";
    document.getElementById("calibration-inprocess").style.display = "none";

}
function affichageMessage(){
    document.getElementById("calibrationMessage").style.display = "block";
    document.getElementById("messageScreen").style.display = "block";
    document.getElementById("cover").style.display = "block";
}

function showNextCalibrationPoint(){
    if(calibrationCount < calibrationPoint.length){
        var calibrationPosition = calibrationPoint[calibrationCount];
        var message = "";
        if(calibrationPosition.length == 3){
            calibrationMessage.display = "Bring Tag to Position :";
            message += "X : " + calibrationPosition[0] + " - ";
            message += "Y : " + calibrationPosition[1] + " - ";
            message += "Z : " + calibrationPosition[2];
            fullScreenMessage.innerHTML = message;
            affichageMessage();
        }
        if(calibrationCount == calibrationPoint.length - 1)
            document.getElementById("next-point-btn").style.display = "none";
    }else{
        if(calibrationDetected == nextCalibrationIndex){
            var calibrationPosition = calibrationPoint[calibrationCount - 1];
            var message = "";
            if(calibrationPosition.length == 3){
                calibrationMessage.display = "Bring Tag to Position :";
                message += "X : " + calibrationPosition[0] + " - ";
                message += "Y : " + calibrationPosition[1] + " - ";
                message += "Z : " + calibrationPosition[2];
                fullScreenMessage.innerHTML = message;
                affichageMessage();
            }
        }else{
            affichageMessage();
            var text = "Calibration Finished !";
            calibrationMessage.display = "none";
            fullScreenMessage.innerHTML = text;
            stopCalibration();
        }
    }
}

function stopEscAction(evt) {
    var charCode = evt.charCode;
    if(charCode == KEY_ESCAPE){
        if(calibrationViewActivated)
        evt.preventDefault();
    }
}
