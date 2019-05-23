var Colours = module.exports = {};

//for colours
Colours.lighten = function(c) {
    return {
        r: (c.r + 255) / 2,
        g: (c.g + 255) / 2,
        b: (c.b + 255) / 2,
    };
};

Colours.darken = function(c) {
    return {
        r: c.r / 1.5,
        g: c.g / 1.5,
        b: c.b / 1.5,
    };
}

//pick a colour. any colour.
Colours.colours = [
    //from red to purple, plus white and silver
    {r: 255, g: 105, b: 180}, //hot pink
    {r: 220, g:  20, b:  60}, //crimson, or red
    {r: 255, g:  69, b:   0}, //redorange, or just orange
    {r: 255, g: 165, b:   0}, //brighter orange
    {r: 255, g: 255, b:   0}, //yellow
    {r: 255, g: 215, b:   0}, //gold
    {r: 124, g: 252, b:   0}, //lawngreen
    {r:   0, g: 255, b: 127}, //springgreen
    {r:   0, g: 206, b: 209}, //darkturquoise
    {r: 102, g: 205, b: 170}, //mediumaquamarine
    {r:   0, g: 191, b: 255}, //deepskyblue
    {r: 221, g: 160, b: 221}, //violet
    {r: 216, g: 191, b: 216}, //thistle
    {r: 255, g: 255, b: 255}, //white
    {r: 192, g: 192, b: 192}, //silver
];

Colours.random = function() {
    return colours[Math.floor(Math.random() * colours.length)];
}