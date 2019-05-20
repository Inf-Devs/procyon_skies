var Misc_math = require("./misc_math.js");

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

    //health related stuff
    this.health       = 1;
    this.last_damage  = 0;
    this.healing      = false;
    this.time_to_heal = 0;

    //ammo
    this.ammo                   = 1;
    this.last_weapon            = 0;
    this.ammo_replenishing      = false;
    this.time_to_ammo_replenish = 0;

    //miscellaneous
    this.last_exhaust = 0;

    this.kills = 0; // stats!
}

Player.prototype.is_body = true;
Player.prototype.radius  = 7.5;

Player.prototype.engine_thrust  = 0.0005;
Player.prototype.deceleration   = 0.00125;
Player.prototype.rotation_speed = 0.003;

Player.prototype.exhaust_delay  = 125; // 125 ms for each exhuast bubble

Player.prototype.ammo_replenish_delay   = 500; // 500 ms for ammo to start being replenished
Player.prototype.health_replenish_delay = 2000; // 2000 ms for health to start recovering

Player.prototype.ammo_replenish_rate = 0.0005;
Player.prototype.heal_rate           = 0.0000625;

Player.prototype.blaster_cost = 0.05;
Player.prototype.torpedo_cost = 0.3;

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

};

module.exports = Player;