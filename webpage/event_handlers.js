var key_codes = {};

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

//our various event handlers, to keep ourselves sane and to keep track of our callback problems.
function form_submit(event) {
    event.preventDefault();
    //get ready for callback hell, y'all!

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
	// 77: m
	// 188: ,
	// 190: .
	// 191: / (firefox has problems with this one.)

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
	// just delete everything!
    removeElement(document.getElementById("join"));
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
        init_game(data);

        callback();
    }
}

function keydown_handler(e) {
    Game.keys[key_codes[e.keyCode]] = true;
}

function keyup_handler(e) {
    if (e.keyCode == 77 || e.keyCode == 67) {
        socket.emit("toggle orbit");
        return;
    }

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

function initialize(data)
{
	log(data);
	Upgrades_display.init(data.upgrades);
	Weapons_handler.init(data.weapons);
}

var last_update = null;

function receive_update(data) {
    // for initializing certain HTML elements
    if (last_update === null)
    {
        //var player = data.player;
        //Upgrades_display.init(player.current_upgrades);
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
    Game.player     = data.player;

    //update infos
    Info_display.health = data.health;
    Info_display.ammo   = data.ammo;

    Camera.minimap_objects = data.minimap_objects;

    resource_counter.innerHTML = "resources: " + data.player.resources;

    playing = true;
}

function receive_notification(message) {
    var NOTIFICATION_TIME = 10000;
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
    document.getElementById("death_screen").style.visibility = "visible";
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

function toggle_orbit(state)
{
	switch(state)
	{
		case "enter":
			document.getElementById("orbit_screen").style.visibility = "visible";
			break;
		case "exit":
			document.getElementById("orbit_screen").style.visibility = "hidden";
			break;
		default:
	}
}


// upgrade handler
var Upgrades_display = {
    panel: null,
    cost_display: null,
    upgrade_panels: {},

    current_upgrades: {},
    init: function(upgrades)
    {
        var current_upgrades = Upgrades_display.current_upgrades;
        var panel = Upgrades_display.panel = document.getElementById("upgrades_panel");
        var upgrade_panels = Upgrades_display.upgrade_panels;

        var cost_display = Upgrades_display.cost_display = document.createElement("div");
        cost_display.innerHTML = "<p>150 resources</p>";
        panel.appendChild(cost_display);

		for(key in upgrades)
		{
			var upgrade = upgrades[key];
			current_upgrades[key] = {count:0, max: upgrade.max};
			// set it all up for each row
			upgrade_panels[key] = {panel:document.createElement("div")};
			upgrade_panels[key].panel.innerHTML = "<p class = \'tooltip-left\'tooltip= \'" + upgrade.description + "\'>" + upgrade.name +"</p>";
            // tooltips
			panel.appendChild(upgrade_panels[key].panel);


			// now add in the upgrade fullness
			var upgrade_progress = upgrade_panels[key].upgrade_progress = document.createElement("progress");
			upgrade_progress.setAttribute("value",0);
			upgrade_progress.setAttribute("max",upgrade.max);
			upgrade_panels[key].panel.appendChild(upgrade_progress);

			// buttons
			var upgrade_button = upgrade_panels[key].upgrade_button = document.createElement("button");
			upgrade_button.key = key;
			upgrade_button.onclick = function()
			{
				Upgrades_display.send_buy_request(this.key);
			};
			upgrade_button.innerHTML = "+";
			upgrade_button.style.borderColor = get_colour(Game.colour);
			upgrade_button.style.color       = get_colour(Game.colour);
			upgrade_panels[key].panel.appendChild(upgrade_button);
		}
    },

    send_buy_request: function(name)
    {
        var upgrade = Upgrades_display.current_upgrades[name];
        // decrease clutter
        if(upgrade.count < upgrade.max)
        {
            send_ask("buy_upgrade",{upgrade_name:name});
        }
    },

    receive_buy_update: function(data)
    {
        Upgrades_display.current_upgrades[data.upgrade_bought].count += 1;
        Upgrades_display.upgrade_panels[data.upgrade_bought].upgrade_progress.setAttribute("value",Upgrades_display.current_upgrades[data.upgrade_bought].count);
        Upgrades_display.cost_display.innerHTML = "<p>" + data.next_upgrade_cost + " resources</p>";
    },
};

// weapons handler
var Weapons_handler = {
	panel: null,


	init: function(weapons)
	{
		var panel = Weapons_handler.panel = document.getElementById("weapons_panel");
		// create new subpanels, one for each type of weapon
		var primary_weapons = document.createElement("div");
		primary_weapons.id = "primary_weapons";
		primary_weapons.classList.add("theme_colour","sub_panel");
		panel.appendChild(primary_weapons);

		var secondary_weapons = document.createElement("div");
		secondary_weapons.id = "secondary_weapons";
		secondary_weapons.classList.add("theme_colour","sub_panel");
		panel.appendChild(secondary_weapons);

		// now handle da weapons!
		for(var weapon_key in weapons)
		{
			var weapon = weapons[weapon_key];
			// create a new element to represent this weapon
			var weapon_display = document.createElement("div");
			weapon_display.classList.add("weapon_display","theme_colour");
			// take your imgs from Canvas_icons
			if(Canvas_icons[weapon_key])
			{
				var icon = new Image();
				icon.src = Canvas_icons[weapon_key];
				weapon_display.appendChild(icon);
			}
			// add text
			var weapon_name = document.createElement("h1");
			weapon_name.innerHTML = weapon.name;
			weapon_display.appendChild(weapon_name);

			var weapon_description = document.createElement("p");
			weapon_description.innerHTML = weapon.description;
			weapon_display.appendChild(weapon_description);

			var weapon_rpm = document.createElement("p");
			var ratepersecond = 0;
			if(weapon.cooldown !== 0) ratepersecond = 1000/weapon.cooldown;
			weapon_rpm.innerHTML = "RPM: " + (ratepersecond * 60);
			weapon_display.appendChild(weapon_rpm);

			var weapon_price = document.createElement("p");
			weapon_price.innerHTML = "Price: " + weapon.price + " resources";
			weapon_display.appendChild(weapon_price);

			var buy_weapon_button = document.createElement("button");
			buy_weapon_button.innerHTML = "buy";
			buy_weapon_button.key = weapon_key;
			buy_weapon_button.onclick = function()
			{
				Weapons_handler.send_buy_request(this.key);
			}
			weapon_display.appendChild(buy_weapon_button);


			// differentiate based on if it's primary or secondary
			if(weapon.slot === "primary")
			{
				primary_weapons.appendChild(weapon_display);
			}
			else if (weapon.slot === "secondary")
			{
				secondary_weapons.appendChild(weapon_display);
			}
		}
	},

	send_buy_request: function(weapon_key)
	{
		send_ask("buy_weapon",weapon_key);
	},

	receive_weapons_update: function(data)
	{

	},
};
