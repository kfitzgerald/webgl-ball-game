


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

        var h = hash & 15;
        var u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);

    }

    return {

        noise: function (x, y, z) {

            var floorX = ~~x, floorY = ~~y, floorZ = ~~z;

            var X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;

            x -= floorX;
            y -= floorY;
            z -= floorZ;

            var xMinus1 = x -1, yMinus1 = y - 1, zMinus1 = z - 1;

            var u = fade(x), v = fade(y), w = fade(z);

            var A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z, B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;

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


var io = require('socket.io').listen(8080);
io.set('log level', 1);

var playerIds = 0,
    worldWidth = 64,
    worldDepth = 64,
    size = 128,
    terrainSize = size * 2,
    ground = generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .25, 6),
    hills =  generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .75, 35),
    water =  generateTerrainPlaneData(worldWidth, worldDepth, terrainSize, terrainSize, .1, 4),
    treeLocations = [],
    players = {},
    colorPool = makeColorGradient(1.766, 2.966, 3.766, 38, 38, 38, 128, 115, 50);

for(var i = 0; i < 50; i++) {
    treeLocations.push({ x: Math.random() * 256 - 128, y: Math.random() * 256 - 128, rotation: Math.random() * Math.PI });
}



io.sockets.on('connection', function (socket) {

    var id = ++playerIds;
    players[id] = {
        player_id: id,
        nickname: 'Player '+id,
        hp: 100,
        color: colorPool[id % colorPool.length],
        start_pos: {  x: Math.random() * 256 - 128, y: Math.random() * 256 - 128, zRotation: 0 },
        balls: []
    };
    var playerData = players[id];
    playerData.pos = { x: playerData.start_pos.x, y: playerData.start_pos.y, z: null, zRotation: 0 };

    // Hopefully, when a client disconnects we can kill the redis used by it.
    socket.on('disconnect', function (reason) {
        console.log('disconnected', reason);

        // Remove the player balls
        var unfireData = [];
        for(var i in players[id].balls) {
            unfireData.push({
                playerId: id,
                ballId: i
            });
        }

        if (unfireData.length > 0) {
            socket.broadcast.emit("unfires", unfireData);
        }

        // Remove the player
        delete players[id];
        socket.broadcast.emit('delete_player', playerData.player_id);
        console.log('players are now', players);
    });

    socket.on('nickname', function(data){
        console.log('nickname', data);
        if (data.length > 3) {
            players[id].nickname = data;
            socket.broadcast.emit('nicknames', {
                playerId: id,
                nickname: data
            });
        }
    });

    socket.on('move', function (data) {
        if (players[id].hp > 0) {
            //console.log('move', id, data);
            players[id].pos = data;
            socket.broadcast.emit("moves", { id: id, position: data });
        }
    });

    socket.on('fire', function (data) {
        if (players[id].hp > 0) {
            console.log('fire', data);
            data.color = players[id].color;
            players[id].balls[data.ballId] = data;
            socket.broadcast.emit("fires", data);
        }
    });

    socket.on('unfire', function(data) {
        if (players[data.playerId].balls[data.ballId] != null) {
            console.log('unfire', data);
            delete players[data.playerId].balls[data.ballId];

            socket.broadcast.emit("unfires", [{
                playerId: data.playerId,
                ballId: data.ballId
            }]);
        }
    });


    socket.on('respawn', function (data) {
        // Allow if dead
        if (players[id].hp <= 0) {
            players[id].hp = 100;
            var respawnLoc = {  x: Math.random() * 256 - 128, y: Math.random() * 256 - 128, z: null, zRotation: 0 };
            players[id].pos = respawnLoc;

            var respawnInfo = {
                player_id: id,
                hp: players[id].hp,
                pos: respawnLoc
            };

            // Remove the player balls
            var unfireData = [];
            for(var i in players[id].balls) {
                unfireData.push({
                    playerId: id,
                    ballId: i
                });
            }

            if (unfireData.length > 0) {
                socket.broadcast.emit("unfires", unfireData);
            }

            socket.emit('respawns', respawnInfo)
            socket.broadcast.emit('respawns', respawnInfo);
        }
    });

    socket.on('hit', function(data) {
        // Accept hits if alive
        if (players[data.playerId].hp > 0) {
            console.log('player hit', data);

            players[data.playerId].hp = data.newHp;
            if (data.newHp < 0) {
                console.log('player killed', data.playerId);
            }

            socket.broadcast.emit('hits', data);
        }
    });

    socket.emit('connected', {
        player: playerData,
        ground: ground,
        hills: hills,
        water: water,
        trees: treeLocations,
        players: players
    }); // Tell the client it's safe to subscribe - might pack in some state stuff here later

    console.log('connected', playerData);
    socket.broadcast.emit('new_player', playerData);
    console.log('players are now', players);
});

function generateTerrainPlaneData(worldWidth, worldHeight, width, height, multiplier, subtractor) {
    return {
        data: Float32ArrayToArray(generateHeight( worldWidth, worldHeight )),
        width: width,
        height: height,
        worldWidth: worldWidth,
        worldHeight: worldHeight,
        multiplier: multiplier,
        subtractor: subtractor
    };
}

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

function Float32ArrayToArray(data) {
//    var newData = [];
//    for(var i = 0; i < data.length; i++) {
//        newData[i] = data[i];
//    }
//    return newData;
    return Array.prototype.slice.call(data);
}

//function geRandomColor() {
//    var letters = '0123456789ABCDEF'.split('');
//    var color = '#';
//    for (var i = 0; i < 6; i++ ) {
//        color += letters[Math.round(Math.random() * 15)];
//    }
//    return color;
//}
//
//function rainbow(numOfSteps, step) {
//    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
//    // Adam Cole, 2011-Sept-14
//    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
//    var r, g, b;
//    var h = step / numOfSteps;
//    var i = ~~(h * 6);
//    var f = h * 6 - i;
//    var q = 1 - f;
//    switch(i % 6){
//        case 0: r = 1, g = f, b = 0; break;
//        case 1: r = q, g = 1, b = 0; break;
//        case 2: r = 0, g = 1, b = f; break;
//        case 3: r = 0, g = q, b = 1; break;
//        case 4: r = f, g = 0, b = 1; break;
//        case 5: r = 1, g = 0, b = q; break;
//    }
//    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
//    return (c);
//}

function makeColorGradient(frequency1, frequency2, frequency3, phase1, phase2, phase3, center, width, len)
{
    var pool = [];
    if (len == undefined)      len = 50;
    if (center == undefined)   center = 128;
    if (width == undefined)    width = 127;

    for (var i = 0; i < len; ++i)
    {
        var red = Math.sin(frequency1*i + phase1) * width + center;
        var grn = Math.sin(frequency2*i + phase2) * width + center;
        var blu = Math.sin(frequency3*i + phase3) * width + center;
        pool.push((Math.floor(red)* 256 * 256) + (Math.floor(grn) * 256) + Math.floor(blu));
    }

    return pool;
}