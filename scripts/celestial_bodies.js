var Players    = require(__dirname + "/players.js");
var Universe   = require(__dirname + "/universe.js");
var Pickupable = require(__dirname + "/pickupable.js");
var Resources  = require(__dirname + "/resources.js");
var Misc_math  = require(__dirname + "/misc_math.js");
var log        = require(__dirname + "/logging.js");

var Celestial_bodies = module.exports = {};

function Asteroid_rock(x, y, size) {
    this.x = x;
    this.y = y;

    var angle = Math.random() * Math.PI * 2;

    this.v = { x: Math.cos(angle), y: Math.sin(angle), };
    
    this.size   = (size < 0 || isNaN(size)) ? Math.floor(Math.random() * 4) : size;
    this.radius = this.radii[this.size];
    this.health = this.healths[this.size];
    this.active = true;
    this.type   = "asteroid";
    
    this.rotate_dir = Math.random() < 0.5 ? 1 : -1;
}

Asteroid_rock.prototype.radii   = [5, 8, 13, 21];
Asteroid_rock.prototype.healths = [0.6, 0.9, 1.3, 2.1];

Asteroid_rock.prototype.is_body = true;

Asteroid_rock.prototype.drift_speed  = 0.02;
Asteroid_rock.prototype.rotate_speed = 0.0003;

Asteroid_rock.prototype.freeze_radius = 1000;

Asteroid_rock.prototype.update = function(lapse) {
    //no need to update if no players nearby
    var closest = Players.get_closest(this.x, this.y);
    
    if (closest == undefined || Misc_math.get_distance(this.x, this.y, closest.x, closest.y) > this.freeze_radius) {
        return; //no need for update
    }
    
    //let it drift
    this.x += this.v.x * this.drift_speed * lapse;
    this.y += this.v.y * this.drift_speed * lapse;
    
    this.rotation += this.rot_dir * this.rotate_speed * lapse;
    
    //collision detection with projectiles
    Universe.projectiles.forEach((p) => {
        if (Misc_math.get_distance(this.x, this.y, p.x, p.y) < this.radius) {
            this.do_damage(p.collision(), p.owner);
        }
    });
    
    //collision detection with edge of map
    if ((this.x < this.radius && this.v.x < 0) || (this.x > Universe.width - this.radius && this.v.x > 0)) {
        this.v.x *= -1;
    }

    if ((this.y < this.radius && this.v.y < 0) || (this.y > Universe.height - this.radius && this.v.y > 0)) {
        this.v.y *= -1;
    }
    
    //collision detection with bodies
    Universe.bodies.forEach((body) => {
        if (body === this) return;

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

Asteroid_rock.prototype.do_damage = function(damage, owner) {
    this.health -= damage;
    
    if (this.health <= 0) {
        //explode
        this.explode();
        this.active = false;
        
        //reward the player who blasted this asteroid
        Players[owner].update_score("destroy asteroid");
    }
};

Asteroid_rock.prototype.explode = function() {
    //create two smaller asteroids...
    if (this.size > 0) {
        var new_size = this.size - 1;
        Universe.objects.push(new Asteroid_rock(this.x + this.radius, this.y + this.radius, new_size));
        Universe.objects.push(new Asteroid_rock(this.x - this.radius, this.y - this.radius, new_size));
    }
    
    //create some goodies!
    var resource_count = Misc_math.random_number(Math.ceil(this.radius / 3), this.radius);
    
    while (resource_count > 0) {
        var angle  = Math.random() * Math.PI * 2;
        var radius = Math.random() * this.radius * 2;
		
		var resources = Resources.get_resources();
		resources["au"].count = Misc_math.random_number(0, 2);
		resources["ag"].count = Misc_math.random_number(0, 3);
		resources["fe"].count = Misc_math.random_number(1, 5);
		resources["si"].count = Misc_math.random_number(0, 1);
		
        Universe.objects.push(new Pickupable.Resource_item(
            Math.cos(angle) * radius + this.x,
            Math.sin(angle) * radius + this.y,
            resources
        ));
        resource_count--;
    }
};

Celestial_bodies.Asteroid_rock = Asteroid_rock;

function create_spawn_asteroid(star, inner, outer, limit) {
    var x = star.x, y = star.y;
    
    return function() {
        if (Universe.get_all_of_type("asteroid").length >= limit || Players.count == 0) {
            return;
        }
        
        var spawn_radius = Misc_math.random_number(inner, outer);
        var spawn_angle  = Math.random() * Math.PI * 2;
        
        var spawn_x = Math.floor(Math.cos(spawn_angle) * spawn_radius + x);
        var spawn_y = Math.floor(Math.sin(spawn_angle) * spawn_radius + y);
        
        Universe.objects.push(new Asteroid_rock(spawn_x, spawn_y));
        
        log("asteroid has spawned at " + spawn_x + ", " + spawn_y + ".", "info");
    }
}

Celestial_bodies.spawn_asteroid = create_spawn_asteroid;

//PLANET --------------------------------------------------------------
function Planet(star, orbit_radius, name, radius) {
    this.parent_star = star;
    
    this.x = 0;
    this.y = 0;
    
    this.name = name;
    this.type = "planet";
    
    this.orbit_radius = orbit_radius;
    this.radius       = (isNaN(radius) || radius <= 0) ? 32 : radius;
    
    this.angle = Math.random() * Math.PI * 2;
    
    this.active = true;
    
    this.update(0);
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
        if (Misc_math.get_distance(this.x, this.y, p.x, p.y) < this.radius) {
            p.collision();
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
        if (Misc_math.get_distance(this.x, this.y, p.x, p.y) < this.radius) {
            p.collision();
        }
    });
};

Celestial_bodies.Star = Star;