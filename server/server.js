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

//
// DEPENDENCIES
//

// http://mrl.nyu.edu/~perlin/noise/
var ImprovedNoise = function () {

    var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
        23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
        174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
        133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
        89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
        202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
        248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
        178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
        14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
        93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

    for (var i=0; i < 256 ; i++) {
        p[256+i] = p[i];
    }

    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function lerp(t, a, b) {
        return a + t * (b - a);
    }

    function grad(hash, x, y, z) {
        var h = hash & 15,
            u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
    }

    return {
        noise: function (x, y, z) {
            var floorX = ~~x, floorY = ~~y, floorZ = ~~z,
                X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;

            x -= floorX;
            y -= floorY;
            z -= floorZ;

            var xMinus1 = x -1, yMinus1 = y - 1, zMinus1 = z - 1,
                u = fade(x), v = fade(y), w = fade(z),
                A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z, B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;

            return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),
                grad(p[BA], xMinus1, y, z)),
                lerp(u, grad(p[AB], x, yMinus1, z),
                    grad(p[BB], xMinus1, yMinus1, z))),
                lerp(v, lerp(u, grad(p[AA+1], x, y, zMinus1),
                    grad(p[BA+1], xMinus1, y, z-1)),
                    lerp(u, grad(p[AB+1], x, yMinus1, zMinus1),
                        grad(p[BB+1], xMinus1, yMinus1, zMinus1))));
        }
    }
};


//
// SOCKET INIT
//

var io = require('socket.io').listen(8080);
io.set('log level', 1);


//
// GLOBALS INIT
//

var playerIds = 0,          // Incremental player id counter - should always be unique
    worldWidth = 64,        // How wide the world is
    worldDepth = 64,        // How deep the world is
    size = 128,             // How large the world really is
    terrainSize = size * 2, // How many vertices should each axis contain
    ground = generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .25, 6),    // Ground terrain data
    hills =  generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .75, 35),   // Hills terrain data
    water =  generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .1, 4),     // Water terrain data
    treeLocations = [],     // Random tree locations array
    players = {},           // Players global containerDiv - "key" is player id (eg. players[1].nickname )
    colorPool = makeColorGradient(1.766, 2.966, 3.766, 38, 38, 38, 128, 115, 50);   // Color sequence generated pool of 50 colors

// Generate 50 random tree locations
for(var i = 0; i < 50; i++) {
    treeLocations.push({ x: Math.random() * 256 - 128, y: Math.random() * 256 - 128, rotation: Math.random() * Math.PI });
}


//
// LISTEN FOR CONNECTIONS
//

io.sockets.on('connection', function (socket) {

    // Get the next unique player id
    var id = ++playerIds;

    // Setup the player object
    players[id] = {
        player_id: id,              // Unique ID
        nickname: 'Player '+id,     // Defaults to Player {id}
        hp: 100,                    // Hit points
        color: colorPool[id % colorPool.length],    // Next color in color sequence pool
        start_pos: {  x: Math.random() * 256 - 128, y: Math.random() * 256 - 128, zRotation: 0 },   // Random start x,y
        balls: []   // Tracked balls
    };

    // Get a local reference to the global player object
    var playerData = players[id];

    // Update the player's position to the randomized start position
    playerData.pos = { x: playerData.start_pos.x, y: playerData.start_pos.y, z: null, zRotation: 0 };


    /**
     * Occurs when the client disconnects from the server
     * @var string reason - Optional - reason for disconnecting, not used
     */
    socket.on('disconnect', function (reason) {
        console.log('disconnected', reason);

        // Remove the player's balls (if any remain)
        var unfireData = [];
        for(var i in players[id].balls) {
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
    socket.on('nickname', function(data){
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
    socket.on('unfire', function(data) {
        // If the ball is already tracked handle the removal
        if (players[data.playerId].balls[data.ballId] != null) {

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
    socket.on('respawn', function (data) {
        // Allow respawn if the player is dead
        if (players[id].hp <= 0) {

            // Reset player HP
            players[id].hp = 100;

            // Choose and update the player to a new random spawn point
            var respawnLoc = {  x: Math.random() * 256 - 128, y: Math.random() * 256 - 128, z: null, zRotation: 0 };
            players[id].pos = respawnLoc;

            // Build announcement data
            var respawnInfo = {
                player_id: id,
                hp: players[id].hp,
                pos: respawnLoc
            };

            // Remove the player balls if they have any left in the wild
            var unfireData = [];
            for(var i in players[id].balls) {
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
    socket.on('hit', function(data) {
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
        data: generateHeight( worldWidth, worldHeight ),
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
 * @returns {Float32Array} - Height map array
 *
 * based on http://mrl.nyu.edu/~perlin/noise/
 */
function generateHeight( width, height ) {

    var size = width * height, data = new Float32Array( size ),
        perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

    for ( var i = 0; i < size; i ++ ) {
        data[ i ] = 0
    }

    for ( var j = 0; j < 4; j ++ ) {
        for ( var i = 0; i < size; i ++ ) {
            var x = i % width, y = ~~ ( i / width );
            data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );
        }
        quality *= 5;
    }

    return data;
}


/**
 * Adapted color sequence generator by Jim Bumgardner (http://krazydad.com/tutorials/makecolors.php)
 */
function makeColorGradient(frequency1, frequency2, frequency3, phase1, phase2, phase3, center, width, len)
{
    var pool = [];
    if (len == undefined)      len = 50;
    if (center == undefined)   center = 128;
    if (width == undefined)    width = 127;

    for (var i = 0; i < len; ++i)
    {
        var red = Math.sin(frequency1*i + phase1) * width + center,
            grn = Math.sin(frequency2*i + phase2) * width + center,
            blu = Math.sin(frequency3*i + phase3) * width + center;

        pool.push((Math.floor(red)* 256 * 256) + (Math.floor(grn) * 256) + Math.floor(blu));
    }

    return pool;
}