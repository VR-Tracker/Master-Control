var websocketIP = "192.168.42.1";
var askCamerasCameraPosition = "cmd=camerasposition"

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

var tagPositions = {};
var chart;
var cameraNumberPosition = 0;
var maxX = 3;
var maxY = 3;
var maxZ = 3;
var tagTracked = new Map();
/*
* On window load, open a websocket between the window and the server
* Create a master on opening window
*/

window.onload=function(){
    drawChart();
    createWebsocket();
}

function assingAllTags(){
    var messageMac = "cmd=mac&uid=1";
    sendMessage(socket, messageMac);
    var message = "cmd=assignalltag";
    sendMessage(socket, message);
    //setTimeout(function(){sendMessage(socket, message);}, 5000);
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

var index = 0;

function updateTagPosition(message){
    //console.log("message", message);
    //console.log("chart", chart.series);
    for (var i = 1; i < message.length; i++ ) {
        //if(i > chart.series.length){
        if(!tagTracked.has(message[i].uid)){
            tagTracked.set(message[i].uid, true)
            chart.addSeries({
            name: 'Tag ' + message[i].uid,
            colorByPoint: true,
            data: [[parseFloat(message[i].x), parseFloat(message[i].z), parseFloat(message[i].y)]]
            }, false);

            chart.redraw();
        }
        else {
            if(index % 10 == 0){
        chart.series[i].update({
            name: 'Tag ' + message[i].uid,
            colorByPoint: true,
            data: [[parseFloat(message[i].x), parseFloat(message[i].z), parseFloat(message[i].y)]]
        }, false);
            chart.redraw();
        }

        }
    }
    index++;
}

function addCameraPosition(message){
    for (var i = 0; i < cameraNumberPosition; i++ ) {
        console.log("chart :", chart.series);
        if(i > chart.series.length){
            chart.addSeries({
            name: 'Camera ' + message[i].uid,
            colorByPoint: false,
            data: [[parseFloat(message[i].x), parseFloat(message[i].y), parseFloat(message[i].z)]]
            }, false);
        }
        else {
        chart.series[i].update({
            name: 'Camera ' + message[i].uid,
            colorByPoint: false,
            data: [[parseFloat(message[i].x), parseFloat(message[i].y), parseFloat(message[i].z)]]
        }, false);
        }
    }
    chart.redraw();
}

function drawChart(){
    // Give the points a 3D feel by adding a radial gradient
    Highcharts.getOptions().colors = $.map(Highcharts.getOptions().colors, function (color) {
        return {
            radialGradient: {
                cx: 0.4,
                cy: 0.3,
                r: 0.5
            },
            stops: [
                [0, color],
                [1, Highcharts.Color(color).brighten(-0.2).get('rgb')]
            ]
        };
    });

    // Set up the chart
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'graph',
            margin: 100,
            type: 'scatter',
        // zoomType: 'xy',
            options3d: {
                enabled: true,
                alpha: 10,
                beta: 30,
                depth: 250,
                viewDistance: 5,
                fitToPlot: false,
                frame: {
                    bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
                    back: { size: 1, color: 'rgba(0,0,0,0.04)' },
                    side: { size: 1, color: 'rgba(0,0,0,0.06)' }
                }
            }
        },
        title: {
            text: 'Tag Positions'
        },
        subtitle: {
            text: 'Click and drag the plot area to rotate in space'
        },
        plotOptions: {
            scatter: {
                width: 3,
                height: 3,
                depth: 1
            }
        },
        yAxis: {
            min: 0,
            max: 2,
            title: null
        },
        xAxis: {
            min: 0,
            max: 2,
            gridLineWidth: 1
        },
        zAxis: {
            min: 0,
            max: 2,
            showFirstLabel: false
        },
        legend: {
            enabled: false
        },
        series: [{
            name: 'Camera',
            colorByPoint: true
        },{
            name: 'Tag',
            colorByPoint: true
        }]
    });


    // Add mouse events for rotation
    $(chart.container).on('mousedown.hc touchstart.hc', function (eStart) {
        eStart = chart.pointer.normalize(eStart);

        var posX = eStart.pageX,
            posY = eStart.pageY,
            alpha = chart.options.chart.options3d.alpha,
            beta = chart.options.chart.options3d.beta,
            newAlpha,
            newBeta,
            sensitivity = 5; // lower is more sensitive

        $(document).on({
            'mousemove.hc touchdrag.hc': function (e) {
                // Run beta
                newBeta = beta + (posX - e.pageX) / sensitivity;
                chart.options.chart.options3d.beta = newBeta;

                // Run alpha
                newAlpha = alpha + (e.pageY - posY) / sensitivity;
                chart.options.chart.options3d.alpha = newAlpha;

                chart.redraw(false);
            },
            'mouseup touchend': function () {
                $(document).off('.hc');
            }
        });
    });

}



window.onclose=function(){
    socket.close();
    console.log("connection closed");
}

function sendMessage(websocket, message){
    websocket.send(message);
}

function getCamerasPosition(){
    if(!calibrating)
        socket.send(askCamerasPosition);
}

function createWebsocket(){
    socket = new WebSocket('ws://' + websocketIP + ':7777/user/');

    socket.onopen = function(event) {
        wsFailedAlert.style.display = "none";
        wsSuccessAlert.style.display = "block";
        console.log("Websocket connected");
        assingAllTags();
    };
    // Handle any errors that occur.
    socket.onerror = function(error) {
        wsFailedAlert.style.display = "block";
        wsSuccessAlert.style.display = "none";
        console.log('WebSocket Error: ' + error);
    }
    // Handle messages sent by the server.
    socket.onmessage = function(event) {
        //getting the time of the message
        var message = event.data;
        parseMessage(message);
    }
}
