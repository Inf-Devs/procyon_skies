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
        blasters: false,
        torpedos: false,
    },
};

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
    
    //set up the main canvas
    document.body.appendChild(canvas);
    Camera.resize();
    
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
    info.innerHTML         = "kills: 0";
    info.id                = "infos";
    info.style.borderColor = get_colour(Game.colour);
    info.style.color       = get_colour(Game.colour);
    document.body.appendChild(info);
    
	var leaderboard					= document.createElement("div");
	leaderboard.innerHTML			= "<h1>Top Players</h1>";
	leaderboard.id					= "leaderboard";
	leaderboard.style.borderColor	= get_colour(Game.colour);
	leaderboard.style.color			= get_colour(Game.colour);
	document.body.appendChild(leaderboard);
	
    Info_display.init(mini_map, status);
    
    requestAnimationFrame(animate);
}