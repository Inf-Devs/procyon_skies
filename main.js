//it didn't crash immediately. phew.
//i'm going to be running this on my 5.5 year old laptop.
// 6 gb ram, amd 4400m. wish me luck!
var express = require("express");
var app     = express();
var http    = require("http");
var server  = http.createServer(app);
var event   = require("events");

server.listen(3000, function() {
    log("==== NEW SERVER SESSION ====");
    log("http server listening on port 3000.", "notification");
});

var io = require("socket.io").listen(server);

//set up express resources
app.use(express.static(__dirname + "/webpage"));

//express app
app.get('/', function(req, res) {
    log("incoming connection from: " + (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress), "notification");
    res.sendFile(__dirname + "/webpage/index.html");
});

//POST, after a new player enters their name
//again, courtesy of stack overflow. that's how coding is done!
app.post('/', function(req, res) {
    var body = '';

    req.on('data', function(data) {
        body += data;

        // Too much POST data, kill the connection!
        if (body.length > 1e6)
            req.connection.destroy();
    });

    req.on('end', function() {
        var colour = random_colour();
        var name   = body.trim();
        var id     = randomHexString(6);
        
        log("post request from: " + (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress) + ", with name: " + name, "notification");
        
        //respond, too, telling the user their colour
        res.status(200);
        res.send({colour: colour, name: name, id: id});
        res.end();
    });
});

//the socket part
io.on("connection", function(socket) {
    var player = null;
    var id     = null;
    
    var last_update = null;
    //state change event
    socket.on("client_update", function(data) {
        if (last_update != null && last_update > data.time) {
            return; //update not required, since we already got a newer one
        }
        if (player == null) {
            id     = data.id;
            player = new Player(data.name, data.colour, id);
            Players.add(player, id);
            log("new player => name: " + player.name + ", id: " + data.id + ", colour: " + JSON.stringify(player.colour), "info");
            player.spawn();
        }
        
        player.keys = data.keys;
        
        //time, for updating purposes.
        var time = new Date().getTime();
        
        var p_x = player.x - (data.viewport.width / 2);
        var p_y = player.y - (data.viewport.height / 2);
        var p_w = data.viewport.width;
        var p_h = data.viewport.height;
        
        //figure out how to get and send some data back to the player
        //data to send:
        //    [x] visible objects
        //    [x] visible players (incl. their usernames)
        //    [x] the time
        //    [x] the player's x and y
        //    [x] the player's viewport's offset
        socket.emit("server_update", {
            player: player,
            objects: World.get_in_view(p_x, p_y, p_w, p_h),
            players: Players.get_visible_players(p_x, p_y, p_w, p_h),
            time: time,
            offset: { x: p_x, y: p_y, },
            health: player.health,
            ammo: player.ammo,
        });
    });
    
    var kill_event_listener = function(data) {
        if (data.killer == id) {
            //player killed someone! congrats!
            socket.emit("notification", "you have killed " + Players.get_player(data.victim).name);
            socket.emit("kill");
        }
        
        if (data.victim == id) {
            //player got killed! gotta warn them!
            socket.emit("notification", "you have been killed by " + Players.get_player(data.killer).name);
            socket.emit("death");
        }
    }
    
    //when a player leaves
    socket.on("disconnect", function() {
        if (player != null) {
            io.emit("notification", player.name + " has disconnected.");
            log(player.name + ", " + id + " has disconnected.", "info");
            Players.remove_player(id);
            
            Game_events.removeListener("kill", kill_event_listener);
        }
    });
    
    Game_events.on("kill", kill_event_listener);
});

//to keep track of players
var Players = {
    add: function(player, id) {
        Players[id] = player;
        Players.count++;
    },
    
    get_player: function(id) {
        return Players[id];
    },
    
    remove_player: function(id) {
        delete Players[id];
        Players.count--;
    },
    
    get all_player_ids() {
        return Object.getOwnPropertyNames(this).filter((r) => {
            return r.length == 6;
        });
    },
    
    get_visible_players: function(x, y, w, h) {
        var visible = [];
        this.all_player_ids.forEach((id) => {
            var p = Players[id];
            if (p.x > x && p.y > y && p.x < x + w && p.y < y + h && p.health > 0) {
                //send a watered-down version, since the client doesn't need everything
                visible.push({
                    x: p.x,
                    y: p.y,
                    colour: p.colour,
                    name: p.name,
                    angle: p.angle,
                    health: p.health,
                });
            }
        });
        
        return visible;
    },
    
    get_nearest: function(x, y) {
        if (Players.count == 0) {
            return undefined;
        }
        
        return Players.all_player_ids.map((id) => {
            return Players[id];
        }).sort((a, b) => {
            return Math.hypot(x - a.x, y - a.y) - Math.hypot(x - b.x, y - b.y);
        })[0];
    },
    
    count: 0,
};

//the "game"
var World = {
    get time() { return new Date().getTime(); },
    get lapse() {
        var lapse;
        if (World.last_time == null) {
            lapse = 0;
        } else {
            lapse = Math.min(World.time - World.last_time, 100); // maximum lapse: 100ms, since anything above that would be choppy.
        }
        World.last_time = World.time;
        return lapse;
    },
    
    objects: [], //holds all of the objects
    
    last_time: null,
    
    update: function() {
        var lapse       = World.lapse;
        var all_players = Players.all_player_ids;
        
        all_players.forEach((p) => {
            //update each player
            Players[p].update(lapse);
        });
        
        //clean out whatever's not active
        World.objects = World.objects.filter((f) => { return f.active; });
        World.objects.forEach((f) => {
            // ...and update.
            f.update(lapse);
        });
        
        setImmediate(World.update); //WHY!?
    },
    
    width: 5000, height: 5000,
    friction: 0.03,
    
    get_in_view: function(x, y, w, h) {
        return World.objects.filter((obj) => {
            return (obj.x > x && obj.x < x + w && obj.y > y && obj.y < y + h);
            //</sigh...>
        });
    },
}

//custom log function
var fs         = require("fs");
var log_stream = fs.createWriteStream("logs\\log" + get_date() + ".txt", {'flags': 'a'});

function log(msg, type) {
    msg  = msg.trim();
    type = type || "info";
    if (msg == "") {
        return;
    }
    
    var log_message = get_date_time() + " [" + type + "] " + msg;
    console.log(log_message);
    log_stream.write(log_message + "\n");
}

//gets the date and the time
function get_date_time() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + sec;
}

//gets the date only.
function get_date() {
    var date = new Date();

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    
    return year + "-" + month + "-" + day;
}

//user type
function Player(name, colour, id) {
    this.colour = colour;
    this.name   = name;
    this.id     = id;
    
    this.x     = null;
    this.y     = null;
    this.angle = null;
    
    this.keys = {
        up: false,
        down: false,
        left: false,
        right: false,
        blasters: false,
        torpedos: false,
    };
    
    this.v = {x: 0, y: 0};
    
    this.health = 1;
    
    this.last_blaster = 0;
    this.last_exhaust = 0;
    this.last_torpedo = 0;
    
    this.last_damage = 0;
    
    this.ammo = 1;
    
    this.healing           = false;
    this.ammo_replenishing = false;
    
    this.time_to_heal           = 0;
    this.time_to_ammo_replenish = 0;
}

Player.prototype.engine_thrust  = 0.0005;
Player.prototype.deceleration   = 0.00125;
Player.prototype.rotation_speed = 0.003;

Player.prototype.blaster_reload = 250;
Player.prototype.torpedo_reload = 1000;
Player.prototype.exhaust_delay  = 125; // 125 ms for each exhuast bubble

Player.prototype.ammo_replenish_delay   = 500; // 500 ms for ammo to start being replenished
Player.prototype.health_replenish_delay = 2000; // 2000 ms for health to start recovering

Player.prototype.ammo_replenish_rate = 0.0005;
Player.prototype.heal_rate           = 0.000125;

Player.prototype.blaster_cost = 0.05;
Player.prototype.torpedo_cost = 0.3;

Player.prototype.update = function(lapse) {
    if (this.health <= 0) {
        return;
    }
    
    //update the angle
    this.angle += (this.keys.left ? -this.rotation_speed * lapse : 0) + (this.keys.right ? this.rotation_speed * lapse : 0);
    
    //get the friction
    var friction = { x: -this.v.x * this.deceleration * lapse, y: -this.v.y * this.deceleration * lapse};
    //get the thrust
    var thrust = {
        x: this.keys.up ? Math.cos(this.angle) * this.engine_thrust * lapse : 0,
        y: this.keys.up ? Math.sin(this.angle) * this.engine_thrust * lapse : 0,
    };
    //...and now add them together!
    this.v.x += friction.x + thrust.x;
    this.v.y += friction.y + thrust.y;
    
    this.x += this.v.x * lapse;
    this.y += this.v.y * lapse;
    
    //keep it within the world
    if (this.x < 0 || this.x > World.width) {
        this.x   = Math.max(0, Math.min(World.width, this.x));
        this.v.x = 0;
    }
    
    if (this.y < 0 || this.y > World.height) {
        this.y   = Math.max(0, Math.min(World.height, this.y));
        this.v.y = 0;
    }
    
    //now that the position's updated... you'd think we'd be done, but NOPE!
    
    this.last_blaster += lapse;
    this.last_torpedo += lapse;
    this.last_exhaust += lapse;
    this.last_damage  += lapse;
    
    //if the thrust key is pressed, make a bubble.
    if (this.keys.up && this.last_exhaust >= this.exhaust_delay) {
        World.objects.push(new Bubble(this.x, this.y, this.angle + Math.PI, lighten_colour(this.colour)));
        this.last_exhaust = this.last_exhaust % this.exhaust_delay;
    }
    
    //if the blasters key is pressed, make some blasters!
    if (this.keys.blasters && this.last_blaster >= this.blaster_reload && this.ammo >= this.blaster_cost) {
        World.objects.push(new Blaster_bullet(this.x, this.y, this.angle, lighten_colour(this.colour), this.id));
        this.last_blaster = this.last_blaster % this.blaster_reload;
        this.ammo -= this.blaster_cost;
        
        this.ammo_replenishing = false;
    }
    
    //same goes for torpedo
    if (this.keys.torpedos && this.last_torpedo >= this.torpedo_reload && this.ammo >= this.torpedo_cost) {
        World.objects.push(new Torpedo_rocket(this.x, this.y, this.angle, lighten_colour(this.colour), this.id));
        this.last_torpedo = this.last_torpedo % this.torpedo_reload;
        this.ammo -= this.torpedo_cost;
        
        this.ammo_replenishing = false;
    }
    
    //check collision with any projectiles...lag machine!!!
    if (World.objects.length > 0) {
        World.objects.filter((obj) => {
            return !(obj.type == "bubble" || obj.owner == this.id);
        }).forEach((obj) => {
            if (Math.hypot(obj.x - this.x, obj.y - this.y) < 7.5) {
                obj.active  = false;
                this.health = this.health - obj.damage;
                
                this.last_damage = 0;
                this.healing     = false;
                
                if (this.health <= 0) {
                    Game_events.emit("kill", { killer: obj.owner, victim: this.id });
                }
            }
        });
    }
    
    //ammo replenishing
    if (this.last_blaster > this.ammo_replenish_delay &&
        this.last_torpedo > this.ammo_replenish_delay &&
        this.ammo < 1 && !this.keys.blasters && !this.keys.torpedos) {
        this.ammo_replenishing = true;
    }
    
    if (this.ammo_replenishing) {
        this.ammo = Math.min(this.ammo + this.ammo_replenish_rate * lapse, 1);
    }
    
    //healing
    if (this.last_damage > this.health_replenish_delay && this.health < 1) {
        this.healing = true;
    }
    
    if (this.healing) {
        this.health = Math.min(this.health + this.heal_rate * lapse, 1);
    }
};

Player.prototype.spawn = function() {
    //spawn at the center of the world
    var spawn_radius = Math.random() * 100;
    var spawn_angle  = Math.random() * 2 * Math.PI;
    var spawn_x      = World.width / 2;
    var spawn_y      = World.height / 2;
    
    this.x = Math.cos(spawn_angle) * spawn_radius + spawn_x;
    this.y = Math.sin(spawn_angle) * spawn_radius + spawn_y;
    
    this.angle = Math.random() * Math.PI * 2;
    
    log("player " + this.name + " has spawned at (" + this.x + ", " + this.y + ").");
};

//pick a colour. any colour.
var colours = [
    //from red to purple, plus white and silver
    {r: 255, g: 105, b: 180}, //hot pink
    {r: 220, g:  20, b:  60}, //crimson, or red
    {r: 255, g:  69, b:   0}, //redorange, or just orange
    {r: 255, g: 165, b:   0}, //brighter orange
    {r: 255, g: 255, b:   0}, //yellow
    {r: 255, g: 215, b:   0}, //gold
    {r: 124, g: 252, b:   0}, //lawngreen
    {r:   0, g: 255, b: 127}, //springgreen
    {r:   0, g: 206, b: 209}, //darkturquoise
    {r: 102, g: 205, b: 170}, //mediumaquamarine
    {r:   0, g: 191, b: 255}, //deepskyblue
    {r: 221, g: 160, b: 221}, //violet
    {r: 216, g: 191, b: 216}, //thistle
    {r: 255, g: 255, b: 255}, //white
    {r: 192, g: 192, b: 192}, //silver
];

function random_colour() {
    return colours[Math.floor(Math.random() * colours.length)];
}

//i've done this before. first time something i've done in the past benefits me.
function randomHexString(n) {
    var hexString = "";
    var hexDigits = [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f",
    ];
    while (n > 0) {
        hexString += hexDigits[Math.floor(Math.random() * 16)];
        n = n - 1;
    }
    
    return hexString;
}

// the blaster type, for the players' blasters!
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

Blaster_bullet.prototype.max_lifetime = 1500;

Blaster_bullet.prototype.update = function(lapse) {
    this.lifetime += lapse;
    if (this.lifetime >= this.max_lifetime) {
        this.active = false;
        return;
    }
    
    this.x += this.speed * Math.cos(this.angle) * lapse;
    this.y += this.speed * Math.sin(this.angle) * lapse;
};

// the torpedo type, for the players' torpedos!
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

Torpedo_rocket.prototype.exhaust_delay = 125;

Torpedo_rocket.prototype.update = function(lapse) {
    //update the position
    this.x += Math.cos(this.angle) * lapse * this.speed;
    this.y += Math.sin(this.angle) * lapse * this.speed;
    
    //exhaust, since we don't have to care about pollution.
    this.last_exhaust += lapse;
    
    if (this.last_exhaust >= this.exhaust_delay) {
        World.objects.push(new Bubble(this.x, this.y, this.angle + Math.PI, lighten_colour(this.colour)));
        this.last_exhaust = this.last_exhaust % this.exhaust_delay;
    }
    
    //add detection for colliding with the edge of the map
    if (this.x > World.width || this.y > World.height || this.x < 0 || this.y < 0) {
        this.active = false;
    }
};

// the asteroid type, for fun!
function Asteroid_rock(x, y, size) {
    this.x = x;
    this.y = y;
    
    this.angle    = Math.random() * Math.PI * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rot_dir  = Math.random() < 0.5 ? 1 : -1;
    
    this.size   = size || Math.floor(Math.random() * 4);
    this.radius = this.radii[this.size];
    
    this.active = true;
    this.type   = "asteroid";
}

Asteroid_rock.prototype.radii = [5, 8, 13, 21];

Asteroid_rock.prototype.rotate_speed = 0.003;
Asteroid_rock.prototype.move_speed   = 0.2;

Asteroid_rock.prototype.update = function(lapse) {
    //fill in, let it drift!
};

// the resource type, to reward players for helping with the asteroid clearing!
function Resource_item(x, y) {
    this.x = x;
    this.y = y;
    
    this.active   = true;
    this.lifetime = 0;
    this.type     = "resource";
}

Resource_item.prototype.attraction_radius = 25;
Resource_item.prototype.max_lifetime      = 1e4;

Resource_item.prototype.speed = 0.3;

Resource_item.prototype.update = function(lapse) {
    this.lifetime += lapse;
    if (this.lifetime >= this.max_lifetime) {
        this.active = false;
        return;
    }
    
    //check for any nearby players?
    var nearest = Players.get_nearest(this.x, this.y);
    
    if (nearest == undefined || Math.hypot(nearest.x - this.x, nearest.y - this.y) > this.attraction_radius) {
        return;
    } else if (Math.hypot(nearest.x - this.x, nearest.y - this.y) < 7.5) {
        this.active = false;
        //fill in the rest...
    }
};

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

//for colours
function lighten_colour(c) {
    return {
        r: (c.r + 255) / 2,
        g: (c.g + 255) / 2,
        b: (c.b + 255) / 2,
    };
}

function darken_colour(c) {
    return {
        r: c.r / 1.5,
        g: c.g / 1.5,
        b: c.b / 1.5,
    };
}

//event emitter stuff. yes, i know i should split this up...
var Game_events = new event.EventEmitter();

//KICKSTART!!!!!!!
World.update();
