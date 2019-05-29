var Players    = require(__dirname + "/players.js");
var Universe   = require(__dirname + "/universe.js");
var Pickupable = require(__dirname + "/pickupable.js");

var Celestial_bodies = module.exports = {};

function Asteroid(x, y, size) {
    this.x = x;
    this.y = y;
    
    this.size   = (size < 0) ? Math.floor(Math.random() * 4) : size;
    this.radius = this.radii[this.size];
    this.health = this.healths[this.size];
    this.active = true;
    this.type   = "asteroid";
    
    this.rotate_dir = Math.random() < 0.5 ? 1 : -1;
}

Asteroid.prototype.radii   = [5, 8, 13, 21];
Asteroid.prototype.healths = [0.6, 0.9, 1.3, 2.1];

Asteroid.prototype.drift_speed  = 0.2;
Asteroid.prototype.rotate_speed = 0.0003;

Asteroid.prototype.update = function(lapse) {
    
};

Asteroid.prototype.take_damage = function(damage, owner) {
    
};

Asteroid.prototype.explode = function() {
    
};

Celestial_bodies.Asteroid = Asteroid;

//PLANET --------------------------------------------------------------
function Planet(star, orbit_radius, name, radius) {
    this.parent_star = star;
    
    this.name = name;
    this.type = "planet";
    
    this.orbit_radius = orbit_radius;
    this.radius       = (isNaN(radius) || radius <= 0) ? 32 : radius;
    
    this.rotation = Math.random() * Math.PI * 2;
};

Planet.prototype.is_body = true;
Planet.prototype.radius  = 32;

Planet.prototype.orbit_speed    = 0.03;
Planet.prototype.rotation_speed = 0.00015;

Planet.prototype.update = function(lapse) {
    //FORMULA: arc length / radius = angle
    var arc = lapse * this.orbit_speed;

    this.angle += arc / this.orbit_radius;

    this.x = Math.cos(this.angle) * this.orbit_radius + this.parent_star.x;
    this.y = Math.sin(this.angle) * this.orbit_radius + this.parent_star.y;

    this.rotation += this.rotation_speed * lapse;

    //collision
    Universe.objects.filter((f) => {
        return f.is_projectile;
    }).forEach((p) => {
        if (get_distance(this.x, this.y, p.x, p.y) < this.radius) {
            p.collision()
        }
    });
};

Celestial_bodies.Planet = Planet;

//STAR ----------------------------------------------------------------
function Star(name, x, y) {
    this.name   = name;
    this.type   = "star";
    this.active = true;
    this.radius = 125;

    this.x = x;
    this.y = y;
}

Star.prototype.is_body = true;
Star.prototype.radius  = 125;

Star.prototype.update = function(lapse) {
    //don't do anything, really.

    //except check for collision
    Universe.objects.filter((f) => {
        return f.is_projectile;
    }).forEach((p) => {
        if (get_distance(this.x, this.y, p.x, p.y) < this.radius) {
            p.collision();
        }
    });
};

Celestial_bodies.Star = Star;