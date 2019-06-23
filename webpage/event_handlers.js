//our various event handlers, to keep ourselves sane and to keep track of our callback problems.
function form_submit(event) {
    event.preventDefault();
    //get ready for callback hell, y'all!
    
    //both control schemes are active. no need to choose.
    //WASD, "," for weapon1, "." for weapon2
    key_codes[87] = "up";
    key_codes[65] = "left";
    key_codes[83] = "down";
    key_codes[68] = "right";
    key_codes[188] = "weapon1";
    key_codes[190] = "weapon2";
    //arrow keys, z for weapon1, x for weapon2
    key_codes[37] = "left";
    key_codes[38] = "up";
    key_codes[39] = "right";
    key_codes[40] = "down";
    key_codes[90] = "weapon1";
    key_codes[88] = "weapon2";

    //get the submitted name
    var name = form.name_field.value;
    log("submitted name: " + name);
    
    //make sure a valid name is entered
    if (name.trim() == "") name = "anonymous";
    
    event.preventDefault(); //no, don't reload the page!
    
    removeElement(form);
    
    //now, for the XmLhTtPrEqUeSt!!!
    var req = new XMLHttpRequest();
    req.open("POST", "/" , true);
    req.send(name);
    req.addEventListener("load", post_request_handler(req, setup_game));
}

function removeElement(element)
{
    element.parentNode.removeChild(element);
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

// other reference 
// 87: w
// 65: a
// 83: s
// 68: d
// 188: ,
// 190: .
// 191: /
var key_codes = (function() {
    var action = {};
    return action;
})();
function keydown_handler(e) {
    Game.keys[key_codes[e.keyCode]] = true;
}

function keyup_handler(e) {
    Game.keys[key_codes[e.keyCode]] = false;
}

function send_update() {
    socket.emit("client_update", {
        name: Game.name,
        id: Game.id,
        colour: Game.colour,
        keys: Game.keys,
        viewport: { width: Camera.width, height: Camera.height },
        time: new Date().getTime(),
    });
}

// for minor requests
function send_ask(action,request) {
    socket.emit("ask",{action:action,request:request});
}

var last_update = null;

function receive_update(data) {
    // for initializing certain HTML elements 
    if (last_update === null)
    {
        var player = data.player;
        Upgrades_display.init(player.current_upgrades);
    }
    
    if (data.time < last_update && last_update !== null) {
        //we got an earlier update, so just ignore it.
        return;
    }
    last_update = data.time;
    
    //update the camera
    Camera.players  = data.players;
    Camera.objects  = data.objects;
    Camera.offset_x = data.offset.x;
    Camera.offset_y = data.offset.y;
    
    //update infos
    Info_display.health = data.health;
    Info_display.ammo   = data.ammo;
    
    resource_counter.innerHTML = "resources: " + data.player.resources;
        
    playing = true;
}

function receive_notification(message) {
    var NOTIFICATION_TIME = 3000;
    log('notification received: "' + message + '"');
    
    var message_box = document.createElement('div');
    message_box.classList.add('notification');    
    message_box.style.color = get_colour(Game.colour);
    message_box.style.borderColor = get_colour(Game.colour);
    message_box.innerHTML = message;
    
    document.body.appendChild(message_box);
    
    setTimeout(function(){remove_element(message_box)},NOTIFICATION_TIME);
}

function on_death() {
    log("player has been killed.");
    //to-do:
    //[ ] a death screen
    //[ ] give the player an option to respawn (don't worry about respawning logic)
    document.getElementById("death_screen").style.display = "flex";
    // Restart with forced refresh for now 
}

var kills = 0;

function on_kill() {
    log("player has a kill.");
    //to-do:
    
    kills++;
    kill_counter.innerHTML = "kills: " + kills;
}

function update_leaderboard(data) {
    //to-do: update on client side
    
    var leaderboard = document.getElementById("leaderboard")
    leaderboard.innerHTML = "<h1>Top Players</h1>";

    for(var i = 0; i < data.length; i++)
    {
        var player = document.createElement("div");
        
        var name_counter = document.createElement("span");
        name_counter.innerHTML = data[i].name;
        name_counter.classList.add("name_counter");
        player.appendChild(name_counter);
        
        var kill_counter       = document.createElement("span");
        kill_counter.innerHTML = data[i].score;
        kill_counter.classList.add("kill_counter");
        player.appendChild(kill_counter);
        
        leaderboard.appendChild(player);
    }
    
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
