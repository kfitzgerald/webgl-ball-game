# WebGL Ball Throwing Game

My fun little prototype of a fairly simple WebGL game that uses a whole pile of new-fangle
tech like WebGL, Web Workers, Web Sockets, Pointer Lock and physics!

This thing is frankenstein'ed together from various examples, tidbits, blogs and github
repositories from far and wide. It's basically the culmination of things I've been poking at
for the last few years.

Art inspired by Tim Reynolds ([@turnislefthome](https://twitter.com/turnislefthome), http://www.turnislefthome.com)

Hope you enjoy, build upon, and hack this thing.

Btw, the code that's in this repo is a pile of garbage and contains various tangents and
ideas from the last year or two.


## Setup

1. Download or clone this repository
2. Install node.js (http://nodejs.org/)
3. Change into the server directory, and install socket.io (http://socket.io/), e.g. `npm install socket.io`
4. Run the server: `node server.js`

Stop the server with CTRL+C

If you really want it to run and restart on crash, try this:

`while true; do echo 'Hit CTRL+C TO KILL'; node server.js ; sleep 1; done`


## Features

* HTML5, WebGL, Web Sockets, Web Workers, Pointer Lock
* HTML5 Boilerplate (http://html5boilerplate.com/)
* three.js (https://github.com/mrdoob/three.js/)
* physi.js (http://chandlerprall.github.io/Physijs/)
* node.js (http://nodejs.org/)

## Credits

* Written by Kevin Fitzgerald ([@kftzg](https://twitter.com/kftzg), http://kevinfitzgerald.net)
* Art style inspired by Tim Reynolds ([@turnislefthome](https://twitter.com/turnislefthome), http://www.turnislefthome.com)
* Ideas vetted by bestie Adam Vogel ([@adambvogel](https://twitter.com/adambvogel), http://adamvogel.net)
* Play tested and approved by my lovely wife Luciana ([@leafitz](https://twitter.com/leafitz), http://lucianaelisa.net)