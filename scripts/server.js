//handles server stuff, ties everything together

//load external modules
var express = require("express");
var app     = express();
var server  = require("http").createServer(app);

//helper modules
var log         = require(__dirname + "/logging.js"); //load logging function
var Misc_math   = require(__dirname + "/misc_math.js");
var Colours     = require(__dirname + "/colours.js");
var Players     = require(__dirname + "/players.js");
var Player      = require(__dirname + "/player.js");
var Universe    = require(__dirname + "/universe.js");
var Game_events = require(__dirname + "/events.js");

//set up express resources, assuming running from directory above
app.use(express.static("./webpage");

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
            
            //register the kill event handler
            Game_events.on('kill', create_kill_listener(player, socket));
        }
        
        player.keys = data.keys;
        
        //time, for updating purposes.
        var time = Date.now();
    });
});

function create_kill_listener(player, socket) {
    return function(data) {
        if (data.killer == id) {
            //player got a kill! congrats!
            socket.emit("notification", "you have killed " Players[data.victim].name);
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