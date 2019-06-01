var log       = require(__dirname + "/logging.js");
var Misc_math = require(__dirname + "/misc_math.js");

var Universe = {
    width: 1e4, height: 1e4,
    
    friction: 0.00125,
    bounciness: 0.09,
    
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
        var lapse = 0, time = Date.now();
        if (Universe.last_time == null) {
            lapse = 0;
        } else {
            lapse = time - Universe.last_time;
        }
        Universe.last_time = time;
        
        if (lapse > 100) {
            log("lapse (" + lapse + " ms) too high! setting lapse to 100.", "warning");
            lapse = 100;
        }
        
        return lapse;
    },
    
    //updating
    update: function() {
        var lapse = Universe.calculate_lapse();
        
        Universe.objects = Universe.objects.filter((obj) => { return obj.active; });
        Universe.objects.forEach((obj) => {
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
    
    get_all_of_type: function(type) {
        return this.objects.filter((obj) => {
            return obj.type === type;
        });
    },
    
    get_in_view: function(x, y, width, height) {
        var in_view = [];
        this.objects.forEach((obj) => {
            if (obj.x + obj.radius > x &&
                obj.y + obj.radius > y &&
                obj.x - obj.radius < x + width &&
                obj.y - obj.radius < y + width &&
                obj.type !== "player" //players are handled *special*
            ) {
                in_view.push(obj);
            }
        });
        
        return in_view;
    },
};

module.exports = Universe;