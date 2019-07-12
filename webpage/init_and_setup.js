var canvas, context;
var form;
var socket;
var stylesheet;

function init() {
    form = document.getElementById("join_form");
    form.addEventListener("submit", form_submit);
    
    canvas  = document.createElement("canvas");
    context = canvas.getContext("2d");
    
    canvas.innerHTML = "loading...";
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
	
	stylesheet = get_style_sheet_by_name("stylesheet");
	
}

// UI elements 
var kill_counter;
var resource_counter;
var orbit_panel;

// init game 
function init_game(data)
{
	Game.id     = data["id"];
	Game.name   = data["name"];
	Game.colour = data["colour"];

	// set rules
	
	stylesheet.insertRule(".theme_colour{"
		+ "border-color:" + get_colour(Game.colour) + ";" 
		+ "color:" + get_colour(Game.colour) + ";" 
		+ "}");
		
	// specifically for progress bars 
	stylesheet.insertRule("#upgrades_panel progress[value]::-webkit-progress-value {"
		+ "-webkit-appearance: none;"
		+ "appearance: none;"
		+ "background-color: " + get_colour(Game.colour,1) + ";"
		+ "}");
    
}

//game setup
// moved this here because it makes no sense that setup isn't in init_and_setup.js 
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
    socket.on("orbit_update", toggle_orbit);
	
    //set up the main canvas
    document.body.appendChild(canvas);
    Camera.resize();
    
    //set up overlays
    
	// death screen
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
	
	// orbit screen
	var orbit_screen			= document.createElement("div");
	orbit_screen.style.colour	= get_colour(Game.colour);
	orbit_screen.id				= "orbit_screen";
	orbit_screen.hidden			= true;
	document.body.appendChild(orbit_screen);
	
	orbit_panel	= new TabbedPanel();
	orbit_panel.panel.style.colour		= get_colour(Game.colour);
	orbit_panel.panel.style.borderColor = get_colour(Game.colour);
	orbit_panel.panel.id				= "orbit_panel";
	
	orbit_screen.appendChild(orbit_panel.panel);
	
	// upgrades
	var upgrades_panel					= document.createElement("div");
	upgrades_panel.innerHTML			= "<h1>Upgrades</h1>";
	upgrades_panel.id					= "upgrades_panel";
	upgrades_panel.style.borderColor	= get_colour(Game.colour);
    upgrades_panel.style.color			= get_colour(Game.colour);
	orbit_panel.addTab(upgrades_panel, "Upgrades");
	
	// weapons
	var shop_weapons_panel = document.createElement("div");
	orbit_panel.addTab(shop_weapons_panel, "Weapons");
	
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
	
    requestAnimationFrame(animate);
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

//util function to help us select the correct stylesheet 
function get_style_sheet_by_name(name)
{
	if(!name) return;
	
	var sheets = document.styleSheets;
	for(var index in sheets)
	{
		if(sheets[index].href && sheets[index].href.indexOf(name + ".css") > -1)
		{
			return sheets[index];
		}
	}
	
	log("No such stylesheet called \"" + name + "\" exists. The name of a stylesheet refers to its href and does not need the suffix.");
}