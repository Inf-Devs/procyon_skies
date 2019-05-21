var Universe = require("./universe.js");

var Weapons = {
    /*
        *** DO NOT REMOVE ***
        needed info for each weapon:
        [ ] a function for firing
        [ ] cooldown (in milliseconds)
        [ ] name
        [ ] cost
        
        *** (incomplete) EXAMPLES BELOW ***
    */
    
    "torpedo": {
        name: "torpedo",
        cost: 0.4,
        cooldown: 1000,
        fire: function(p) {
            //launch a new rocket
        },
    },
    
    "blaster": {
        name: "blaster",
        cost: 0.05,
        cooldown: 250,
        fire: function(p) {
            //launch one blaster bullet
        },
    },
    
    "double blaster": {
        name: "double blaster",
        cost: 0.07,
        cooldown: 300,
        fire: function(p) {
            //launch two blaster bullets
        },
    },
    
    "grenade": {
        name: "grenade",
        cost: 0.3,
        cooldown: 1500,
        fire: function(p) {
            //my new secret weapon...
        },
    },
};