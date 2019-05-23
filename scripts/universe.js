var log       = require("./logging.js");
var Misc_math = require("./misc_math.js");

var Universe = {
    width: 1e4, height: 1e4,
    
    //objects and accessing them
    objects: [],
    
    get projectiles() {
        return this.objects.filter((obj) => { return obj.is_projectile; });
    },
    
    get bodies() { //totally not a serial killer
        return this.objects.filter((obj) => { return obj.is_body; });
    },
    
    //timing
    last_time: null,
    
    calculate_lapse: function() {
        var lapse, time = Date.now();
        if (this.last_time == null) {
            lapse = 0;
        } else {
            lapse = time - last_time;
        }
        last_time = time;
        
        return lapse;
    },
    
    //updating
    update: function() {
        var lapse = this.calculate_lapse();
        this.objects.forEach((obj) => {
            obj.update(lapse);
        });
        
        //like requestAnimationFrame
        setImmediate(Universe.update);
    },
    
    get_distance: function(start, end) {
        //old algorithm
        return Math.hypot((end.x - start.x), (end.y - start.y));
    },
    
    get_angle: function(start, end) {
        var hypot = Math.hypot((end.x - start.x), (end.y - start.y));
        var opp   = end.y - start.y;
        
        var angle = Math.asin(opp / hypot);
        
        if (end.x < start.x) angle = Math.PI - angle;
        
        return angle;
    },
};

module.exports = Universe;