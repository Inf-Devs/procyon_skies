var express = require("express");
var app     = express();
var http    = require("http");
var server  = http.createServer(app);

server.listen(3000, function() {
    log("==== NEW SERVER SESSION ====");
    log("http server listening on port 3000.", "notification");
});

var io = require("socket.io").listen(server);

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
        
        log("a post request, with name: " + name, "info");
        
        Players.add(name, colour);
        
        //respond, too, telling the user their colour
        
        res.status(200);
        res.send({colour: colour, name: name, id: id});
        res.end();
    });
});

//set up express resources
app.use(express.static(__dirname + "/webpage"));

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
            player = new Player(data.name, data.colour);
            Players.add(id, player);
            log("new player => name: " + player.name + ", id: " + data.id + ", colour: " + JSON.stringify(player.colour), "info");
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
        //    [x] the player's x and y (for later)
        socket.emit("server_update", {
            player: player,
            objects: World.get_in_view(p_x, p_y, p_w, p_h), // FILL IN THE BRACKET!
            players: Players.get_visible_players(p_x, p_y, p_w, p_h), //again, fill in the brackets
            time: time,
        });
    });
    
    //when a player leaves
    socket.on("disconnect", function() {
        io.emit("notification", player.name + " has disconnected.");
        log(player.name + ", " + id + " has disconnected.", "info");
        Players.remove_player(id);
    });
});

//to keep track of players
var Players = {
    add: function(player, id) {
        this[id] = player;
        this.count++;
    },
    
    get_player: function(id) {
        return this[id];
    },
    
    remove_player: function(id) {
        delete this[id];
        this.count--;
    },
    
    get all_player_ids() {
        return Object.getOwnPropertyNames(this).filter((r) => {
            return !(
                r == "add" || r == "get_player" || r == "remove_player" ||
                r == "count" || r == "all_player_ids"
            );
        });
    },
    
    get_visible_players: function(x, y, w, h) {
        var visible = [];
        
        this.all_player_ids.forEach((id) => {
            var p = this[id];
            if (p.x > x && p.y > y && p.x < x + w && p.y < y + h) {
                visible.push(p);
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
        if (this.last_time == null) {
            lapse = 0;
        } else {
            lapse = this.time - this.last_time;
        }
        this.last_time = this.time;
        return lapse;
    },
    
    objects: [], //holds all of the objects
    
    last_time: null,
    
    update: function() {
        var lapse       = this.lapse;
        var all_players = Players.all_player_ids;
        
        all_players.forEach((f) => {
            //update each player
            
        });
    },
    
    keep_in_bounds: function(object) {
        
    },
    
    width: 5000, height: 5000,
    friction: 0.03,
    
    get_in_view: function(x, y, w, h) {
        return this.objects.filter((obj) => {
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
function Player(name, colour) {
    this.colour = colour;
    this.name   = name;
    
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
}

Player.prototype.engine_thrust = 0.05;

Player.prototype.update = function(lapse) {
    var vx = 0, vy = 0;
}

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

// the torpedo type, for the players' torpedos!

// the asteroid type, for fun!

// the resource type, for now, just useless...
