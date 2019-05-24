var Misc_math = require("./misc_math.js");
var Universe  = require("./universe.js");
var Weapons   = require("./weapons.js");

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
    
    this.weapons = [Weapons["blaster"], Weapons["torpedo"]];

    //health related stuff
    this.health       = 1;
    this.last_damage  = 0;
    this.healing      = false;
    this.time_to_heal = 0;

    //ammo
    this.ammo                   = 1;
    this.last_fire              = 0;
    this.ammo_replenishing      = false;
    this.time_to_ammo_replenish = 0;

    //miscellaneous
    this.last_exhaust = 0;
    
    this.active = true;

    this.kills = 0; // stats!
}

Player.prototype.is_body = true;
Player.prototype.radius  = 7.5;

Player.prototype.engine_thrust  = 0.0005;
Player.prototype.deceleration   = 0.00125;
Player.prototype.rotation_speed = 0.003;

Player.prototype.exhaust_delay = 125; // 125 ms for each exhuast bubble

Player.prototype.ammo_replenish_delay   = 500; // 500 ms for ammo to start being replenished
Player.prototype.health_replenish_delay = 2000; // 2000 ms for health to start recovering

Player.prototype.ammo_replenish_rate = 0.0005;
Player.prototype.heal_rate           = 0.0000625;

Player.prototype.get_info = function() {
    return {
        name: this.name,
        id: this.id,
        colour: this.colour,
        x: this.x, y: this.y,
        health: this.health,
        ammo: this.ammo,
        angle: this.angle,
    };
};

Player.prototype.update = function(lapse) {
    if (this.health <= 0) {
        this.active = false;
    }
    
    //update the angle
    this.angle += (this.keys.left ? -this.rotation_speed * lapse : 0) + (this.keys.right ? this.rotation_speed * lapse : 0);

    //get the friction
    var friction = { x: -this.v.x * this.deceleration * lapse, y: -this.v.y * this.deceleration * lapse};
    //get the thrust
    var thrust = {
        x: this.keys.up ? Math.cos(this.angle) * this.engine_thrust * lapse : 0,
        y: this.keys.up ? Math.sin(this.angle) * this.engine_thrust * lapse : 0,
    };
    //...and now add them together!
    this.v.x += friction.x + thrust.x;
    this.v.y += friction.y + thrust.y;

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
    
    //if the thrust key is pressed, make a bubble.
    if (this.keys.up && this.last_exhaust >= this.exhaust_delay) {
        World.objects.push(new Bubble(this.x, this.y, this.angle + Math.PI, lighten_colour(this.colour)));
        this.last_exhaust = this.last_exhaust % this.exhaust_delay;
    }
    
    //more to come... see main.js, line 412.
};

Player.prototype.set_weapon = function(number, weapon) {
    this.weapons[number] = weapon;
};

module.exports = Player;