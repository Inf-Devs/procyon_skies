//the camera
var Camera = {
    //things required for drawing on the screen are here
    
    objects: [],
    players: [],
    width: null,
    height: null,
    offset_x: null,
    offset_y: null,
    
    line_spacing: 25,
    line_width: 2,
    line_colour: "dimgray",
    
    draw_frame: function(cxt) {
        cxt.clearRect(0, 0, this.width, this.height);
        
        //draw the gridlines
    },
    
    resize: function() {
        this.width  = canvas.width;
        this.height = canvas.heigth;
    },
};
