var Players  = require(__dirname + "/players.js");
var Universe = require(__dirname + "/universe.js");

var Celestial_bodies = module.exports = {};

function Asteroid(x, y, size) {
    this.x = x;
    this.y = y;
    
    this.size   = (size < 0) ? Math.floor(Math.random() * 4) : size;
    this.radius = this.radii[this.size];
    this.health = this.healths[this.size];
    this.active = true;
    this.type   = "asteroid";
}

Asteroid.prototype.radii   = [5, 8, 13, 21];
Asteroid.prototype.healths = [0.6, 0.9, 1.3, 2.1];

Asteroid.prototype.drift_speed  = 0.2;
Asteroid.prototype.rotate_speed = 0.0003;

Asteroid.prototype.update = function(lapse) {
    
};

Asteroid.prototype.take_damage = function(damage, owner) {
    
};