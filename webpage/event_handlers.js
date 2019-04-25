//our various event handlers, to keep ourselves sane and to keep track of our callback problems.
function form_submit(event) {
    event.preventDefault();
    //get ready for callback hell, y'all!
    
    //get the submitted name
    var name = form.name_field.value;
    log("submitted name: " + name);
    
    //make sure a valid name is entered
    if (name.trim() == "") name = "anonymous";
    
    event.preventDefault(); //no, don't reload the page!
    
    document.body.removeChild(form);
    
    //now, for the XmLhTtPrEqUeSt!!!
    var req = new XMLHttpRequest();
    req.open("POST", "/" , true);
    req.send(name);
    req.addEventListener("load", post_request_handler(req, setup_game));
}

function post_request_handler(req, callback) {
    return function() {
        log("response: " + req.responseText);
        
        var data = JSON.parse(req.responseText);
        
        Game.id     = data["id"];
        Game.name   = data["name"];
        Game.colour = data["colour"];
        
        callback();
    }
}

//MORE event handlers! YAY!
// for reference:
//  37: left arrow
//  38: up arrow
//  39: right arrow
//  40: down arrow
//  90: z (blasters)
//  88: x (torpedos)
//  67: c (unused)
var key_codes = (function() {
    var a = [90];
    a[37] = "left";
    a[38] = "up";
    a[39] = "right";
    a[40] = "down";
    a[90] = "blasters";
    a[88] = "torpedos";
    return a;
})();
function keydown_handler(e) {
    Game.keys[key_codes[e.keyCode]] = true;
}

function keyup_handler(e) {
    Game.keys[key_codes[e.keyCode]] = false;
}

function send_update() {
    //data to send:
    //    [x] player's name
    //    [x] player's id
    //    [x] player's colour
    //    [x] player's keys' states
    //    [x] the time
    //    [x] the viewport's size
    socket.emit("client_update", {
        name: Game.name,
        id: Game.id,
        colour: Game.colour,
        keys: Game.keys,
        viewport: { width: Camera.width, height: Camera.height },
        time: new Date().getTime(),
    });
}

var last_update = null;

function receive_update(data) {
    if (data.time < last_update && last_update != null) {
        //we got an earlier update, so just ignore it.
        return;
    }
    last_update = data.time;
    
    //update the camera
    Camera.players  = data.players;
    Camera.objects  = data.objects;
    Camera.offset_x = data.offset.x;
    Camera.offset_y = data.offset.y;
    
    Info_display.health = data.health;
    Info_display.ammo   = data.ammo;
    
    playing = true;
}

var need_update = true;
var playing = false;
function animate() {
    if (playing) {
        Camera.draw_frame(context);
    }
    
    if (need_update) {
        send_update();
    }
    need_update = !need_update;
    
    requestAnimationFrame(animate);
}