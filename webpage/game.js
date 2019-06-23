//game data
var Game = {
    id: null,
    colour: null,
    name: null,
    
    keys: {
        up: false,
        down: false,
        left: false,
        right: false,
        weapon1: false,
        weapon2: false,
    },
};

// UI elements 
var kill_counter;
var resource_counter;

//game setup
function setup_game() {
    //specifically: start a connection, update, then start when the information comes
    socket = io();
    
    document.body.style.color = get_colour(Game.colour);
    
    send_update();
    //socket.emit("client_update", { name: Game.name, id: Game.id, keys: Game.keys, colour: Game.colour});
    
    //set up our event listeners
    addEventListener("keyup", keyup_handler);
    addEventListener("keydown", keydown_handler);
    socket.on("server_update", receive_update);
    socket.on("notification", receive_notification);
    socket.on("death", on_death);
    socket.on("kill", on_kill);
    socket.on("leaderboard_update", update_leaderboard);
    socket.on("upgrades_update", Upgrades_display.receive_buy_update);
	
    //set up the main canvas
    document.body.appendChild(canvas);
    Camera.resize();
    
    //set up overlays
    var death_screen            = document.createElement("div");
    death_screen.style.colour   = get_colour(Game.colour);
    death_screen.id             = "death_screen";
    death_screen.hidden         = true;
    document.body.appendChild(death_screen);
    
    var restart_box                 = document.createElement("div");
    restart_box.innerHTML           = "<p>You have died!</p>";
    restart_box.style.color         = get_colour(Game.colour);
    restart_box.style.borderColor   = get_colour(Game.colour);
    restart_box.id                  = "restart_box";
    death_screen.appendChild(restart_box);
    
    var restart_button                  = document.createElement("button");
    restart_button.innerHTML            = "Restart";
    restart_button.style.color          = get_colour(Game.colour);
    restart_button.style.borderColor    = get_colour(Game.colour);
    restart_button.onclick = function() {location.reload()};
    restart_box.appendChild(restart_button);
	
    //set up the mini map and infos
    var mini_map               = document.createElement("canvas");
    mini_map.id                = "mini_map";
    mini_map.style.borderColor = get_colour(Game.colour);
    document.body.appendChild(mini_map);
    
    var status               = document.createElement("canvas");
    status.id                = "status_panel";
    status.style.borderColor = get_colour(Game.colour);
    document.body.appendChild(status);
    
    var info               = document.createElement("div");
    info.id                = "infos";
    info.style.borderColor = get_colour(Game.colour);
    info.style.color       = get_colour(Game.colour);
    document.body.appendChild(info);
    
	kill_counter 		= document.createElement("div");
	kill_counter.innerHTML 	= "kills: 0";
	kill_counter.id			= "kill_counter";
	info.appendChild(kill_counter);
	
	resource_counter 		= document.createElement("div");
	resource_counter.innerHTML 	= "resources: 0";
	resource_counter.id			= "resource_counter";
	info.appendChild(resource_counter);
	
    var leaderboard                 = document.createElement("div");
    leaderboard.innerHTML           = "<h1>Top Players</h1>";
    leaderboard.id                  = "leaderboard";
    leaderboard.style.borderColor   = get_colour(Game.colour);
    leaderboard.style.color         = get_colour(Game.colour);
    document.body.appendChild(leaderboard);
    
    Info_display.init(mini_map, status);
    
	// upgrades
	var upgrades_panel					= document.createElement("div");
	upgrades_panel.innerHTML			= "<h1>Upgrades</h1>";
	upgrades_panel.id					= "upgrades_panel";
	upgrades_panel.style.borderColor	= get_colour(Game.colour);
    upgrades_panel.style.color			= get_colour(Game.colour);
	document.body.appendChild(upgrades_panel);
	
    requestAnimationFrame(animate);
}