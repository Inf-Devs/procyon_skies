var canvas, context;
var form;
var socket;

function init() {
    form = document.getElementById("join_form");
    form.addEventListener("submit", form_submit);
    
    canvas  = document.createElement("canvas");
    context = canvas.getContext("2d");
    
    canvas.innerHTML = "loading...";
    
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

//util function to help us remove nodes
function remove_element(element) {
	element && element.parentNode && element.parentNode.removeChild(element);
}
