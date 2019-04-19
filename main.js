var express = require("express");
var app     = express();
var http    = require("http");
var server  = http.createServer(app);
var qs      = require("querystring");

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
        //var post   = qs.parse(body);
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
    
    //state change event
    socket.on("update", function(data) {
        
    });
});

//to keep track of players
var Players = {
    add: function(name, colour, id) {
        this[id] = new Player(name, colour);
        this.count++;
    },
    
    get_player: function(id) {
        return this[id];
    },
    
    remove_player: function(id) {
        delete this[id];
        this.count--;
    },
    
    count: 0,
};

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
    
    while (n > 0) {
        switch (Math.floor(Math.random() * 16)) {
            case 0:
                hexString = hexString + "0";
                break;
            case 1:
                hexString = hexString + "1";
                break;
            case 2:
                hexString = hexString + "2";
                break;
            case 3:
                hexString = hexString + "3";
                break;
            case 4:
                hexString = hexString + "4";
                break;
            case 5:
                hexString = hexString + "5";
                break;
            case 6:
                hexString = hexString + "6";
                break;
            case 7:
                hexString = hexString + "7";
                break;
            case 8:
                hexString = hexString + "8";
                break;
            case 9:
                hexString = hexString + "9";
                break;
            case 10:
                hexString = hexString + "a";
                break;
            case 11:
                hexString = hexString + "b";
                break;
            case 12:
                hexString = hexString + "c";
                break;
            case 13:
                hexString = hexString + "d";
                break;
            case 14:
                hexString = hexString + "e";
                break;
            case 15:
                hexString = hexString + "f";
                break;
        }
        n = n - 1;
    }
    
    return hexString;
}