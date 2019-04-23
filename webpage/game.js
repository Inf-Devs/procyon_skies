//game data
var Game = {
    id: null,
    colour: null,
    name: null,
    
    keys: {
        up: false,
        down: false,
        left: false,
        right: false,
        blasters: false,
        torpedos: false,
    },
};

//game setup
function setup_game() {
    //specifically: start a connection, update, then start when the information comes
    socket = io();
    
    document.body.style.color = get_colour(Game.colour);
    
    send_update();
    //socket.emit("client_update", { name: Game.name, id: Game.id, keys: Game.keys, colour: Game.colour});
    
    //set up our event listeners
    addEventListener("keyup", keyup_handler);
    addEventListener("keydown", keydown_handler);
    socket.on("server_update", receive_update);
    
    document.body.appendChild(canvas);
    Camera.resize();
    
    requestAnimationFrame(animate);
}