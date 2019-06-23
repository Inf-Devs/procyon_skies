//the camera
var Camera = {
    //things required for drawing on the screen are here

    objects: [],
    players: [],
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
                    break;
                case "sonic":
                    cxt.fillStyle = get_colour(f.colour, f.alpha);
                    cxt.beginPath();
                    cxt.arc(draw_x, draw_y, f.radius, 0, Math.PI * 2);
                    cxt.closePath();
                    cxt.fill();
                    break;
                case "asteroid":
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
                    cxt.fillStyle = "dodgerblue";
                    cxt.beginPath();
                    cxt.arc(draw_x, draw_y, f.radius, 0, Math.PI * 2);
                    cxt.closePath();
                    cxt.fill();

                    cxt.save();
                    cxt.translate(draw_x, draw_y);
                    cxt.rotate(-f.rotation);
                    var sprite;
                    if (f.name == "alpha") {
                        sprite = Sprites.planets.alpha;
                    } else if (f.name == "beta") {
                        sprite = Sprites.planets.beta;
                    }
                    cxt.drawImage(sprite, -32, -32);
                    cxt.restore();
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

        Info_display.draw_mini_map(1e4, 1e4, this.offset_x + this.width / 2, this.offset_y + this.height / 2, get_colour(Game.colour));
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

    draw_mini_map: function(map_width, map_height, x, y, colour) {
        this.mini_map_context.clearRect(0, 0, this.mini_map_width, this.mini_map_height);

        this.mini_map_context.fillStyle = colour;

        var draw_x = this.mini_map_width * (x / map_width);
        var draw_y = this.mini_map_height * (y / map_height);

        this.mini_map_context.beginPath();
        this.mini_map_context.arc(draw_x, draw_y, 3, 0, Math.PI * 2);
        this.mini_map_context.closePath();
        this.mini_map_context.fill();
    },

    draw_status: function(colour) {
        this.status_context.clearRect(0, 0, 150, 65);
        this.status_context.fillStyle = colour;

        this.status_context.save();

        //icons will be 25 by 25 pixels, with 5 pixels of padding between each.

        //draw a heart, for health
        this.status_context.translate(5, 5);
        this.status_context.beginPath();
        this.status_context.arc(6.25, 6.25, 6.25, -Math.PI, 0);
        this.status_context.arc(18.75, 6.25, 6.25, -Math.PI, 0);
        this.status_context.moveTo(25, 6.25);
        this.status_context.lineTo(12.5, 25);
        this.status_context.lineTo(0, 6.25);
        this.status_context.closePath();
        this.status_context.fill();

        //draw the health bar
        this.status_context.translate(30, 0);
        this.status_context.fillRect(0, 0, Math.max(this.health * 110, 0), 25);

        //draw some shells, for ammo
        this.status_context.translate(-30, 30);
        this.status_context.beginPath();
        this.status_context.moveTo(0, 3);
        this.status_context.lineTo(0, 24);
        this.status_context.lineTo(6, 24);
        this.status_context.lineTo(6, 3);
        this.status_context.lineTo(3, 0);
        this.status_context.moveTo(8, 3);
        this.status_context.lineTo(8, 24);
        this.status_context.lineTo(14, 24);
        this.status_context.lineTo(14, 3);
        this.status_context.lineTo(11, 0);
        this.status_context.moveTo(16, 3);
        this.status_context.lineTo(16, 24);
        this.status_context.lineTo(22, 24);
        this.status_context.lineTo(22, 3);
        this.status_context.lineTo(19, 0);
        this.status_context.closePath();
        this.status_context.fill();

        //draw the ammo bar
        this.status_context.translate(30, 0);
        this.status_context.fillRect(0, 0, this.ammo * 110, 25);

        this.status_context.restore();
    },
};

// upgrade handler 
var Upgrades_display = {
    panel: null,
    cost_display: null,
    upgrade_panels: {},
    
    current_upgrades: {},
    init: function(upgrades)
    {
        var current_upgrades = Upgrades_display.current_upgrades;
        var panel = Upgrades_display.panel = document.getElementById("upgrades_panel");
        var upgrade_panels = Upgrades_display.upgrade_panels;
        
        var cost_display = Upgrades_display.cost_display = document.createElement("div");
        cost_display.innerHTML = "<p>150 resources</p>";
        panel.appendChild(cost_display);
        
        upgrades.forEach(upgrade => 
            {
                current_upgrades[upgrade.name] = {count:0,max:upgrade.type.max}
                
                // set it all up for each row
                upgrade_panels[upgrade.name] = {panel:document.createElement("div")};
                upgrade_panels[upgrade.name].panel.innerHTML = "<p>"+ upgrade.name +"</p>";
                panel.appendChild(upgrade_panels[upgrade.name].panel);
                
                // now add in the upgrade fullness
                var upgrade_progress = upgrade_panels[upgrade.name].upgrade_progress = document.createElement("progress");
                upgrade_progress.setAttribute("value",0);
                upgrade_progress.setAttribute("max",upgrade.type.max);
                upgrade_panels[upgrade.name].panel.appendChild(upgrade_progress);
                // buttons
                var upgrade_button = upgrade_panels[upgrade.name].upgrade_button = document.createElement("button");
                upgrade_button.setAttribute("onClick", "Upgrades_display.send_buy_request('" + upgrade.name + "');"); // SUPER SKETCHY WAY TO DO THIS
                upgrade_button.innerHTML = "+";
                upgrade_button.style.borderColor = get_colour(Game.colour);
                upgrade_button.style.color       = get_colour(Game.colour);
                upgrade_panels[upgrade.name].panel.appendChild(upgrade_button);
            });
        
    },
    
    send_buy_request: function(name)
    {
        var upgrade = Upgrades_display.current_upgrades[name];
        // decrease clutter
        if(upgrade.count < upgrade.max)
        {
            send_ask("buy_upgrade",{upgrade_name:name});
        }
    },
    
    receive_buy_update: function(data)
    {
        Upgrades_display.current_upgrades[data.upgrade_bought].count += 1;
        Upgrades_display.upgrade_panels[data.upgrade_bought].upgrade_progress.setAttribute("value",Upgrades_display.current_upgrades[data.upgrade_bought].count);
        Upgrades_display.cost_display.innerHTML = "<p>" + data.next_upgrade_cost + " resources</p>";
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
    },
};
