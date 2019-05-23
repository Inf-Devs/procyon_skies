var Particles = module.exports = {};

//VARIOUS PARTICLES

// the bubble type, for the players' exhaust
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

Bubble.prototype.speed = 0.05;

Bubble.prototype.update = function(lapse) {
    this.lifetime += lapse;
    if (this.lifetime >= this.max_lifetime) { //its time is up...
        this.active = false;
        this.alpha  = 0;
        return;
    }

    this.x += Math.cos(this.angle) * this.speed * lapse;
    this.y += Math.sin(this.angle) * this.speed * lapse;

    this.alpha = (this.max_lifetime - this.lifetime) / this.max_lifetime;
};

Particles.Bubble = Bubble;