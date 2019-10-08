var Misc_math   = require(__dirname + "/misc_math.js");
var Universe    = require(__dirname + "/universe.js");
var Particles   = require(__dirname + "/particles.js");
var Weapons     = require(__dirname + "/weapons.js");
var Game_events = require(__dirname + "/events.js");
var Colours     = require(__dirname + "/colours.js");
var log         = require(__dirname + "/logging.js");
var Pickupable  = require(__dirname + "/pickupable.js");

var default_planet = { orbitable: true, x: 0, y: 0, radius: 10 };

function Player(name, colour, id) {
    this.colour = colour;
    this.name   = name;
    this.id     = id;

    //angle, position, and vector
    this.x     = null;
    this.y     = null;
    this.v     = {x: 0, y: 0};
    this.angle = null;

    //keys
    this.keys = {
        up: false,
        down: false,
        left: false,
        right: false,
        weapon1: false,
        weapon2: false,
    };
    
    this.weapons = [ Weapons[(Math.random() < 0.1 ? "twin blaster" : "blaster")], Weapons["torpedo"] ];
    
    // upgrades
    this.current_upgrades = [];
    for(var upgrade in this.upgrades)
    {
        this.current_upgrades.push({name:this.upgrades[upgrade].name,count:0,type:this.upgrades[upgrade]});
    }
    
    //health related stuff
    this.health      = 1;
    this.last_damage = 0;
    //when 0, player can take damage.
    //when >0, player invulnerable for that amount of time in ms.
    this.invulnerable = 0;

    //ammo
    this.ammo      = 1;
    this.last_fire = 0;

    //miscellaneous
    this.last_exhaust = 0;
    this.last_spawn   = 0;
    this.active       = true;
    this.type         = "player";
    this.score        = 0; // stats!
    this.exhaust      = Math.random() < 0.5 ? Particles.Bubble : Particles.Shrinking_diamond;
    this.resources    = 500;
    
    //orbit! not the KSP kind.
    this.orbiting_planet = default_planet;
}

Player.prototype.is_body    = true;
Player.prototype.radius     = 7.5;
Player.prototype.bounciness = 0.004;

Player.prototype.engine_thrust  = 0.0005;
Player.prototype.rotation_speed = 0.003;

//for calculating with upgrades
Player.prototype.base_engine_thrust  = 0.0005;
Player.prototype.base_rotation_speed = 0.003;

Player.prototype.exhaust_delay = 125; // 125 ms for each exhuast bubble

Player.prototype.invulnerable_after_spawn = 5000;

Player.prototype.collision_damage = 0.03;

Player.prototype.ammo_replenish_delay = 500; // 500 ms for ammo to start being replenished
Player.prototype.heal_delay           = 2000; // 2000 ms for health to start recovering

Player.prototype.ammo_replenish_rate = 0.0005;
Player.prototype.heal_rate           = 0.00000625;

//for calculating with upgrades
Player.prototype.base_ammo_replenish_delay = 500; // 500 ms for ammo to start being replenished
Player.prototype.base_heal_delay           = 2000; // 2000 ms for health to start recovering

Player.prototype.base_ammo_replenish_rate = 0.0005;
Player.prototype.base_heal_rate           = 0.00000625;
Player.prototype.base_damage_resistance   = 1; // take full damage

Player.prototype.base_upgrade_cost = 150;
Player.prototype.upgrade_cost_factor = 1.0; // adjust 1.0 for base cost, higher for greater cost (and higher grinding!)

Player.prototype.orbit_cooldown = 1e4; //ten seconds to switching between planet and space

// name MUST NOT differ from key, use 'display_name' instead
Player.prototype.upgrades = {
    "health regen":{
        name:"health regen",
		description:"Makes your health go up faster.",
        max: 10,
    },
    "engine thrust":{
        name:"engine thrust",
		description:"Makes you go faster.",
        max: 5,
    },
    "engine turning":{
        name:"engine turning",
		description:"Makes you go spinning faster.",
        max: 5,
    },
    "damage resistance":{
        name:"damage resistance",
		description:"Decreases damage that other things can do to you.",
        max: 10,
    },
    "ammo regen":{
        name:"ammo regen",
		description:"So you can shoot more.",
        max: 10,
    },
};

Player.prototype.get_info = function() {
    var is_invincible = this.invulnerable > 0; //workaround.
    return {
        name: this.name,
        id: this.id,
        type: this.type,
        colour: this.colour,
        x: this.x, y: this.y,
        health: this.health,
        ammo: this.ammo,
        angle: this.angle,
        score: this.points,
        invincible: is_invincible,
    };
};

Player.prototype.update = function(lapse) {
    if (this.orbiting_planet != null) {
        //player is at planet, no need to update
        this.x = this.orbiting_planet.x;
        this.y = this.orbiting_planet.y;
        return;
    }
    
    // get some upgrade counts 
    var engine_thrust_level = this.get_upgrade_count("engine thrust");
    var engine_turning_level = this.get_upgrade_count("engine turning");
    //update the angle
    this.angle = this.angle
        + (this.keys.left ? -this.rotation_speed * (1 + 0.1 * engine_turning_level) * lapse : 0) 
        + (this.keys.right ? this.rotation_speed * (1 + 0.1 * engine_turning_level) * lapse : 0);
    
    //get the friction
    var friction = { x: -this.v.x * Universe.friction * lapse, y: -this.v.y * Universe.friction * lapse};
    //get the thrust
    var thrust = {
        x: this.keys.up ? Math.cos(this.angle) * this.engine_thrust * (1 + 0.1 * engine_thrust_level) * lapse : 0,
        y: this.keys.up ? Math.sin(this.angle) * this.engine_thrust * (1 + 0.1 * engine_thrust_level) * lapse : 0,
    };
    
    //...and now add them together!
    this.v.x += (friction.x + thrust.x);
    this.v.y += (friction.y + thrust.y);

    this.x += this.v.x * lapse;
    this.y += this.v.y * lapse;

    //keep it within the world
    if (this.x < 0 || this.x > Universe.width) {
        this.x   = Math.max(0, Math.min(Universe.width, this.x));
        this.v.x = 0;
    }

    if (this.y < 0 || this.y > Universe.height) {
        this.y   = Math.max(0, Math.min(Universe.height, this.y));
        this.v.y = 0;
    }
    
    // now that the position's updated... you'd think we'd be done, but NOPE!
    
    this.last_fire    += lapse;
    this.last_exhaust += lapse;
    this.last_damage  += lapse;
    this.last_spawn  += lapse;
    this.invulnerable -= lapse;
    
    //safeguard
    this.invulnerable = Math.max(this.invulnerable, 0);
    
    //if the thrust key is pressed, make a bubble.
    if (this.keys.up && this.last_exhaust >= this.exhaust_delay) {
        Universe.objects.push(new this.exhaust(this.x, this.y, this.angle + Math.PI, Colours.lighten(this.colour)));
        this.last_exhaust = this.last_exhaust % this.exhaust_delay;
    }
    
    //dealing with ammo and weapons
    if (this.keys.weapon1 && this.ammo >= this.weapons[0].cost &&
        this.last_fire >= this.weapons[0].cooldown
    ) {
        this.ammo -= this.weapons[0].cost;
        this.weapons[0].fire(this.get_info());
        
        this.reset_ammo();
    }
    
    if (this.keys.weapon2 && this.ammo >= this.weapons[1].cost &&
        this.last_fire >= this.weapons[1].cooldown
    ) {
        this.ammo -= this.weapons[1].cost;
        this.weapons[1].fire(this.get_info());
        
        this.reset_ammo();
    }
    
    this.replenish_ammo(lapse);
    
    //now check for collision with any projectiles? LAG MACHINE!
    Universe.projectiles.forEach((p) => {
        if (p.owner == this.id) {
            return;
        }
        
        if (Misc_math.get_distance(this.x, this.y, p.x, p.y) < this.radius + p.radius) {
            this.do_damage(p.collision(), p.owner);
        }
    });
    
    this.heal(lapse);
    
    //now check for other stuff collision...MORE LAG!!!!
    Universe.bodies.forEach((body) => {
        if (body === this || body.owner == this.id) return;
        
        var min_dist = this.radius + body.radius;
        var overlap  = min_dist - Misc_math.get_distance(this.x, this.y, body.x, body.y);

        if (overlap > 0) {
            //push it away
            var angle = Misc_math.get_angle(this, body) + Math.PI;
            
            //this.do_damage(this.collision_damage);
            
            this.v.x += Math.cos(angle) * (overlap * this.bounciness * 2);
            this.v.y += Math.sin(angle) * (overlap * this.bounciness * 2);
        }
    });
};

//helper functions
Player.prototype.reset_ammo = function() {
    this.last_fire = 0;
};

Player.prototype.replenish_ammo = function(lapse) {
    var ammo_regen_level = this.get_upgrade_count("ammo regen");
    if (this.last_fire >= this.ammo_replenish_delay - (25 * ammo_regen_level) &&
        this.ammo < 1 && !this.keys.weapon1 && !this.keys.weapon2
    ) {
        this.ammo = Math.min(this.ammo + this.ammo_replenish_rate * (1 + 0.1 * ammo_regen_level) * lapse, 1);
    }
};

Player.prototype.do_damage = function(damage, owner) {
    if (this.invulnerable > 0) {
        //player invulnerable, ignore damage
        return;
    }
    
    // damage negation due to damage resistance.
    // limits to 2 so it's not TOO OP
    var damage_resistance = 1 + (this.get_upgrade_count("damage resistance")/2);
    
    // damage resistance is a sure as hell powerful divisor, can't negate damage but can sure as hell make it harder to kill
    this.health -= damage / damage_resistance;
    
    if (this.health <= 0) {
        this.active = false;
        this.explode();
        
        Game_events.emit("kill", { killer: owner, victim: this.id });
    }
    
    this.last_damage = 0;
};

Player.prototype.heal = function(lapse) {
    var health_regen_level = this.get_upgrade_count("health regen");
    if (this.last_damage > this.heal_delay - (100*health_regen_level) && this.health < 1) {
        this.health = Math.min(this.health + this.heal_rate * lapse * (1+health_regen_level), 1);
    }
};

Player.prototype.explode = function() {
    //create some goodies!
    var resource_count = Misc_math.random_number(2, 4);
    
    while (resource_count > 0) {
        var angle  = Math.random() * Math.PI * 2;
        var radius = Math.random() * this.radius * 2;
        Universe.objects.push(new Pickupable.Resource_item(
            Math.cos(angle) * radius + this.x,
            Math.sin(angle) * radius + this.y,
            Misc_math.random_number(0, 2), //au
            Misc_math.random_number(0, 3), //ag
            Misc_math.random_number(1, 5), //fe
            Misc_math.random_number(0, 1)  //si
        ));
        resource_count--;
    }
};

Player.prototype.get_total_upgrade_count = function()
{
    var count = 0;
    this.current_upgrades.forEach(upgrade => count += upgrade.count);
    return count;
};

//defunct, for now.
Player.prototype.create_upgrades = function() {
    return {
        
    };
};

Player.prototype.get_upgrade_count = function(name)
{
    var upgrade = this.current_upgrades.find(function(element){return element.name === name});
    if(upgrade) return upgrade.count;
    log(name + " as an upgrade does not exist.");
    // in case there are no upgrades of the same, return 0 to be sure that there is none of that name.
    return 0;
};

Player.prototype.get_upgrade_cost = function()
{
    // this is where the fun starts: FORMULAS!
    var cost = Math.round(this.upgrade_cost_factor * this.base_upgrade_cost * (Math.sqrt(this.get_total_upgrade_count()+1)));
    return cost;
};

Player.prototype.buy_upgrade = function(name)
{
	// check if in orbit first. ya can't cheat the system even if you know a bit of console js!
	if(!this.orbiting_planet) return false;
	
    // can't use arrow functions for some reason
    // checking to prevent client abuse bloody crashing the server
    var upgrade = this.current_upgrades.find(function(element){return element.name === name});
    if(!upgrade) return false;
    
    if(upgrade.count < upgrade.type.max)
    {
        var cost = this.get_upgrade_cost();
        if(this.resources >= cost)
        {
            this.resources -= cost;
            upgrade.count += 1;
            return true;
        }
    }
    return false;
};
/*
	Yes, you CAN upgrade down and there are no refunds!
 */
Player.prototype.buy_weapon = function(weapon_key)
{
	// check if in orbit first. ya can't cheat the system even if you know a bit of console js!
	if(!this.orbiting_planet) return false;
	
	var weapon = Weapons[weapon_key];
	var cost = weapon.price;
	if(this.resources >= cost)
	{
		this.resources -= cost;
		var slot = 0;
		if(weapon.slot === "secondary")
		{
			slot = 1;
		}
		this.set_weapon(slot, weapon);
		return true;
	}
	return false;
};

// remember that slot 0 is primary, 1 is secondary
Player.prototype.set_weapon = function(slot, weapon) {
    this.weapons[slot] = weapon;
};

Player.prototype.spawn = function() {
    var angle = Math.random() * 2 * Math.PI;
    
    this.x = Math.cos(angle) * this.orbiting_planet.radius * 1.5 + this.orbiting_planet.x;
    this.y = Math.sin(angle) * this.orbiting_planet.radius * 1.5 + this.orbiting_planet.y;
    
    this.angle = Math.random() * 2 * Math.PI;
    
    this.invulnerable = this.invulnerable_after_spawn;
    this.last_spawn   = 0;
    
    this.orbiting_planet = null;
        
    log(this.name + " has spawned at: " + Math.floor(this.x) + ", " + Math.floor(this.y));
    log(this.name + " is invulnerable for " + this.invulnerable + " ms.");
};

Player.prototype.enter_planet = function() {
    //HOW THIS WORKS:
    //[x] scan for closest planet
    //[x] if the distance to the planet is less than 1.5 times its radius, then enter planet and return success.
    //[x] otherwise, return failure, whatever that means.
    //[x] cooldown for orbiting 
    // return codes 
    // "success"
    // "too far"
    // "too soon" (cooldown not done)
    
    if (this.last_spawn >= this.orbit_cooldown) {
        var closest_planet = Universe.objects.filter((f) => {
            return f.orbitable;
        }).sort((a, b) => {
            return Misc_math.get_distance(this.x, this.y, a.x, a.y) - Misc_math.get_distance(this.x, this.y, b.x, b.y);
        })[0];
        
        if (Misc_math.get_distance(this.x, this.y, closest_planet.x, closest_planet.y) <= closest_planet.radius * 3) {
            //orbit success!
            this.orbiting_planet = closest_planet;
            return "success";
        } else {
            //orbit failed!
            return "too far";
        }
    } else {
        return "too soon";
    }
};

Player.prototype.give_resources = function(resources) {
    this.resources += resources;
    this.update_score("pick up resource", resources);
};

Player.prototype.points = {
    "kill": 1000,
    "destroy asteroid": 15,
    "pick up resource": 1,
};

Player.prototype.update_score = function(action, action_count = 1) {
    if (this.points.hasOwnProperty(action)) {
        this.score += this.points[action] * action_count;
    } else {
        log("unrecognized action: " + action);
    }
    
    Game_events.emit("score changed");
};

//module.exports = Player;

module.exports = function(default_orbiting_planet) {
    if (default_orbiting_planet.orbitable) {
        default_planet = default_orbiting_planet;
        return Player;
    } else {
        throw new Error("please provide an orbitable thing for players to orbit.");
    }
};
