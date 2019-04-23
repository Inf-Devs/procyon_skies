# Real-time server demo

## What is this?

I've built a "small" demo that has players connect to a server, enter their name, and fly around a bit as tiny little spaceships.

## Dependencies

This project is built with Node.js, Socket.io, and Express.

## Installing and Running

To run, just type

`npm install`

and then

`node main.js`.

Go into a browser, and type `localhost:3000` to view the result.

## What does this do, specifically?

On the server side...

* keep track of players (including their location, their state, etc.)

* keep track of objects

* advance the game

* update each client when as they send in new data

On the client side...

* keep track of the keys the player presses

* draw on the screen

* nag the server for updates

## To-do list

### Client side

* resolve dependencies and clean up code

* smoother transition between logging in and playing

* figure out how not to hog resources

### Server side

* figure out how to use modules &mdash; this means splitting up the code into more files, for comprehensibility's sake

* figure out how to make it efficient &mdash; even if Javascript is not

* more features for the clients, such as:

    - global chat
    
    - weapons, and let the players blast each other
    
    - various planets for players to stop over
    
    - save server state, so that players can come back to where they left off
    
    - more efficient updating, for less lag
    
    - notifications for players
