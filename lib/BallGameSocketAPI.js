"use strict";

/**
 * WebGL Ball Game Server
 *
 * @author Kevin Fitzgerald / @kftzg / http://kevinfitzgerald.net
 * Git: https://github.com/kfitzgerald/webgl-ball-game
 * Last Updated: 8/22/13 9:23 AM CST
 *
 * Copyright 2013 Kevin Fitzgerald
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: *www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const ImprovedNoise = require('./ImprovedNoise');

module.exports = (io) => {

    let playerIds = 0,          // Incremental player id counter - should always be unique
        worldWidth = 64,        // How wide the world is
        worldDepth = 64,        // How deep the world is
        size = 128,             // How large the world really is
        terrainSize = size * 2, // How many vertices should each axis contain
        ground = generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .25, 6),    // Ground terrain data
        hills = generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .75, 35),   // Hills terrain data
        water = generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .1, 4),     // Water terrain data
        treeLocations = [],     // Random tree locations array
        players = {},           // Players global containerDiv - "key" is player id (eg. players[1].nickname )
        colorPool = makeColorGradient(1.766, 2.966, 3.766, 38, 38, 38, 128, 115, 50);   // Color sequence generated pool of 50 colors

    // Generate 50 random tree locations
    for (let i = 0; i < 50; i++) {
        treeLocations.push({
            x: Math.random() * 256 - 128,
            y: Math.random() * 256 - 128,
            rotation: Math.random() * Math.PI
        });
    }

    // Handle connection!
    io.sockets.on('connection', function (socket) {

        // Get the next unique player id
        let id = ++playerIds;

        // Setup the player object
        players[id] = {
            player_id: id,              // Unique ID
            nickname: 'Player ' + id,     // Defaults to Player {id}
            hp: 100,                    // Hit points
            color: colorPool[id % colorPool.length],    // Next color in color sequence pool
            start_pos: {x: Math.random() * 256 - 128, y: Math.random() * 256 - 128, zRotation: 0},   // Random start x,y
            balls: []   // Tracked balls
        };

        // Get a local reference to the global player object
        const playerData = players[id];

        // Update the player's position to the randomized start position
        playerData.pos = {x: playerData.start_pos.x, y: playerData.start_pos.y, z: null, zRotation: 0};


        /**
         * Occurs when the client disconnects from the server
         * @var string reason - Optional - reason for disconnecting, not used
         */
        socket.on('disconnect', function (reason) {
            console.log('disconnected', reason);

            // Remove the player's balls (if any remain)
            const unfireData = [];
            for (let i in players[id].balls) {
                unfireData.push({
                    playerId: id,
                    ballId: i
                });
            }

            // Notify other connected clients the player's balls are gone
            if (unfireData.length > 0) {
                socket.broadcast.emit("unfires", unfireData);
            }

            // Remove the player and tell the others
            delete players[id];
            socket.broadcast.emit('delete_player', id);

            // Audit
            console.log('players are now', players);
        });


        /**
         * Occurs when a player changes their name
         * @var string data - New player's nickname. Must be between 3 and 15 chars long
         */
        socket.on('nickname', function (data) {
            // Verify nickname is valid range
            if (data.length >= 3 && data.length <= 15) {

                // Update the player's nickname
                players[id].nickname = data;

                // Notify clients
                socket.broadcast.emit('nicknames', {
                    playerId: id,
                    nickname: data
                });
            }
        });


        /**
         * Occurs when a player moves
         * @var object data - The new position and rotaiton of the player
         * data => { x, y, z, zRotation }
         */
        socket.on('move', function (data) {
            // If the player is not dead, allow the move
            if (players[id].hp > 0) {

                // Update player's position
                players[id].pos = data;

                // Broadcast the move to the other clients
                socket.broadcast.emit("moves", {
                    id: id,
                    position: data
                });
            }
        });


        /**
         * Occurs when the player throws a ball
         * @var object data - The ball and trajectory info
         * data => {
     *   sourcePlayerId,
     *   force : { x, y, z },
     *   position: { x, y, z },
     *   restitution,
     *   ballId
     * }
         */
        socket.on('fire', function (data) {
            // If the player is not dead, allow the throw
            if (players[id].hp > 0) {

                // Set the color of the ball to the player's color
                data.color = players[id].color;

                // Track the ball on the player
                players[id].balls[data.ballId] = data;

                // Broadcast the projectile to the other clients
                socket.broadcast.emit("fires", data);
            }
        });


        /**
         * Occurs when a player/client removes a ball (collected, hit, abyss'ed)
         * @var object data - The ball to stop tracking
         * data => { playerId, ballId }
         */
        socket.on('unfire', function (data) {
            // If the ball is already tracked handle the removal
            if (players[data.playerId].balls[data.ballId] !== null) {

                // Remove the ball from the tracked player ball collection
                delete players[data.playerId].balls[data.ballId];

                // Broadcast the removal to the other clients
                socket.broadcast.emit("unfires", [{
                    playerId: data.playerId,
                    ballId: data.ballId
                }]);
            }
        });


        /**
         * Occurs when a player respawns after dying
         * @var null data - Not currently used
         */
        socket.on('respawn', function (/*data*/) {
            // Allow respawn if the player is dead
            if (players[id].hp <= 0) {

                // Reset player HP
                players[id].hp = 100;

                // Choose and update the player to a new random spawn point
                const respawnLoc = {x: Math.random() * 256 - 128, y: Math.random() * 256 - 128, z: null, zRotation: 0};
                players[id].pos = respawnLoc;

                // Build announcement data
                const respawnInfo = {
                    player_id: id,
                    hp: players[id].hp,
                    pos: respawnLoc
                };

                // Remove the player balls if they have any left in the wild
                const unfireData = [];
                for (let i in players[id].balls) {
                    unfireData.push({
                        playerId: id,
                        ballId: i
                    });
                }

                // If they did have any balls left, tell the clients to remove them
                if (unfireData.length > 0) {
                    socket.broadcast.emit("unfires", unfireData);
                }

                // Tell the client their respawn info
                socket.emit('respawns', respawnInfo);

                // Tell the others that the player respawned
                socket.broadcast.emit('respawns', respawnInfo);
            }
        });


        /**
         * Occurs when the player detected one of their balls hit another player
         * @var object data - Information about the collision and player
         * data => {
     *   playerId, // The player who got hit
     *   playerSourceId, // The player who made the hit
     *   velocity, // The speed in which the ball hit
     *   newHp // What the player's new HP is as a result of the hit
     * }
         */
        socket.on('hit', function (data) {
            // Accept the hit if the target player is still alive
            if (players[data.playerId].hp > 0) {

                // Update the player's HP to the given value
                players[data.playerId].hp = data.newHp;

                // Audit the death to the console
                if (data.newHp < 0) {
                    console.log('player killed', data.playerId);
                }

                // Notify the clients about the collision
                socket.broadcast.emit('hits', data);
            }
        });


        //
        // CONNECTED
        //

        // Send the client their player information and world information
        socket.emit('connected', {
            player: playerData,
            ground: ground,
            hills: hills,
            water: water,
            trees: treeLocations,
            players: players
        });

        // Broadcast the new connection to the other clients
        socket.broadcast.emit('new_player', playerData);

        // Audit
        console.log('connected', playerData);
        console.log('players are now', players);
    });
};


//
// HELPER FUNCTIONS
//


/**
 * Generates a new three-dimensional terrain plane
 * @param worldWidth - How wide the plane should be
 * @param worldHeight - How deep the plane should be
 * @param width - The number of vertices the plane width should contain
 * @param height - The number of vertices the plane height should contain
 * @param multiplier - How dramatic the terrain elevation should be
 * @param subtractor - How far vertically to offset the terrain
 * @returns {{data: *, width: *, height: *, worldWidth: *, worldHeight: *, multiplier: *, subtractor: *}}
 */
function generateTerrainPlaneData(worldWidth, worldHeight, width, height, multiplier, subtractor) {
    return {
        data: generateHeight(worldWidth, worldHeight),
        width: width,
        height: height,
        worldWidth: worldWidth,
        worldHeight: worldHeight,
        multiplier: multiplier,
        subtractor: subtractor
    };
}


/**
 * Generates the vertex height map of the terrain plane
 * @param width - Width resolution
 * @param height - Height resolution
 * @returns {[*]} - Height map array
 *
 * based on http://mrl.nyu.edu/~perlin/noise/
 */
function generateHeight(width, height) {

    const size = width * height,
        data = new Array(size),
        perlin = new ImprovedNoise(),
        z = Math.random() * 100;

    let quality = 1;

    for (let i = 0; i < size; i++) {
        data[i] = 0;
    }

    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < size; i++) {
            let x = i % width, y = ~~( i / width );
            data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
        }
        quality *= 5;
    }

    return data;
}


/**
 * Adapted color sequence generator by Jim Bumgardner (http://krazydad.com/tutorials/makecolors.php)
 */
function makeColorGradient(frequency1, frequency2, frequency3, phase1, phase2, phase3, center, width, len) {
    const pool = [];
    if (len === undefined) len = 50;
    if (center === undefined) center = 128;
    if (width === undefined) width = 127;

    for (let i = 0; i < len; ++i) {
        let red = Math.sin(frequency1 * i + phase1) * width + center,
            grn = Math.sin(frequency2 * i + phase2) * width + center,
            blu = Math.sin(frequency3 * i + phase3) * width + center;

        pool.push((Math.floor(red) * 256 * 256) + (Math.floor(grn) * 256) + Math.floor(blu));
    }

    return pool;
}