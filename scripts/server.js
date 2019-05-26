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
var Universe    = require(__dirname + "/universe.js");
var Game_events = require(__dirname + "/game_events.js");

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
        var id     = Misc_math.random_nex_string(6);
        
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
    
});

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