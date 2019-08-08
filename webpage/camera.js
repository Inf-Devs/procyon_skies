//the camera
var Camera = {
    //things required for drawing on the screen are here

    objects: [],
    players: [],
    minimap_objects: [],
    width: null,
    height: null,
    offset_x: null,
    offset_y: null,

    line_spacing: 25,
    line_width: 1,
    line_colour: "#222222",

    draw_frame: function(cxt) {
        cxt.clearRect(0, 0, this.width, this.height);

        //draw the gridlines
        var x_line_offset = this.line_spacing - (this.offset_x % this.line_spacing);
        var y_line_offset = this.line_spacing - (this.offset_y % this.line_spacing);
        cxt.strokeStyle   = this.line_colour;
        cxt.lineWidth     = this.line_width;

        for (var a = x_line_offset; a <= this.width; a += this.line_spacing) {
            cxt.beginPath();
            cxt.moveTo(a, 0);
            cxt.lineTo(a, this.height);
            cxt.closePath();
            cxt.stroke();
        }

        for (var b = y_line_offset; b <= this.height; b += this.line_spacing) {
            cxt.beginPath();
            cxt.moveTo(0, b);
            cxt.lineTo(this.width, b);
            cxt.closePath();
            cxt.stroke();
        }

        //draw each object
        this.objects.forEach((f) => {
            //get the offset
            var draw_x = f.x - this.offset_x;
            var draw_y = f.y - this.offset_y;

            switch (f.type) {
                case "bubble":
                    //draw a circle
                    cxt.fillStyle = get_colour(f.colour, f.alpha);
                    cxt.beginPath();
                    cxt.arc(draw_x, draw_y, 2, 0, Math.PI * 2);
                    cxt.closePath();
                    cxt.fill();
                    break;
                case "diamond":
                    cxt.fillStyle = get_colour(f.colour);
                    cxt.save();
                    cxt.translate(draw_x, draw_y);
                    cxt.beginPath();
                    cxt.moveTo(0, f.radius);
                    cxt.lineTo(f.radius, 0);
                    cxt.lineTo(0, -f.radius);
                    cxt.lineTo(-f.radius, 0);
                    cxt.lineTo(0, f.radius);
                    cxt.closePath();
                    cxt.fill();
                    cxt.restore();
                    break;
                case "explosion":
                    //draw a circle
                    cxt.fillStyle = get_colour(f.colour, f.alpha);
                    cxt.beginPath();
                    cxt.arc(draw_x, draw_y, f.radius, 0, Math.PI * 2);
                    cxt.closePath();
                    cxt.fill();
                    break;
                case "blaster bullet":
                    //draw a laser beam!
                    cxt.strokeStyle = get_colour(f.colour);
                    cxt.lineWidth   = 2;
                    cxt.beginPath();
                    cxt.moveTo(draw_x, draw_y);
                    cxt.lineTo(Math.cos(f.angle) * 5 + draw_x, Math.sin(f.angle) * 5 + draw_y);
                    cxt.closePath();
                    cxt.stroke();
                    break;
                case "rocket":
                    cxt.fillStyle = get_colour(f.colour);
                    cxt.save();
                    cxt.translate(draw_x, draw_y);
                    cxt.rotate(f.angle);
                    cxt.beginPath();
                    cxt.moveTo(0, 0);
                    cxt.lineTo(-3, -3);
                    cxt.lineTo(0, -3);
                    cxt.lineTo(3, 0);
                    cxt.lineTo(0, 3);
                    cxt.lineTo(-3, 3);
                    cxt.closePath();
                    cxt.fill();
                    cxt.restore();
                    break;
                case "grenade":
                    cxt.fillStyle = get_colour(f.colour);
                    cxt.beginPath();
                    cxt.moveTo(draw_x, draw_y);
                    cxt.arc(draw_x, draw_y, 3.5, Math.PI / 24, 11 * Math.PI / 24);
                    cxt.lineTo(draw_x, draw_y);
                    cxt.arc(draw_x, draw_y, 3.5, 13 * Math.PI / 24, 23 * Math.PI / 24);
                    cxt.lineTo(draw_x, draw_y);
                    cxt.arc(draw_x, draw_y, 3.5, 25 * Math.PI / 24, 35 * Math.PI / 24);
                    cxt.lineTo(draw_x, draw_y);
                    cxt.arc(draw_x, draw_y, 3.5, 37 * Math.PI / 24, 47 * Math.PI / 24);
                    cxt.lineTo(draw_x, draw_y);
                    cxt.closePath();
                    cxt.fill();
                    break;
                case "sonic":
                    cxt.fillStyle = get_colour(f.colour, f.alpha);
                    cxt.beginPath();
                    cxt.arc(draw_x, draw_y, f.radius, 0, Math.PI * 2);
                    cxt.closePath();
                    cxt.fill();
                    break;
                case "asteroid":

                    //yo dawg ya don' evin need cases in this case.
                    if (f.health < f.max_health) {
                        cxt.fillStyle = "slategray";
                        var bar_width = (f.health / f.max_health) * f.radius * 2;
                        cxt.fillRect(draw_x - f.radius, draw_y - f.radius - 5, bar_width, 2.5);
                    }

                    cxt.save();
                    cxt.translate(draw_x, draw_y);
                    cxt.rotate(-f.rotation);
                    if (f.radius == 5) {
                        cxt.drawImage(Sprites.rocks.small, -5, -5);
                    } else if (f.radius == 8) {
                        cxt.drawImage(Sprites.rocks.medium, -8, -8);
                    } else if (f.radius == 13) {
                        cxt.drawImage(Sprites.rocks.large, -13, -13);
                    } else if (f.radius == 21) {
                        cxt.drawImage(Sprites.rocks.enormous, -21, -21);
                    }
                    cxt.restore();
                    break;
                case "resource":
                    if (!f.visible) return;
                    cxt.fillStyle = get_colour(Game.colour);
                    cxt.save();
                    cxt.translate(draw_x, draw_y);
                    cxt.scale(Math.cos(f.rotation), 1); //BLING BLING BLING
                    cxt.beginPath();
                    cxt.moveTo(1, 0);
                    cxt.lineTo(4, 3);
                    cxt.lineTo(7, 0);
                    cxt.lineTo(4, -3);
                    cxt.moveTo(-1, 0);
                    cxt.lineTo(-4, 3);
                    cxt.lineTo(-7, 0);
                    cxt.lineTo(-4, -3);
                    cxt.moveTo(3, -5);
                    cxt.lineTo(0, -2);
                    cxt.lineTo(-3, -5);
                    cxt.lineTo(0, -8);
                    cxt.closePath();
                    cxt.fill();
                    cxt.restore();
                    break;
                case "planet":
                    cxt.save();
                    cxt.translate(draw_x, draw_y);
                    cxt.rotate(-f.rotation);
                    var sprite = Sprites.planets[f.kind];
                    cxt.drawImage(sprite, -32, -32);
                    cxt.restore();
                    
                    //draw the planet's name
                    
                    break;
                case "star":
                    cxt.fillStyle = "orangeRed";
                    cxt.save();
                    cxt.translate(draw_x, draw_y);
                    cxt.beginPath();
                    cxt.moveTo(f.points[0].x, f.points[0].y);
                    f.points.forEach((g) => {
                        var x = Math.cos(g.angle - Math.PI / 4) * f.radius;
                        var y = Math.sin(g.angle - Math.PI / 4) * f.radius;
                        cxt.quadraticCurveTo(x, y, g.x, g.y);
                    });
                    cxt.closePath();
                    cxt.fill();
                    cxt.restore();

                    cxt.fillStyle = "orange";
                    cxt.beginPath();
                    cxt.arc(draw_x, draw_y, f.radius, 0, Math.PI * 2);
                    cxt.closePath();
                    cxt.fill();
                    break;
                default:
                    log("unrecognized type: " + f.type);
                //what else?
            }
        });

        this.players.forEach((p) => {
            //get the offset
            var draw_x = p.x - this.offset_x;
            var draw_y = p.y - this.offset_y;

            cxt.fillStyle = get_colour(p.colour);
            //write their name first
            cxt.font = "14pt VT323";
            //at 14pt, VT323 is about 7.5 by 14 pixels (it's a monospace font)
            cxt.textAlign = "center";
            cxt.fillText(p.name, draw_x, draw_y - 29);
            //draw their health bar
            cxt.fillRect(draw_x - 15, draw_y - 20, p.health * 30, 5);
            cxt.save();
            cxt.translate(draw_x, draw_y);
            cxt.rotate(p.angle);
            cxt.beginPath();
            cxt.moveTo(0, 0); cxt.lineTo(-5, 5); cxt.lineTo(10, 0); cxt.lineTo(-5, -5); cxt.lineTo(0, 0);
            cxt.closePath();
            cxt.fill();

            if (p.invincible) {
                //a small bubble shield to show that
                cxt.fillStyle   = get_colour(p.colour, 0.3);
                cxt.strokeStyle = get_colour(p.colour);
                cxt.lineWidth   = 2;
                cxt.beginPath();
                cxt.arc(0, 0, 15, 0, Math.PI * 2);
                cxt.closePath();
                cxt.fill();
                cxt.stroke();
            }

            cxt.restore();
        });

        var angle = Game.player == null ? 0 : Game.player.angle;
        Info_display.draw_mini_map(1e4, 1e4, this.offset_x + this.width / 2, this.offset_y + this.height / 2, get_colour(Game.colour), angle);
        Info_display.draw_status(get_colour(Game.colour));
    },

    resize: function() {
        this.width  = canvas.width;
        this.height = canvas.height;
    },
};

//for player's state, such as a minimap, ammo, health, etc.
var Info_display = {
    //minimap stuff
    mini_map_canvas: null,
    mini_map_context: null,
    mini_map_width: null,
    mini_map_height: null,

    status_canvas: null,
    status_context: null,

    ammo: null,
    health: null,

    init: function(mini_map_canvas, status_canvas) {
        this.mini_map_canvas   = mini_map_canvas;
        mini_map_canvas.width  = 150;
        mini_map_canvas.height = 150;
        this.mini_map_context  = this.mini_map_canvas.getContext("2d");
        this.resize_mini_map();

        this.status_canvas        = status_canvas;
        this.status_canvas.height = 65;
        this.status_canvas.width  = 150;
        this.status_context       = this.status_canvas.getContext("2d");
    },

    resize_mini_map: function() {
        this.mini_map_width  = this.mini_map_canvas.width;
        this.mini_map_height = this.mini_map_canvas.height;
    },

    draw_mini_map: function(map_width, map_height, x, y, colour, angle) {
        this.mini_map_context.clearRect(0, 0, this.mini_map_width, this.mini_map_height);

        this.mini_map_context.fillStyle = colour;

        var draw_x = this.mini_map_width * (x / map_width);
        var draw_y = this.mini_map_height * (y / map_height);

        this.mini_map_context.beginPath();
        //this.mini_map_context.arc(draw_x, draw_y, 3, 0, Math.PI * 2);
        this.mini_map_context.moveTo(Math.cos(angle) * 6 + draw_x, Math.sin(angle) * 4 + draw_y);
        this.mini_map_context.lineTo(Math.cos(angle + Math.PI * 3 / 4) * 3 + draw_x, Math.sin(angle + Math.PI * 3 / 4) * 3 + draw_y);
        this.mini_map_context.lineTo(Math.cos(angle - Math.PI * 3 / 4) * 3 + draw_x, Math.sin(angle - Math.PI * 3 / 4) * 3 + draw_y);
        this.mini_map_context.closePath();
        this.mini_map_context.fill();

        Camera.minimap_objects.forEach((obj) => {
            this.mini_map_context.fillStyle = get_colour(obj.colour);
            this.mini_map_context.beginPath();
            this.mini_map_context.arc(this.mini_map_width * obj.x, this.mini_map_height * obj.y, 1.5, 0, Math.PI * 2);
            this.mini_map_context.closePath();
            this.mini_map_context.fill();
        });
    },

    draw_status: function(colour) {
        this.status_context.clearRect(0, 0, 150, 65);
        this.status_context.fillStyle = colour;

        this.status_context.save();

        //icons will have 5 pixels of padding between each.

        //draw a heart, for health
		this.status_context.translate(5,5);
		CanvasDrawings.heart(this.status_context);

        //draw the health bar
        this.status_context.translate(30, 0);
        this.status_context.fillRect(0, 0, Math.max(this.health * 110, 0), 25);

        //draw some shells, for ammo
		this.status_context.translate(-30, 30);
		CanvasDrawings.ammo(this.status_context);

        //draw the ammo bar
        this.status_context.translate(30, 0);
        this.status_context.fillRect(0, 0, this.ammo * 110, 25);

        this.status_context.restore();
    },
};

// reusable drawings!
// use translate in order to place the drawings.
var CanvasDrawings = {

	// icons will be 25 by 25 pixels
	ammo: function(context)
	{
        context.beginPath();

        context.moveTo(0, 3);
        context.lineTo(0, 24);
        context.lineTo(6, 24);
        context.lineTo(6, 3);
        context.lineTo(3, 0);

        context.moveTo(8, 3);
        context.lineTo(8, 24);
        context.lineTo(14, 24);
        context.lineTo(14, 3);
        context.lineTo(11, 0);

        context.moveTo(16, 3);
        context.lineTo(16, 24);
        context.lineTo(22, 24);
        context.lineTo(22, 3);
        context.lineTo(19, 0);

        context.closePath();
        context.fill();
	},
	// icons will be 25 by 25 pixels
	heart: function(context)
	{
		context.beginPath();
        context.arc(6.25, 6.25, 6.25, -Math.PI, 0);
        context.arc(18.75, 6.25, 6.25, -Math.PI, 0);
        context.moveTo(25, 6.25);
        context.lineTo(12.5, 25);
        context.lineTo(0, 6.25);
        context.closePath();
        context.fill();
	}
};


// images
var Sprites = {
    rocks: {
        small: get_sprite("rock_small.png"),
        medium: get_sprite("rock_medium.png"),
        large: get_sprite("rock_large.png"),
        enormous: get_sprite("rock_enormous.png"),
    },

    planets: {
        alpha: get_sprite("planet_alpha.png"),
        beta: get_sprite("planet_beta.png"),
        "blue gas giant": get_sprite("planet_blue_gas_giant.png"),
        "red gas giant": get_sprite("planet_red_gas_giant.png"),
        "blue icy": get_sprite("planet_blue_icy.png"),
        "yellow icy": get_sprite("planet_yellow_icy.png"),
        "grey_rocky": get_sprite("planet_grey_rocky.png"),
        "green rocky": get_sprite("planet_green_rocky.png"),
    },
};

function get_colour(c, alpha) {
    if (!isNaN(alpha) && alpha >= 0) {
        return "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + alpha + ")";
    } else {
        return "rgb(" + c.r + ", " + c.g + ", " + c.b + ")";
    }
}

function get_sprite(name) {
    var img = document.createElement("img");
    img.src = "sprites/" + name;
    return img;
}
