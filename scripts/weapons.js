var Universe  = require("./universe.js");
var Particles = require("./particles.js");
var Colours   = require("./colours.js");

//some constants
var player_radius = 8.5;

var Weapons = {
    /*
        *** DO NOT REMOVE ***
        needed info for each weapon:
        [ ] a function for firing
        [ ] cooldown (in milliseconds)
        [ ] name
        [ ] cost
        
        *** (incomplete) EXAMPLES BELOW ***
    */
    
    "torpedo": {
        name: "torpedo",
        cost: 0.4,
        cooldown: 1000,
        fire: function(p) {
            //launch a new rocket
            var fire_x = get_fire_coordinates(p.x, p.y, p.angle, player_radius).x;
            var fire_y = get_fire_coordinates(p.x, p.y, p.angle, player_radius).y;
            
            Universe.objects.push(new Torpedo_rocket(fire_x, fire_y, p.angle,
                Colours.lighten(p.colour), p.id
            ));
        },
    },
    
    "blaster": {
        name: "blaster",
        cost: 0.05,
        cooldown: 250,
        fire: function(p) {
            //launch one blaster bullet
            var fire_x = get_fire_coordinates(p.x, p.y, p.angle, player_radius).x;
            var fire_y = get_fire_coordinates(p.x, p.y, p.angle, player_radius).y;
            
            Universe.objects.push(new Blaster_bullet(fire_x, fire_y, p.angle,
                Colours.lighten(p.colour), p.id
            ));
        },
    },
    
    "twin blaster": {
        name: "twin blaster",
        cost: 0.07,
        cooldown: 300,
        fire: function(p) {
            //launch two blaster bullets, 30 degrees apart
            var a1 = p.angle + Math.PI / 24, a2 = p.angle - Math.PI / 24;
            
            var fire_x1 = get_fire_coordinates(p.x, p.y, a1, player_radius).x;
            var fire_y1 = get_fire_coordinates(p.x, p.y, a1, player_radius).y;
            
            var fire_x2 = get_fire_coordinates(p.x, p.y, a2, player_radius).x;
            var fire_y2 = get_fire_coordinates(p.x, p.y, a2, player_radius).y;
            
            Universe.objects.push(new Blaster_bullet(fire_x1, fire_y1, p.angle,
                Colours.lighten(p.colour), p.id
            ));
            
            Universe.objects.push(new Blaster_bullet(fire_x2, fire_y2, p.angle,
                Colours.lighten(p.colour), p.id
            ));
            
            //easy. just copy and paste from above! that's how coding is done, y'all!
        },
    },
    
    "grenade": {
        name: "grenade",
        cost: 0.3,
        cooldown: 1500,
        fire: function(p) {
            //my new secret weapon...
        },
    },
};

function get_fire_coordinates(pos, angle, radius) {
    return {
        x: Math.cos(angle) * radius + pos.x,
        y: Math.sin(angle) * radius + pos.y,
    };
}

//various projectiles =================================================

//the blaster type, for the players' blasters! ------------------------
function Blaster_bullet(x, y, angle, colour, owner) {
    this.x = x;
    this.y = y;

    this.angle    = angle;
    this.colour   = colour || { r: 255, g: 255, b: 255 };
    this.active   = true;
    this.lifetime = 0;
    this.owner    = owner;

    this.type = "blaster bullet";
}

Blaster_bullet.prototype.speed  = 0.4;
Blaster_bullet.prototype.damage = 0.1;

Blaster_bullet.prototype.max_lifetime  = 1500;
Blaster_bullet.prototype.is_projectile = true;

Blaster_bullet.prototype.is_body = true;
Blaster_bullet.prototype.radius  = 0.05;

Blaster_bullet.prototype.update = function(lapse) {
    this.lifetime += lapse;
    if (this.lifetime >= this.max_lifetime) {
        this.active = false;
        return;
    }

    this.x += this.speed * Math.cos(this.angle) * lapse;
    this.y += this.speed * Math.sin(this.angle) * lapse;
};

Blaster_bullet.prototype.collision = function() {
    this.active = false;
    return this.damage;
};

// the torpedo type, for the players' torpedos! ----------------------
function Torpedo_rocket(x, y, angle, colour, owner) {
    this.colour = colour || {r: 255, g: 255, b: 255};
    this.angle  = angle;

    this.x = x; this.y = y;

    this.active = true;
    this.type   = "rocket";
    this.owner  = owner;

    this.last_exhaust = 0;
}

Torpedo_rocket.prototype.speed  = 0.6;
Torpedo_rocket.prototype.damage = 0.6;

Torpedo_rocket.prototype.is_body = true;
Torpedo_rocket.prototype.radius  = 0.3;

Torpedo_rocket.prototype.is_projectile = true;
Torpedo_rocket.prototype.exhaust_delay = 125;

Torpedo_rocket.prototype.update = function(lapse) {
    //update the position
    this.x += Math.cos(this.angle) * lapse * this.speed;
    this.y += Math.sin(this.angle) * lapse * this.speed;

    //exhaust, since we don't have to care about pollution.
    this.last_exhaust += lapse;

    if (this.last_exhaust >= this.exhaust_delay) {
        Universe.objects.push(new Particles.Bubble(this.x, this.y, this.angle + Math.PI, Colours.lighten(this.colour)));
        this.last_exhaust = this.last_exhaust % this.exhaust_delay;
    }

    //add detection for colliding with the edge of the map
    if (this.x > Universe.width || this.y > Universe.height || this.x < 0 || this.y < 0) {
        this.collision();
    }
};

Torpedo_rocket.prototype.collision = function() {
    this.active = false;
    Universe.objects.push(new Particles.Explosion(this.x, this.y, this.colour));
    
    return this.damage;
};