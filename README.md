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