//handles server stuff, ties everything together

//load external modules
var express = require("express");
var app     = express();
var server  = require("http").createServer(app);

//helper modules
var log              = require(__dirname + "/logging.js"); //load logging function
var Misc_math        = require(__dirname + "/misc_math.js");
var Colours          = require(__dirname + "/colours.js");
var Players          = require(__dirname + "/players.js");
var Player           = require(__dirname + "/player.js");
var Universe         = require(__dirname + "/universe.js");
var Celestial_bodies = require(__dirname + "/celestial_bodies.js");
var Game_events      = require(__dirname + "/events.js");

//set up express resources, assuming running from directory above
app.use(express.static("./webpage"));

app.get('/', function(req, res) {
    log("incoming connection from: " + 
        (req.ip || req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress), "notification"
    );
    
    res.sendFile("./webpage/index.html");
});

app.post('/', function(req, res) {
    var body = "";
    
    req.on('data', function(data) {
        body += data;
        
        //trop de data, tuer la connection!
        if (body.length > 1e4) {
            req.connection.destroy();
        }
    });
    
    req.on('end', function() {
        var colour = Colours.random();
        var name   = body.trim();
        var id     = Misc_math.random_hex_string(6);
        
        log("POST request from: " + (req.ip || req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress) + ", with name: " + name,
            "notification"
        );
        
        //response?
        res.status(200);
        res.send({ colour: colour, name: name, id: id });
        res.end();
    });
});

//the socket part
var io = require("socket.io").listen(server);

io.on("connection", function(socket) {
    var player      = null;
    var id          = null;
    var last_update = null;
    
    //incoming update from the client
    socket.on("client_update", function(data) {
        if (last_update != null && last_update > data.time) {
            return; //update is older than our last update, so this one is useless
        }
        
        if (player == null) {
            id     = data.id;
            player = new Player(data.name, data.colour, id);
            Players.add(player, id);
            log("new player => name: " + player.name +
                ", id: " + id + 
                ", colour: " + JSON.stringify(data.colour),
                "notification"
            );
            
            Universe.objects.push(player);
            
            //remember to spawn the player
            player.spawn(Alpha.x, Alpha.y, 48);
        }
        
        player.keys = data.keys;
        
        //time, for updating purposes.
        var time = Date.now();
        
        //viewport
        var p_x = player.x - (data.viewport.width / 2);
        var p_y = player.y - (data.viewport.height / 2);
        var p_w = data.viewport.width;
        var p_h = data.viewport.height;
        
        //infos to the player
        socket.emit("server_update", {
            player: player,
            objects: Universe.get_in_view(p_x, p_y, p_w, p_h),
            players: Players.get_in_view(p_x, p_y, p_w, p_h),
            time: time,
            offset: { x: p_x, y: p_y, },
            health: player.health,
            ammo: player.ammo,
        });
    });
    
    var kill_event_listener  = create_kill_listener(player, socket);
    var leaderboard_listener = create_leaderboard_listener(socket);
    
    Game_events.on("kill", kill_event_listener);
    Game_events.on("leaderboard_update", leaderboard_listener);
    
    socket.on("disconnect", function() {
        if (player != null) {
            io.emit("notification", player.name + " has disconnected.");
            log(player.name + ", " + id + " has disconnected.", "info");
            Players.remove(id);

            Game_events.removeListener("kill", kill_event_listener);
            Game_events.removeListener("leaderboard_update", leaderboard_listener);
        }
    });
});

function create_kill_listener(player, socket) {
    return function(data) {
        if (data.killer == id) {
            //player got a kill! congrats!
            socket.emit("notification", "you have killed " + Players[data.victim].name);
            player.update_score("kill");
            socket.emit("kill");
        }
        
        if (data.victim == id) {
            //player got killed!
            socket.emit("notification", "you were killed by " + Players[data.killer].name);
            socket.emit("death");
        }
    };
}

function create_leaderboard_listener(socket) {
    return function() {
        socket.emit("leaderboard_update", Leaderboard);
    }
}

var Leaderboard = [];
var num_scores  = 10;

Game_events.on("score changed", function() {
    Leaderboard = Players.get_highest(num_scores);
    
    Game_events.emit("leaderboard_update");
});

var Sun   = new Celestial_bodies.Star("sun", 5000, 5000);
var Alpha = new Celestial_bodies.Planet(Sun, 600, "alpha", 32);
var Beta  = new Celestial_bodies.Planet(Sun, 1000, "beta", 32);

Universe.objects.push(Sun);
Universe.objects.push(Alpha);
Universe.objects.push(Beta);

setInterval(Celestial_bodies.spawn_asteroid(Sun, 800, 900, 0));

setImmediate(Universe.update);

var default_port = 3000;
module.exports   = function(port) {
    if (isNaN(port)) {
        port = default_port;
    }
    
    server.listen(port, function() {
        log("---- NEW SERVER SESSION ----", "notification");
        log("http server listening on port " + port + ".", "notification");
    });
};