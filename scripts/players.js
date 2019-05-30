//PLAYER REGISTRY
var Misc_math = require(__dirname + "/misc_math.js");

var Players = module.exports = {
    add: function(p) {
        this[p.id] = p;
    },
    
    remove: function(id) {
        delete this[id];
    },
    
    get_highest: function(n) {
        if (isNaN(n)) {
            n = 1; //SAFTY CHEK
        }
        
        return this.all_ids.map((id) => {
            return this[id].score;
        }).sort(function(a, b){
            return b.score - a.score;
        }).slice(0, n);
    },
    
    get_closest: function(x, y) {
        if (Players.count == 0) {
            return undefined;
        }

        return Players.all_ids.map((id) => {
            return Players[id];
        }).sort(function(a, b) {
            return Misc_math.get_distance(x, y, a.x, a.y) - Misc_math.get_distance(x, y, b.x, b.y);
        })[0];
    },
    
    get all_ids() {
        return Object.getOwnPropertyNames(this).filter((id) => {
            return /[0123456789abcdef]{6}/.test(id);
        });
    },
    
    get count() {
        return Object.getOwnPropertyNames(this).length - 7;
    },
    
    get_in_view: function(x, y, width, height) {
        var in_view = [];
        this.all_ids.map((id) => { return this[id]; }).forEach((p) => {
            if (p.x + p.radius > x &&
                p.y + p.radius > y &&
                p.x - p.radius < x + width &&
                p.y - p.radius < y + width &&
                p.active
            ) {
                in_view.push(p);
            }
        });
        
        return in_view;
    },
};

// the beauty of all this is that niether player.js nor players.js depend
// upon each other. FUN!