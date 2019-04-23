//it didn't crash immediately. phew.
//i'm going to be running this on my 5.5 year old laptop.
// 6 gb ram, amd 4400m. wish me luck!
var express = require("express");
var app     = express();
var http    = require("http");
var server  = http.createServer(app);

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
        
        // don't need this anymore Players.add(name, colour);
        
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
        });
    });
    
    //when a player leaves
    socket.on("disconnect", function() {
        if (player != null) {
            io.emit("notification", player.name + " has disconnected.");
            log(player.name + ", " + id + " has disconnected.", "info");
            Players.remove_player(id);
        }
    });
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
            /*return !(
                r == "add" || r == "get_player" || r == "remove_player" ||
                r == "count" || r == "all_player_ids" || r == "get_visible_players"
            );*/
            
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
}

Player.prototype.engine_thrust  = 0.0005;
Player.prototype.deceleration   = 0.00125;
Player.prototype.rotation_speed = 0.003;

Player.prototype.blaster_reload = 250;
Player.prototype.torpedo_reload = 1000;
Player.prototype.exhaust_delay  = 125; // 125 ms for each exhuast bubble

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
    
    //if the thrust key is pressed, make a bubble.
    if (this.keys.up && this.last_exhaust >= this.exhaust_delay) {
        World.objects.push(new Bubble(this.x, this.y, this.angle + Math.PI, lighten_colour(this.colour)));
        this.last_exhaust = this.last_exhaust % this.exhaust_delay;
    }
    
    //if the blasters key is pressed, make some blasters!
    if (this.keys.blasters && this.last_blaster >= this.blaster_reload) {
        World.objects.push(new Blaster_bullet(this.x, this.y, this.angle, lighten_colour(this.colour), this.id));
        this.last_blaster = this.last_blaster % this.blaster_reload;
    }
    
    //same goes for torpedo
    // ...finish.
    
    //check collision with any projectiles...lag machine!!!
    if (World.objects.length > 0) {
        World.objects.filter((obj) => {
            return !(obj.type == "bubble" || obj.owner == this.id);
        }).forEach((obj) => {
            if (Math.hypot(obj.x - this.x, obj.y - this.y) < 5) {
                obj.active = false;
                this.health -= obj.damage;
            }
        });
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
    {r: 255, g: 192, b: 203}, //pink
    {r: 220, g:  20, b:  60}, //crimson, or red
    {r: 255, g:  69, b:   0}, //redorange, or just orange
    {r: 255, g: 165, b:   0}, //brighter orange
    {r: 255, g: 255, b:   0}, //yellow
    {r: 255, g: 215, b:   0}, //gold
    {r: 240, g: 230, b: 130}, //khaki
    {r: 124, g: 252, b:   0}, //lawngreen
    {r: 152, g: 251, b: 152}, //palegreen
    {r:   0, g: 206, b: 209}, //darkturquoise
    {r: 102, g: 205, b: 170}, //mediumaquamarine
    {r: 176, g: 224, b: 230}, //powderblue
    {r: 221, g: 160, b: 221}, //violet
    {r: 216, g: 191, b: 216}, //thistle
    {r: 255, g: 255, b: 255}, //white
    {r: 255, g: 248, b: 220}, //cornsilk
    {r: 220, g: 220, b: 220}, //gainsboro
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

// the asteroid type, for fun!

// the resource type, for now, just useless...

// the bubble type, for the players' exhaust
function Bubble(x, y, angle, colour) {
    this.x = x;
    this.y = y;
    
    this.angle  = angle;
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

//KICKSTART!!!!!!!
World.update();
