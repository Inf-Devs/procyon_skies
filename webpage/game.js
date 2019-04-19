var canvas, context;
var form;
var socket;

function init() {
    form = document.querySelector("form");
    form.addEventListener("submit", form_submit);
}

//our various event handlers, to keep ourselves sane
function form_submit(event) {
    //get ready for callback hell, y'all!
    
    //get the submitted name
    var name = form.name_field.value;
    log("submitted name: " + name);
    
    //make sure a valid name is entered
    if (name.trim() == "") name = "anonymous";
    
    event.preventDefault(); //no, don't reload the page!
    
    //now, for the XmLhTtPrEqUeSt!!!
    var req = new XMLHttpRequest();
    req.open("POST", "/" , true);
    req.send(name);
    req.addEventListener("load", () => {
        log("response: " + req.responseText);
    });
}

var logging = true;
function log(msg) {
    if (logging) console.log(msg);
}

init();