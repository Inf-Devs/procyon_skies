var Misc_math   = require(__dirname + "/misc_math.js");
var Universe    = require(__dirname + "/universe.js");
var Particles   = require(__dirname + "/particles.js");
var Weapons     = require(__dirname + "/weapons.js");
var Game_events = require(__dirname + "/events.js");
var Colours     = require(__dirname + "/colours.js");
var log         = require(__dirname + "/logging.js");
var Pickupable  = require(__dirname + "/pickupable.js");
var Resources   = require(__dirname + "/resources.js");

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
    this.active       = true;
    this.type         = "player";
    this.score        = 0; // stats!
    
    this.resources = Resources.get_resources();
}

Player.prototype.is_body = true;
Player.prototype.radius  = 7.5;

Player.prototype.engine_thrust  = 0.0005;
Player.prototype.rotation_speed = 0.003;

Player.prototype.exhaust_delay = 125; // 125 ms for each exhuast bubble

Player.prototype.invulnerable_after_spawn = 5000;

Player.prototype.ammo_replenish_delay = 500; // 500 ms for ammo to start being replenished
Player.prototype.heal_delay           = 2000; // 2000 ms for health to start recovering

Player.prototype.ammo_replenish_rate = 0.0005;
Player.prototype.heal_rate           = 0.0000625;

Player.prototype.get_info = function() {
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
        invinicible: (this.invulnerable > 0),
    };
};

Player.prototype.update = function(lapse) {
    //update the angle
    this.angle += (this.keys.left ? -this.rotation_speed * lapse : 0) + (this.keys.right ? this.rotation_speed * lapse : 0);

    //get the friction
    var friction = { x: -this.v.x * Universe.friction * lapse, y: -this.v.y * Universe.friction * lapse};
    //get the thrust
    var thrust = {
        x: this.keys.up ? Math.cos(this.angle) * this.engine_thrust * lapse : 0,
        y: this.keys.up ? Math.sin(this.angle) * this.engine_thrust * lapse : 0,
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
    this.invulnerable -= lapse;
    
    //safeguard
    this.invulnerable = Math.max(this.invulnerable, 0);
    
    //if the thrust key is pressed, make a bubble.
    if (this.keys.up && this.last_exhaust >= this.exhaust_delay) {
        Universe.objects.push(new Particles.Bubble(this.x, this.y, this.angle + Math.PI, Colours.lighten(this.colour)));
        this.last_exhaust = this.last_exhaust % this.exhaust_delay;
    }
    
    //dealing with ammo and weapons
    if (this.keys.weapon1 && this.ammo >= this.weapons[0].cost &&
        this.last_fire >= this.weapons[0].cooldown
    ) {
        this.ammo -= this.weapons[0].cost;
        this.weapons[0].fire(this.get_info());
        
        //log(this.name + " has fired weapon 0.");
        
        this.reset_ammo();
    }
    
    if (this.keys.weapon2 && this.ammo >= this.weapons[1].cost &&
        this.last_fire >= this.weapons[1].cooldown
    ) {
        this.ammo -= this.weapons[1].cost;
        this.weapons[1].fire(this.get_info());
        
        //log(this.name + " has fired weapon 1.");
        
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
        if (body === this || body.owner === this.id) return;
        
        var min_dist = this.radius + body.radius;
        var overlap  = min_dist - Misc_math.get_distance(this.x, this.y, body.x, body.y);

        if (overlap > 0) {
            //push it away
            var angle = Misc_math.get_angle(this, body) + Math.PI;
            this.x    = body.x + Math.cos(angle) * min_dist;
            this.y    = body.y + Math.sin(angle) * min_dist;

            this.v.x += Math.cos(angle) * (overlap * Universe.bounciness * 2);
            this.v.y += Math.sin(angle) * (overlap * Universe.bounciness * 2);
        }
    });
};

//helper functions
Player.prototype.reset_ammo = function() {
    this.last_fire = 0;
};

Player.prototype.replenish_ammo = function(lapse) {
    if (this.last_fire >= this.ammo_replenish_delay &&
        this.ammo < 1 && !this.keys.weapon1 && !this.keys.weapon2
    ) {
        this.ammo = Math.min(this.ammo + this.ammo_replenish_rate * lapse, 1);
    }
};

Player.prototype.do_damage = function(damage, owner) {
    if (this.invulnerable > 0) {
        //player invulnerable, ignore damage
        return;
    }
    
    this.health -= damage;
    
    if (this.health <= 0) {
        this.active = false;
        this.explode();
        
        Game_events.emit("kill", { killer: owner, victim: this.id });
    }
    
    this.last_damage = 0;
};

Player.prototype.heal = function(lapse) {
    if (this.last_damage > this.heal_delay && this.health < 1) {
        this.health = Math.min(this.health + this.heal_rate * lapse, 1);
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

Player.prototype.set_weapon = function(slot, weapon) {
    this.weapons[slot] = weapon;
};

Player.prototype.spawn = function(x, y, radius) {
    var angle = Math.random() * 2 * Math.PI;
    
    this.x = Math.cos(angle) * radius + x;
    this.y = Math.sin(angle) * radius + y;
    
    this.angle = Math.random() * 2 * Math.PI;
    
    this.invulnerable = this.invulnerable_after_spawn;
    
    log(this.name + " has spawned at: " + Math.floor(this.x) + ", " + Math.floor(this.y));
};

Player.prototype.give_resources = function(resources) {
	for(var key in resources)
	{
		this.resources[key].count += resources[key].count;
	}
    this.update_score("pick up resource");
};

Player.prototype.points = {
    "kill": 10,
    "destroy asteroid": 3,
    "pick up resource": 2,
};

Player.prototype.update_score = function(action) {
    if (this.points.hasOwnProperty(action)) {
        this.score += this.points[action];
    }
    
    Game_events.emit("score changed");
};

module.exports = Player;