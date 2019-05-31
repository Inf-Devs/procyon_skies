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

// EXPLOSIONS! -----------------------------------------------------------------
function Explosion(x, y, colour, owner) {
    this.x = x;
    this.y = y;
    
    this.active   = true;
    this.lifetime = 0;
    this.owner    = owner;
    
    this.alpha  = 1;
    this.colour = colour || { r: 255, g: 255, b: 255 };
    
    this.radius = 0.01; //prevent any shenanigans with zero
    
    this.type = "explosion";
}

Explosion.prototype.max_lifetime = 250;

//for now, both linear
Explosion.prototype.expansion_rate = 0.1;
Explosion.prototype.fade_rate      = 1 / 250;
Explosion.prototype.is_body        = true;

Explosion.prototype.is_projectile = true;
Explosion.prototype.damage        = 0.5;

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