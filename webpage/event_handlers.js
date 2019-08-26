// thanks stack exchange https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

var key_codes = {};

var need_update = true;
var playing = false;
var mobile = false;



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
	
	if (e.keyCode === 70)
	{
		toggleFullScreen();
	}
	
    Game.keys[key_codes[e.keyCode]] = false;
}

function send_update() {
	/*
		We're going to do something just a LITTLE perverse here, by monkeying around with controls when handling touch events.
		That's right folks! Input monkey is input monkey!
		
		key_codes[87] = "up";
		key_codes[65] = "left";
		key_codes[83] = "down";
		key_codes[68] = "right";
		key_codes[188] = "weapon1";
		key_codes[190] = "weapon2";
	 */
	if(mobile)
	{
		handle_touches();
	}
    socket.emit("client_update", {
        name: Game.name,
        id: Game.id,
        colour: Game.colour,
        keys: Game.keys,
        viewport: { width: Camera.width, height: Camera.height },
        time: new Date().getTime(),
    });
}

var orbit_prevention_cooldown = 0;

function handle_touches()
{
	/* using da quadrant system!*/
	// N to up, S to down, etc...
	// weapons are any secondary touch 
	
	if(touchesPressed.length > 0)
	{
		var touch = touchesPressed[0];
		
		// Y increases FROM TOP TO BOTTOM!!! THETA CHANGES ACCORDINGLY!
		var delta_x = touch.currentX - touch.clientX;
		var delta_y = touch.clientY - touch.currentY;
		
		// because we're not sensitive!
		if(ingame)
		{
			if(Math.hypot(delta_x,delta_y) < 80)
			{
				return;
			}
		}
		else 
		{
			if(Math.hypot(delta_x,delta_y) < 300)
			{
				return;
			}
		}
		
		// angling quadrants.
		var angle = Math.atan2(delta_y, delta_x);
		if(angle < 0) angle += 2*Math.PI;
		console.log(angle);
		
		// right -> 0
		// top -> PI/2
		// left -> PI 
		// bottom -> 3PI/2
		
		if(angle > Math.PI/6 && angle < Math.PI*5/6)
		{
			Game.keys["up"] = true;
		}
		else 
		{
			Game.keys["up"] = false;
		}
		
		if((angle < Math.PI*2/6) || (angle > Math.PI*10/6))
		{
			Game.keys["right"] = true;
		}
		else 
		{
			Game.keys["right"] = false;
		}
		
		if(angle > Math.PI*4/6 && angle < Math.PI*8/6)
		{
			Game.keys["left"] = true;
		}
		else 
		{
			Game.keys["left"] = false;
		}
		
		if(angle > Math.PI*8/6 && angle < Math.PI*10/6)
		{
			if(orbit_prevention_cooldown <= 0)
			{
				socket.emit("toggle orbit");
				orbit_prevention_cooldown = 2000;
			}
			// orbitto!
			
			
			// cooldown to prevent any accidenttos!
			
		}
		
	}
	else 
	{
		Game.keys["up"] = false;
		Game.keys["right"] = false;
		Game.keys["left"] = false;
	}
}


/**
	Just a LITTLE bit stupid, we're registering any SECONDARY touch as a weapons touch.
	Differentiated based on halves.
 */
function handle_touchEnd(touch)
{
	var centerX = canvas.width / 2;
	
	Game.keys["weapon1"] = false;
	Game.keys["weapon2"] = false;
	if(touch.clientX > centerX)
	{
		Game.keys["weapon2"] = true;
	}
	else if(touch.clientX < centerX)
	{
		Game.keys["weapon1"] = true;
	}
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
	else 
	{
		orbit_prevention_cooldown -= data.time - last_update;
	}
	if(mobile)
	{
		Game.keys["weapon1"] = false;
		Game.keys["weapon2"] = false;
	}
    if (data.time < last_update && last_update !== null) {
        //we got an earlier update, so just ignore it.
        return;
    }
    last_update = data.time;
	
	// for touch events 
	
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
			// also changes default touch handling, because we need to 
			document.body.classList.remove('ingame');
			ingame = false;
			break;
		case "exit":
			document.getElementById("orbit_screen").style.visibility = "hidden";
			// restore to default
			document.body.classList.add('ingame');
			ingame = true;
			break;
		default:
			ingame = true;
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
