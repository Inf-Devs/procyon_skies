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
    
    socket.emit("update", {id: Game.id, keys: Game.keys});
}