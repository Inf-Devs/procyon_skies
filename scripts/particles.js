var Particles = module.exports = {};

//VARIOUS PARTICLES

// the bubble type, for the players' exhaust -----------------------------------
function Bubble(x, y, angle, colour) {
    this.x = x;
    this.y = y;

    this.angle  = (Math.random() * Math.PI / 6) + (angle - Math.PI / 12);
    this.colour = colour || { r: 255, g: 255, b: 255 };

    this.max_lifetime = Math.random() * 500 + 1500;
    this.lifetime     = 0;
    this.alpha        = 1; // dependent on lifetime
    this.active       = true;

    this.type = "bubble";
}

Bubble.prototype.speed  = 0.05;
Bubble.prototype.radius = 2;

Bubble.prototype.update = function(lapse) {
    this.lifetime += lapse;
    if (this.lifetime >= this.max_lifetime) { //its time is up...
        this.active = false;
        this.alpha  = 0;
        return;
    }

    this.x += Math.cos(this.angle) * this.speed * lapse;
    this.y += Math.sin(this.angle) * this.speed * lapse;

    this.alpha = Math.max(((this.max_lifetime - this.lifetime) / this.max_lifetime), 0);
};

Particles.Bubble = Bubble;

// a shrinking diamond ---------------------------------------------------------
function Shrinking_diamond(x, y, _, colour) {
    // _, where the angle would be, is ignored.
    var angle  = Math.random() * Math.PI * 2;
    var radius = Math.random() * 3;
    
    this.x = Math.cos(angle) * radius + x;
    this.y = Math.sin(angle) * radius + y;
    
    this.max_lifetime = Math.random() * 500 + 1500;
    
    this.lifetime = 0;
    this.active   = true;
    
    this.radius = Math.random() * 5;
    this.base_r = this.radius;
    this.colour = colour;
    
    this.type = "diamond";
}

Shrinking_diamond.prototype.update = function(lapse) {
    this.lifetime += lapse;
    
    if (this.lifetime >= this.max_lifetime) {
        //ITS TIME HAS COME!
        this.active = false;
        return;
    }
    
    this.radius = (1 - this.lifetime / this.max_lifetime) * this.base_r;
    this.radius = Math.max(this.radius, 0); //safety
};

Particles.Shrinking_diamond = Shrinking_diamond;

// EXPLOSIONS! -----------------------------------------------------------------
function Explosion(x, y, colour, owner, max_lifetime) {
    this.x = x;
    this.y = y;
    
    this.active   = true;
    this.lifetime = 0;
    this.owner    = owner;
    
    this.alpha  = 1;
    this.colour = colour || { r: 255, g: 255, b: 255 };
    
    this.radius = 0.01; //prevent any shenanigans with zero
    
    this.max_lifetime = (isNaN(max_lifetime) || max_lifetime < this.default_max_lifetime) ?
        this.default_max_lifetime : max_lifetime;
    this.fade_rate = (isNaN(max_lifetime) || max_lifetime < this.default_max_lifetime) ?
    this.default_fade_rate : 1 / max_lifetime;
    
    this.type = "explosion";
}

Explosion.prototype.default_max_lifetime = 250;

//for now, both linear
Explosion.prototype.expansion_rate    = 0.1;
Explosion.prototype.default_fade_rate = 1 / 250;
Explosion.prototype.is_body           = true;

Explosion.prototype.is_projectile = true;
Explosion.prototype.damage        = 0.75;

Explosion.prototype.update = function(lapse) {
    this.lifetime += lapse;
    if (this.lifetime >= this.max_lifetime) {
        this.active = false;
        return;
    }
    
    //update alpha...
    this.alpha = 1 - this.lifetime * this.fade_rate;
    // ...and radius
    this.radius = this.lifetime * this.expansion_rate;
};

Explosion.prototype.collision = function() {
    return this.damage;
};

Particles.Explosion = Explosion;