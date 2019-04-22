var canvas, context;
var form;
var socket;

function init() {
    form = document.querySelector("form");
    form.addEventListener("submit", form_submit);
    
    canvas  = document.createElement("canvas");
    context = canvas.getContext("2d");
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}

//custom logging, since console.log will drive us insane
var logging = true;
function log(msg) {
    if (logging) console.log(msg);
}

window.onresize = function(e) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    
    Camera.resize();
};