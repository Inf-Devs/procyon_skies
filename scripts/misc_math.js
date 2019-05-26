var Misc_math = module.exports = {};

Misc_math.get_distance = function(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
};

Misc_math.get_angle = function(start, end) {
    var hypot = Math.hypot((end.x - start.x), (end.y - start.y));
    var opp   = end.y - start.y;

    var angle = Math.asin(opp / hypot);

    if (end.x < start.x) angle = Math.PI - angle;

    return angle;
};

Misc_math.random_number = function(start, end) {
    var adder      = Math.min(start, end);
    var multiplier = Math.abs(start - end);

    return Math.floor(Math.random() * multiplier + adder);
};

Misc_math.random_hex_string = function(n) {
    var hexString = "";
    var hexDigits = [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f",
    ];
    while (n > 0) {
        hexString += hexDigits[Math.floor(Math.random() * 16)];
        n = n - 1;
    }

    return hexString;
};