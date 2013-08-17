'use strict';

Physijs.scripts.worker = 'js/libs/physijs_worker.js';

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

// ***** GLOBAL VARS ***************************************************************************************************

var SHADOW_MAP_WIDTH = 512, SHADOW_MAP_HEIGHT = 512; // 512

var FLATSHADING = true;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;


var camera, plControls, controls, scene, renderer, cameraPlaceholder, cameraPlaceholderHelper, gameCameraTarget, planes, projector;
var horse, castle, player, tree;
var container, stats, physicsStats;

var pauseRotation = false;

var NEAR = 1, FAR = 2000;

var worldWidth = 64;
var worldDepth = 64;

var cube, ground, hills, terrain3, water;
//var sceneHUD, cameraOrtho, hudMaterial;

var light, light2, lightRig, ambient, moon;

var treeGeo, treeMats;

var clock = new THREE.Clock();

var keys = []; // array for storing which keys are up/down

var balls = {}, ballCounter = 0, currentBallCount = 0, maxBallCount = 10;

var hud = {}, notificationHud;

var chaseCamEnabled = true;
var chaseScale = 2.5;
var toggleWatchers = {};
var speed = 8, angleSpeed = 1.25;

var loaded = false;

var mouse = {
    x: null,
    y: null,
    lastX: null,
    lastY: null,
    xDiff: null,
    yDiff: null
};

var socket, playerId, players = {}, deadScreen, nickname;



var CollisionTypes = {
    NOTHING: 0,
    BALL: 1,
    PLAYER: 2,
    TREE: 4,
    BODY: 8,
    GROUND: 16
};

var CollisionMasks = {
    BALL:   CollisionTypes.PLAYER |
            CollisionTypes.TREE |
            CollisionTypes.GROUND, // |
            //CollisionTypes.BODY,

    PLAYER: CollisionTypes.BALL |
            CollisionTypes.BODY,

    TREE:   CollisionTypes.BALL,

    BODY:   CollisionTypes.PLAYER |
            CollisionTypes.GROUND,

    GROUND: CollisionTypes.BALL |
            CollisionTypes.BODY
};



// ***** POINTER LOCK **************************************************************************************************

var wrapperSelector;
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var hasLock = false;

if ( havePointerLock ) {
    var element = document.body;

    var pointerlockchange = function ( event ) {

        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

            if (loaded) {
                //controls.enabled = true;
                hasLock = true;
                clock.start();

                blocker.style.display = 'none';
            }

        } else {

            //controls.enabled = false;
            hasLock = false;
            clock.stop();

            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';

            instructions.style.display = '';

        }

    };

    var pointerlockerror = function ( event ) {

        instructions.style.display = '';

    };

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    instructions.addEventListener( 'click', function ( event ) {

        instructions.style.display = 'none';

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

        if ( /Firefox/i.test( navigator.userAgent ) ) {

            var fullscreenchange = function ( event ) {

                if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                    document.removeEventListener( 'fullscreenchange', fullscreenchange );
                    document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                    element.requestPointerLock();
                }

            };

            document.addEventListener( 'fullscreenchange', fullscreenchange, false );
            document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

            element.requestFullscreen();

        } else {

            element.requestPointerLock();

        }

    }, false );

} else {

    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}

// ***** INIT TIME *****************************************************************************************************

function init() {


    container = document.createElement( 'div' );
    document.body.appendChild( container );





    // EVENTS
    

    
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'keyup', onKeyUp, false );

    //document.addEventListener( 'mousewheel', onMouseScroll, false );
    document.addEventListener( 'mouseup', onMouseUp, false );
    document.addEventListener( 'mousemove', onMouseMove, false );

    wrapperSelector = $('#pagewrapper');
    deadScreen = $('#respawn');
    $('body').mousewheel( onMouseScroll ) ;
    hud.currentBallCount = $('#hud-ammo .current');
    hud.maxBallCount = $('#hud-ammo .max');
    notificationHud = $('#hud-notifications ul');

    $(document).ready(function(){



        $('#loading form').bind('submit', function(e) {
            e.preventDefault();
            var nick = $.trim($('#nickname').val());
            if (nick.match(/^[a-zA-Z0-9_]{3,15}$/)) {
                if (window.io == null) {
                    alert('Hmm. Appears the server is down... might be a fluke :/');
                    window.location.reload();
                    return;
                }
                $('#loading button').unbind('click');
                nickname = nick;
                connect(nick);
                $('#loading .error').hide();
                $('#loading').hide();
            } else {
                $('#loading .error').show().html('<br/>Name must be 3-10 letters or numbers.')
            }
        })

    });

    hud.currentBallCount.text(maxBallCount - currentBallCount);
    hud.maxBallCount.text(maxBallCount);

//    $('body').mouseup( onMouseUp ) ;
//    $('body').mousemove( onMouseMove );
    
    // SCENE

    //scene = new THREE.Scene();
    scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });
    scene.fog = new THREE.Fog( 0xffffff, 1000, FAR );

    scene.setGravity(new THREE.Vector3( 0, 0, -30 ));
    scene.addEventListener(
        'update',
        function() {
            scene.simulate( undefined, 1 );
            physicsStats.update();
        }
    );




    //THREE.ColorUtils.adjustHSV( scene.fog.color, 0.02, -0.15, -0.65 );
    
    
    // SCENE CAMERA

    camera = new THREE.PerspectiveCamera( 45, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
    projector = new THREE.Projector();
    camera.up.y = 0;
    camera.up.z = 1;
    //cameraPlaceholderHelper = new THREE.CameraHelper( camera );
    //scene.add( cameraPlaceholderHelper );


    // LIGHTS

    ambient = new THREE.AmbientLight( 0x000000 );
    scene.add( ambient );

    //light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI, 1 );
    light = new THREE.DirectionalLight( 0xffe0bb, 1.3 );
    light2 = new THREE.DirectionalLight( 0xffe0bb, 1.3 );
    moon = new THREE.DirectionalLight( 0x999999, 0.6 );
    //light.position.set( -1, 0, 0 );
    //light.target.position.set( 0, 0, 0 );

    light.castShadow = true;
    light2.castShadow = false;
    moon.castShadow = true;


    //light.shadowCameraNear = 700;  // 700
    //light.shadowCameraFar = camera.far;  // camera.far
    //light.shadowCameraFov = 50; //50

    light.shadowCameraNear = -256; // -20
    light.shadowCameraFar = 256; // 60
    light.shadowCameraLeft = -128; // -24
    light.shadowCameraRight = 128; // 24
    light.shadowCameraTop = 128; // 24
    light.shadowCameraBottom = -128; // -24

    moon.shadowCameraNear = -256; // -20
    moon.shadowCameraFar = 256; // 60
    moon.shadowCameraLeft = -128; // -24
    moon.shadowCameraRight = 128; // 24
    moon.shadowCameraTop = 128; // 24
    moon.shadowCameraBottom = -128; // -24

//    light.shadowCameraFov = 1;

    light.shadowCameraVisible = false;
    light2.shadowCameraVisible = false;
    moon.shadowCameraVisible = false;

    light.shadowBias = .0001;  // 0.0001
    light.shadowDarkness = 0.25; // 0.5
    moon.shadowDarkness = 0.2

    //light.sunLightPos = new THREE.Vector3(10, 0, 0); //-6, 7, 10 
    
    
    
    light.shadowMapWidth = SHADOW_MAP_WIDTH;
    light.shadowMapHeight = SHADOW_MAP_HEIGHT;

    //scene.add( light );

    lightRig = new THREE.Object3D();
    lightRig.boundRadius = 10;
    lightRig.add(light);
    lightRig.add(light2);
    scene.add( lightRig );
    scene.add( moon );
    
    light.position.set( 10, 0, 0 );
    light2.position.set(0, 0, 10 );
    moon.position.set(0, 0, 10 );
    moon.lookAt(0, 0, 0);
    lightRig.rotation.x = 0.6807; // middle of northern hemisphere ~39deg N latitude


}

function connect(nickname) {
    //
    // SOCKET
    //



    socket = io.connect('http://'+window.location.hostname+':8080');
    socket.on('connected', function(data) {
        console.log('socket connected', data);
        playerId = data.player.player_id;
        console.log('I AM PLAYER ', playerId, nickname);

        //socket.emit('subscribe', params);

        socket.on('disconnect', function(data) {
            alert('Connection dropped - :(');
            window.location.reload();
        });

        socket.emit('nickname', nickname);

        createScene(data);

        // RENDERER

        renderer = new THREE.WebGLRenderer( { antialias: false } );
        renderer.setClearColor( 0x000000, 1); // clearColor: 0x000000, clearAlpha: 1,
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        container.appendChild( renderer.domElement );

        renderer.setClearColor( scene.fog.color, 1 );
        renderer.autoClear = false;

        //
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft =  true;

        // STATS

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;
        container.appendChild( stats.domElement );

        physicsStats = new Stats();
        physicsStats = new Stats();
        physicsStats.domElement.style.position = 'absolute';
        physicsStats.domElement.style.top = '50px';
        physicsStats.domElement.style.zIndex = 100;
        container.appendChild( physicsStats.domElement );


        // TESTING CONTROLS
        //controls = new THREE.TrackballControls(camera, renderer.domElement );

    });

    socket.on('nicknames', function(data){
        console.log("player", data.playerId, "is now known as", data.nickname);
        players[data.playerId].userData.nickname = data.nickname;
        updatePlayerSprite(data.playerId);
        addNotification(data.nickname+' connected');
    });

    socket.on('moves', function (data) {
        //console.log('socket move', data);
        updatePlayer(data.id, data.position);
    });

    socket.on('fires', function (data) {
        //console.log('socket fire', data);
        addBall(
            new THREE.Vector3(data.position.x, data.position.y, data.position.z),
            new THREE.Vector3(data.force.x, data.force.y, data.force.z),
            data.restitution,
            data.sourcePlayerId,
            data.color,
            data.ballId);
    });

    socket.on('unfires', function(data){
        //console.log('unfires', data);
        for (var i in data) {
            deleteBallById(data[i].playerId, data[i].ballId);
        }
    });

    socket.on('hits', function (data) {
//        playerId: player.userData.id,
//        playerSourceId: other_object.userData.playerSourceId,
//        velocity: relative_velocity.length(),
//        newHp: player.userData.hp
        if (data.newHp <= 0) {
            // KILLED
            console.log(' ** PLAYER ' + data.playerId + ' WAS KILLED BY PLAYER ' + data.playerSourceId + ' ***', data);
            var sourceName = data.playerSourceId == playerId ? nickname : players[data.playerSourceId].userData.nickname,
                victimName = '';

            if (data.playerId == playerId) {
                // THIS PLAYER IS NOW DEAD
                player.userData.hp = data.newHp;
                deadScreen.show();
                dropDeadBody(player);
                player.visible = false;
                player.userData.sprite.visible = false;
                victimName = nickname;
            } else {
                players[data.playerId].userData.hp = data.newHp;
                dropDeadBody(players[data.playerId]);
                players[data.playerId].visible = false;
                players[data.playerId].userData.sprite.visible = false;
                victimName = players[data.playerId].userData.nickname;
            }

            addNotification(sourceName +' killed ' + victimName);

        } else {
            // STILL ALIVE
            //console.log(' ** PLAYER ' + data.playerId + ' WAS HIT BY PLAYER ' + data.playerSourceId + ' ***', data);
            if (data.playerId == playerId) {
                player.userData.hp = data.newHp;
            } else {
                players[data.playerId].userData.hp = data.newHp;
            }
        }
        updatePlayerSprite(data.playerId);
    });

    socket.on('respawns', function(data) {
//        console.log('player respawn', data);
//        player_id: id,
//        hp: players[id].hp,
//        pos: respawnLoc
        if (data.player_id == playerId) {
            // SELF RESPAWN
            deletePlayerBalls(playerId);
            player.userData.hp = data.hp;
            player.position.x = data.pos.x;
            player.position.y = data.pos.y;
            player.rotation.z = 0;
            lockPlayerZ();
            player.__dirtyPosition = true;
            player.__dirtyRotation = true;
            player.visible = true;
            player.userData.sprite.visible = true;

        } else {
            players[data.player_id].userData.hp = data.hp;
            updatePlayer(data.player_id, data.pos);
            players[data.player_id].visible = true;
            players[data.player_id].userData.sprite.visible = false;
        }
        updatePlayerSprite(data.player_id);
    });

    socket.on('new_player', function (data) {
        //console.log('player connected', data);
        addPlayer(data);
    });

    socket.on('delete_player', function (data) {
        //console.log('player disconnected', data);
        var name = data == playerId ? nickname : players[data].userData.nickname;
        addNotification(name + ' disconnected');
        deletePlayer(data);
    });
}

function createScene(data) {

    var groundData = data.ground,
        waterData = data.water,
        hillsData = data.hills,
        trees = data.trees,
        startPos = data.player.start_pos,
        playerList = data.players,
        playerColor = data.player.color;

    var size = 128,
        terrainSize = size * 2;

    //
    // WATER
    //


    var texture = THREE.ImageUtils.loadTexture( "img/grass.png" );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 16, 16 );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    texture.needsUpdate = true;

    var planeMaterial = new THREE.MeshPhongMaterial( { color: 0x4D708A, ambient: 0xAFCADE, specular: 0xf5f5f5, shininess: 100, transparent: true, opacity: 0.5, shading: THREE.FlatShading } ); //#554433

    if (!FLATSHADING) {
        planeMaterial = new THREE.MeshPhongMaterial( { map: texture } );
    }

    //var axisGeo= new THREE.PlaneGeometry(terrainSize + 10, terrainSize + 10, 1, 1);
    //window.axis = new THREE.Mesh(axisGeo, new THREE.MeshLambertMaterial( { color: 0x993333, shading: THREE.FlatShading, transparent: true, opacity: 0.5 } ));
    //scene.add(window.axis);

    //var geometry = new THREE.PlaneGeometry( 64 * 2, 64 * 2 );
    //var water = new THREE.Mesh( geometry, planeMaterial );

//    water = createRandomPlane(terrainSize, terrainSize, planeMaterial, .1, 4);
    water = createPlaneFromData(waterData.data, waterData.worldWidth, waterData.worldHeight, waterData.width, waterData.height, planeMaterial, waterData.multiplier, waterData.subtractor );


    //water.position.set( 0, 0, 0 );

    water.castShadow = false;
    water.receiveShadow = true;

    scene.add( water );




    //
    // Terrain
    //

//    var geo = new THREE.PlaneGeometry(terrainSize, terrainSize, 10, 10);
//        //new THREE.CubeGeometry(terrainSize, terrainSize, 1);
//    geo.computeFaceNormals();
//    ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial /*THREE.MeshPhongMaterial*/( { color: 0x557733, shading: THREE.FlatShading }));

    var groundPhysMaterial = Physijs.createMaterial(
        new THREE.MeshLambertMaterial( { color: 0x557733, shading: THREE.FlatShading } ),
        .8, // high friction
        .4 // low restitution
    );

//    ground = createRandomPlane(terrainSize, terrainSize, groundPhysMaterial, .25, 6);
    ground = createPlaneFromData(groundData.data, groundData.worldWidth, groundData.worldHeight, groundData.width, groundData.height, groundPhysMaterial, groundData.multiplier, groundData.subtractor );

    scene.add( ground );

    var hillsPhysMaterial = Physijs.createMaterial(
        new THREE.MeshLambertMaterial( { color: 0xFAD55C, shading: THREE.FlatShading } ),
        .8, // high friction
        .4 // low restitution
    );

//    hills = createRandomPlane(terrainSize, terrainSize, hillsPhysMaterial, .75, 35);
    hills = createPlaneFromData(hillsData.data, hillsData.worldWidth, hillsData.worldHeight, hillsData.width, hillsData.height, hillsPhysMaterial, hillsData.multiplier, hillsData.subtractor );

    //hills.position.z = -10
    scene.add( hills );

    //terrain3 = createRandomPlane(terrainSize, terrainSize, new THREE.MeshLambertMaterial /*THREE.MeshPhongMaterial*/( { color: 0x6E3518, shading: THREE.FlatShading } ), .55, 40);
    //scene.add( terrain3 );
    //hills.position.z = -30

    //planes = [ water, ground, hills, terrain3 ];
    planes = [ water, ground ];

    //
    // CUBE
    //

    var cubeMaterials = [];
//    for (var i=0; i<6; i++) {
//        var img = new Image();
//        img.src = 'img/world-grid'+ i + '.png'; // 0=right, 1=left, 2=top, 3=bottom, 4=front, 5=back
//
//        var tex = new THREE.Texture(img, THREE.UVMapping(), THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
//
//        img.tex = tex;
//        img.onload = function() {
//            this.tex.needsUpdate = true;
//        };
//        var mat = new THREE.MeshPhongMaterial({color: 0xffffff, map: tex});
//        cubeMaterials.push(mat);
//    }

    if (FLATSHADING) {
        cubeMaterials = new THREE.MeshPhongMaterial( {
            color: playerColor,
            ambient: playerColor, // should generally match color
            specular: 0x050505,
            shininess: 100
        } ) ;// new THREE.MeshPhongMaterial( { color: 0xeeeeee } );
    }

    var cubeGeo = new THREE.CubeGeometry( 1, 1, 2, 1, 1, 1 );

    var playerPhysMaterials = Physijs.createMaterial(
        cubeMaterials,
        .8, // high friction
        .4 // low restitution
    );

    player = new Physijs.BoxMesh(
        cubeGeo,
        playerPhysMaterials,
        0
    );

    player.userData.id = data.player.player_id
    player.userData.nickname = nickname;
    player.userData.hp = 100.0;

    // DETECT COLLISIONS WITH OWN BALLS
    player.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
        // `this` has collided with `other_object` with an impact speed of `relative_velocity` and a rotational force of `relative_rotation` and at normal `contact_normal`
        //console.log('self collision with ball sourced from player id:', other_object.userData.sourcePlayerId, 'velocity:', relative_velocity.length(), other_object.userData.sourcePlayerId != playerId ? 'IGNORING' : 'HANDLING');
        if (other_object.userData.sourcePlayerId == playerId) {

            // Update player HP

            // FIXME: this ball won't remove from other player's screens
            socket.emit('unfire', {
                playerId: playerId,
                ballId: other_object.userData.ballId
            });

            deleteBallById(other_object.userData.sourcePlayerId, other_object.userData.ballId);

            currentBallCount--;
            hud.currentBallCount.text(maxBallCount - currentBallCount);

//            socket.emit('hit', {
//                playerId: player.userData.id,
//                playerSourceId: other_object.userData.sourcePlayerId,
//                velocity: relative_velocity.length(),
//                newHp: player.userData.hp
//            })
        }
    });



//    player = new THREE.Mesh( cubeGeo, cubeMaterials);
//    player = new THREE.Mesh( cubeGeo, playerPhysMaterials);
    player.castShadow = true;
    player.receiveShadow = true;


    player.add(camera);

    camera.position.set(0, 3 * chaseScale, 1 * chaseScale + 1);
    camera.lookAt(scene.position);

    var cameraOffset = new THREE.Vector3(0,0,0),
        radius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale)),
        normalizedCameraPos = camera.position.clone().sub(cameraOffset).normalize().multiplyScalar(radius),
        shortRadius = normalizedCameraPos.distanceTo(new THREE.Vector3(0,0,0));

    // Init the chase angle
    chaseAngle = Math.asin((normalizedCameraPos.z) / radius);


    player._physijs.collision_type = CollisionTypes.PLAYER;
    player._physijs.collision_masks = CollisionMasks.PLAYER;

    scene.add( player );

    updatePlayerSprite(playerId);

    // Set x/y
    player.position.x = startPos.x;
    player.position.y = startPos.y;
    lockPlayerZ();
    broadcastPosition();


    // Add current players
    var names = [];
    for (var i in playerList) {
        var p = playerList[i];
        if (p.player_id != playerId) {
            addPlayer(p);
            names.push(p.nickname);
        }
    }
    if (names.length > 0) {
        addNotification('Player'+(names.length == 1 ? '' : 's')+' '+names.join(', ') + ' '+(names.length == 1 ? 'is' : 'are')+' here.');
    } else {
        addNotification('You are all alone in this server. :(');
    }




    //player = cube;

//    setTimeout(function() {
//        camera.lookAt(gameCameraTarget);
//        animate();
//    }, 100);


    //
    // MODEL
    //

    var loader = new THREE.JSONLoader();
    loader.load( "js/models/tree.js", function( geometry, materials ) {
        treeGeo = geometry;

//        var mats = [];
//        for(var i = 0; i < materials.length; i++) {
//            mats[i] = Physijs.createMaterial(materials[i], .5, .1);
//        }

        treeMats = new THREE.MeshFaceMaterial( materials );
        for (var i in treeMats.materials) {
            treeMats.materials[i].shading = THREE.FlatShading;

            if (i == 0) {
                treeMats.materials[i].emissive = treeMats.materials[i].color;
                treeMats.materials[i].emissive.r *= 0.8;
                treeMats.materials[i].emissive.g *= 0.8;
                treeMats.materials[i].emissive.b *= 0.8;
            }
        }
//        tree = new THREE.Mesh( geometry, treeMats );
//        tree.castShadow = true;

        //scene.add(tree);
        //addTree(0, 0);

        // Add a shit load of trees
        //for(var i = 0; i < 50; i++) { addTree(Math.random() * 256 - 128, Math.random() * 256 - 128); }
        for(var i in trees) {
            addTree(trees[i].x, trees[i].y, null, trees[i].rotation);
        }

        //camera.lookAt(gameCameraTarget);
        requestAnimationFrame(render);
        setInterval(ballWatcher, 500);
        setInterval(sendPosition, 25);
        setInterval(cycleNotifications, 3000);

        lockPlayerZ();
    } );




}

// ***** RENDER TIME ***************************************************************************************************

function ballWatcher() {
    for(var i in balls) {
        if (balls[i].userData.sourcePlayerId == playerId &&
            balls[i].position.z < -50) {

            socket.emit('unfire', {
                playerId: playerId,
                ballId: balls[i].userData.ballId
            });

            deleteBallById(balls[i].userData.sourcePlayerId, balls[i].userData.ballId);

            currentBallCount--;
            hud.currentBallCount.text(maxBallCount - currentBallCount);
        }
    }
}

function render() {
    var delta = clock.getDelta();
    animate(delta);
    stats.update();
    scene.simulate(delta);
    renderer.render( scene, camera );

    requestAnimationFrame( render );
}

function animate(delta) {



    if (!hasLock && loaded) {
        return;
    } else if (!loaded) {
        loaded = true;
    }

    updateChaseCamLocation();

    var playerMoved = false,
        playerSpeed = isKeyDown(KEYCODE.SHIFT) ? speed * 2 * delta : speed * delta,
        playerAngleSpeed = Math.PI / 2 * (isKeyDown(KEYCODE.SHIFT) ? 2*angleSpeed : angleSpeed) * delta;


        if (player.userData.hp > 0) {

        if (isKeyDown(KEYCODE.W) && !isKeyDown(KEYCODE.S)) {
            playerMoved = moveIfInBounds(0, -playerSpeed) || playerMoved;
        }

        if (isKeyDown(KEYCODE.S) && !isKeyDown(KEYCODE.W)) {
            playerMoved = moveIfInBounds(0, playerSpeed) || playerMoved;
        }

        if (isKeyDown(KEYCODE.A) && !isKeyDown(KEYCODE.D)) {
            playerMoved = moveIfInBounds(playerSpeed, 0) || playerMoved;
        }

        if (isKeyDown(KEYCODE.D) && !isKeyDown(KEYCODE.A)) {
            playerMoved = moveIfInBounds(-playerSpeed, 0) || playerMoved;
        }

//        if (isKeyDown(KEYCODE.Z)) {
//            //player.position.x -= 0.10;
//
//            player.position.set(0,0,0);
//            player.__dirtyPosition = true;
//            player.__dirtyRotation = true;
//            lockPlayerZ();
//            playerMoved = true;
//        }


        var rotation_matrix = new THREE.Matrix4().identity();
        if (isKeyDown(KEYCODE.LEFT_ARROW) && !isKeyDown(KEYCODE.RIGHT_ARROW)) {
            //player.rotation.x -= Math.PI / 20;
            player.rotateOnAxis( new THREE.Vector3(0,0,1), playerAngleSpeed);
            player.__dirtyRotation = true;
            player.__dirtyPosition = true;
            playerMoved = true;
        }

        if (isKeyDown(KEYCODE.RIGHT_ARROW) && !isKeyDown(KEYCODE.LEFT_ARROW)) {
            //player.rotation.x += Math.PI / 20;
            player.rotateOnAxis( new THREE.Vector3(0,0,1), -playerAngleSpeed);
            player.__dirtyRotation = true;
            player.__dirtyPosition = true;
            playerMoved = true;
        }

//        if (isKeyDown(KEYCODE.SPACE)) {
//            if (!isWaitRequired(KEYCODE.SPACE)) {
//                waitRequired(KEYCODE.SPACE);
//                pauseRotation = !pauseRotation;
//            }
//        }

//        if (isKeyDown(KEYCODE.SHIFT) && isKeyDown(KEYCODE.SPACE)) {
//            lightRig.rotation.y -= 0.01;
//        }

//        if (isKeyDown(KEYCODE.P)) {
//            //cameraPlaceholderHelper.visible = !cameraPlaceholderHelper.visible;
//            light.shadowCameraVisible = !light.shadowCameraVisible;
//        }

//        if (isKeyDown(KEYCODE.L)) {
//            if (!isWaitRequired(KEYCODE.L)) {
//                drawPlayerLazer();
//            }
//        }

//        if (isKeyDown(KEYCODE.B)) {
//            if (!isWaitRequired(KEYCODE.B)) {
//                deleteBalls();
//            }
//        }
    } else {

        if (isKeyDown(KEYCODE.ENTER)) {
            if (!isWaitRequired(KEYCODE.ENTER)) {
                waitRequired(KEYCODE.ENTER);
    //            chaseCamEnabled = !chaseCamEnabled;
    //            if (!chaseCamEnabled) {
    //                if (controls == null) {
    //                    controls = new THREE.TrackballControls(camera, renderer.domElement );
    //                    controls.handleResize();
    //                } else {
    //                    controls.enabled = true;
    //                }
    //            } else {
    //                if (controls != null) {
    //                    controls.enabled = false;
    //                }
    //                camera.up.x = 0;
    //                camera.up.y = 0;
    //                camera.up.z = 1;
    //            }

                if (player.userData.hp < 0) {
                    socket.emit('respawn');
                    deadScreen.hide();
                }
            }
        }
    }


    //light.target.position.copy(cameraPlaceholder.position);  // target the light at the camera
    //light.position.copy(cameraPlaceholder.position).addSelf(light.sunLightPos); // position the light at the camera + offset


    if (!chaseCamEnabled) {
        controls.update();
    }

    if (!pauseRotation) {
        light.updateMatrixWorld();
        light.target.updateMatrixWorld();
        light2.updateMatrixWorld();
        light2.target.updateMatrixWorld();

        lightRig.rotation.y -= .001; // time of day
        light.intensity = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(1.3, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)*2) : 0
        light2.intensity = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(1.3, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)*2) : 0
        light.shadowDarkness = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(0.25, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)/2) : 0

        if (Math.abs(lightRig.rotation.y / Math.PI % 2) < 1) {
            wrapperSelector.css('opacity', 0);
        } else {
            wrapperSelector.css('opacity', 1);
        }

    }

    // Color balls based on speed
//    for(var i in balls) {
//        if (balls[i] == null) {
//            delete balls[i];
//            continue;
//        } else if (balls[i].position.z < -50) {
//            scene.remove(balls[i]);
//            balls[i] = null;
//            delete balls[i];
//            continue;
//        }
//
//        var r = Math.max(0, Math.min(balls[i].getLinearVelocity().length()/10, 1.0)),
//            mod = 1.0 - (r);
//        balls[i].material.color.r = 1;
//        balls[i].material.color.g = mod;
//        balls[i].material.color.b = mod;
//
//    }

    if (playerMoved) {
        lockPlayerZ();
        broadcastPosition();
    }

    //render();
}

// ***** EVENT LISTENERS ***********************************************************************************************

function onWindowResize() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    if (!chaseCamEnabled) {
        controls.handleResize();
    }
}


function onKeyDown(event) {

    if (!hasLock) {
        return;
    }

    keys[event.keyCode] = true;
}

function onKeyUp(event) {

    if (!hasLock) {
        return;
    }

    keys[event.keyCode] = false;
    if (toggleWatchers[event.keyCode] != null) {
        toggleWatchers[event.keyCode] = false;
    }
}

var chaseAngle = 0,
    cameraOffset = new THREE.Vector3(0,0,3);

function onMouseMove(e) {

    if (!hasLock) {
        return;
    }

    var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0,
        movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

    var playerHorizontalAngleSpeed = Math.PI / 180 * -movementX,
        playerVerticalAngleSpeed = Math.PI / 360 * movementY;

    var radius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale)),
        normalizedCameraPos = camera.position.clone().sub(cameraOffset).normalize().multiplyScalar(radius),
        shortRadius = normalizedCameraPos.distanceTo(new THREE.Vector3(0,0,0));


    //var currAngle = Math.asin((normalizedCameraPos.z) / radius);
    var currAngle = chaseAngle,
        angleDiff = (movementY / 25) / radius,
        newAngle = Math.max(-1.5, Math.min(1.5, currAngle + angleDiff));

//    var angle = (movementY/25) / radius;

//    var sumAngle = currAngle + angle;

    var x = Math.cos(newAngle) * radius;
    var y = Math.sqrt(radius * radius - x * x);

    y = newAngle > 0 ? y : -y;

    x = Math.max(x, 0.5);

    //console.log(movementY, radius, currAngle, angle, sumAngle, x, y);

    //player.rotateOnAxis( new THREE.Vector3(0,0,1), playerAngleSpeed);
    player.rotateOnAxis( new THREE.Vector3(0,0,1), playerHorizontalAngleSpeed );
    //camera.rotateOnAxis( new THREE.Vector3(1,0,0), playerVerticalAngleSpeed );

    var oldX = camera.position.x,
        oldY = camera.position.y,
        oldZ = camera.position.z;

    camera.position.set(camera.position.x, x, y);


    // adjust for ground collision
    var cameraWorldPos = (new THREE.Vector3()).getPositionFromMatrix(camera.matrixWorld);
    var origin = player.position.clone(),
        direction = cameraWorldPos.clone().sub(origin);

//    var lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff }),
//        lineGeo = new THREE.Geometry();
//
//    lineGeo.vertices.push(origin);
//    lineGeo.vertices.push(direction);
//    var line = new THREE.Line(lineGeo, lineMat);
//    //console.log(upperZ, lowerZ, origin, direction);
//    scene.add(line);

    //console.log(origin, direction, 0, radius, origin.distanceTo(direction));
    //var r = new THREE.Raycaster(origin, direction, 0, radius + 1);
    var r = new THREE.Raycaster(origin, direction, 0, radius + 1);

    //r.set(origin.clone(), direction.clone());

    var c = r.intersectObjects([ ground, water, hills ], true);
    if (c.length > 0) {
        //drawLine(player.position, c[0].point);

        var localCamPos = player.worldToLocal(c[0].point) ; //,
            //length = localCamPos.length(),
            //newLength = length - 1,
            //newLocalCamPos = localCamPos.normalize().multiplyScalar(newLength);

        //console.log('in da ground', radius, shortRadius, normalizedCameraPos.length(), currAngle, newAngle/*, c[0].point, player.position.distanceTo(c[0].point)*/);

        //drawLine(player.position, localCamPos);

        // TODO FIXME
        //camera.position.copy(c[0].point);
        //camera.position.copy(localCamPos);
        //camera.position.copy(newLocalCamPos);

    } else {
        //console.log('normal', radius, shortRadius, normalizedCameraPos.length(), currAngle, newAngle);
    }


    //console.log('colls', c);


    camera.position.add(cameraOffset);




//    // Test for ground collision
//    var cameraWorldPos = (new THREE.Vector3()).getPositionFromMatrix(camera.matrixWorld);
//    cameraWorldPos.y += camera.position.y - oldY;
//    cameraWorldPos.z += camera.position.z - oldY;
//    var minZ = intersectGround(cameraWorldPos.x, cameraWorldPos.y);
//    if (cameraWorldPos.z < minZ + 1) {
//        //console.log('bounce camera', camera.position.z, minZ + 1);
//        //cameraPos.z = minZ + 1;
//
//        var minCameraLocalPos = camera.worldToLocal(cameraWorldPos.setZ(minZ));
//        var yAdjust = Math.sqrt(radius*radius - minCameraLocalPos.z * minCameraLocalPos.z);
//
//        console.log('below ground!', camera.position, minCameraLocalPos, cameraWorldPos, yAdjust);
//
//        // Find point on the circle for the y intercept
//        // Set point to there
//
//
//        //camera.position.setZ(yAdjust + 1);
//        //camera.position.set(camera.position.x, yAdjust, minCameraLocalPos.z );
//
//        camera.position.set(camera.position.x, oldY, oldZ);
//
//    }

    camera.lookAt(new THREE.Vector3(0,0,0));
    chaseAngle = newAngle;


//    if (camera.rotation.x < -1.7) {
//        camera.rotation.x = -1.7;
//    }
//
//    if (camera.rotation.x > -1) {
//        camera.rotation.x = -1;
//    }


    player.__dirtyRotation = true;
    player.__dirtyPosition = true;

    broadcastPosition();

    // Update
//    mouse.lastX = mouse.x;
//    mouse.lastY = mouse.y;

}

//scroll input handling
function onMouseScroll(event, delta, deltaX, deltaY) {

    if (!hasLock) {
        return;
    }

    var radius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale)),
        normalizedCameraPos = camera.position.clone().sub(cameraOffset).normalize().multiplyScalar(radius),
        shortRadius = normalizedCameraPos.distanceTo(new THREE.Vector3(0,0,0));

    if (deltaY > 0) {
        //scroll up
        //console.log("scrollup");
        if (!chaseCamEnabled) {
            camera.position.multiplyScalar(1.1);
        } else {
            chaseScale = Math.max(0.05, chaseScale - 0.1);
        }
    } else if (deltaY < 0) {
        //scroll down
        //console.log("scrolldown");
        if (!chaseCamEnabled) {
            camera.position.multiplyScalar(0.9);
        } else {
            chaseScale = Math.min(5, chaseScale + 0.1);
        }
    }

    var newAngle = chaseAngle,
        newRadius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale));

    var x = Math.cos(newAngle) * newRadius;
    var y = Math.sqrt(newRadius * newRadius - x * x);

    y = newAngle > 0 ? y : -y;

    x = Math.max(x, 0.5);

    camera.position.set(camera.position.x, x, y);
    camera.position.add(cameraOffset);




//
//    camera.position.set(0, normalizedCameraPos.x, normalizedCameraPos.y);
//
//
//
    camera.lookAt(new THREE.Vector3(0,0,0));


    event.stopPropagation();
    event.preventDefault();
}

function onMouseUp(event) {

    if (!hasLock) {
        return;
    }


    //console.log('down', event);
    event.preventDefault();

    if (player.userData.hp > 0) {
//        if (isKeyDown(KEYCODE.SHIFT)) {
            addBumpber();
//        } else {
//
//            var mouse = {};
//            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//
//            var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
//            projector.unprojectVector(vector, camera);
//            var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
//
//            var intersects = raycaster.intersectObjects([ ground, hills ], true);
//
//            if (intersects.length > 0) {
//                addTree(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z);
//            }
//        }
    }
}


// ***** HELPERS *******************************************************************************************************

function addPlayer(data) {
    var id = data.player_id,
        startPos = data.start_pos,
        currentPos = data.pos,
        color = data.color,
        nickname = data.nickname;

    var cubeMaterials = new THREE.MeshPhongMaterial( {
            color: color,
            ambient: color, // should generally match color
            specular: 0x050505,
            shininess: 100
        } ) ;// new THREE.MeshPhongMaterial( { color: 0xeeeeee } );

    var cubeGeo = new THREE.CubeGeometry( 1, 1, 2, 1, 1, 1 );

    var playerPhysMaterials = Physijs.createMaterial(
        cubeMaterials,
        .8, // high friction
        .4 // low restitution
    );

    var player = new Physijs.BoxMesh(
        cubeGeo,
        playerPhysMaterials,
        0
    );

    player.userData.hp = data.hp;
    player.userData.id = id;
    player.userData.start_pos = startPos;
    player.userData.nickname = nickname;

    player.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
        // `this` has collided with `other_object` with an impact speed of `relative_velocity` and a rotational force of `relative_rotation` and at normal `contact_normal`
        // Only handle collisions for balls the local player fired
        //console.log('remote player collision with ball sourced from player id:', other_object.userData.sourcePlayerId, 'velocity:', relative_velocity.length(), other_object.userData.sourcePlayerId == playerId ? 'HANDLING' : 'IGNORING');
        if (other_object.userData.sourcePlayerId == playerId) {

            // Update player HP
            if (player.userData.hp > 0) {
                player.userData.hp -= relative_velocity.length();

                //console.log('ouch!', player, player.userData.id, relative_velocity, relative_velocity.length(), player.userData.hp);

                socket.emit('hit', {
                    playerId: player.userData.id,
                    playerSourceId: other_object.userData.sourcePlayerId,
                    velocity: relative_velocity.length(),
                    newHp: player.userData.hp
                });

                socket.emit('unfire', {
                    playerId: playerId,
                    ballId: other_object.userData.ballId
                });

                // FIXME: this ball won't remove from other player's screens

                if (player.userData.hp <= 0) {
    //                player.position.set(player.userData.start_pos.x, player.userData.start_pos.y, 0);
    //                player.__dirtyPosition = true;
    //                player.__dirtyRotation = true;
    //                lockPlayerZ(player);
    //                player.userData.hp = 100;
                    //console.log(' *** PLAYER ' + player.userData.id + ' ('+player.userData.nickname+') WAS KILLED BY PLAYER '+ other_object.userData.sourcePlayerId + ' *** ');

                    dropDeadBody(player);
                    player.visible = false;
                    player.userData.sprite.visible = false;
                    addNotification(window.nickname +' killed ' + player.userData.nickname);
                }

                deleteBallById(other_object.userData.sourcePlayerId, other_object.userData.ballId);

                currentBallCount--;
                hud.currentBallCount.text(maxBallCount - currentBallCount);

                updatePlayerSprite(player.userData.id);
            }
        }
    });



//    player = new THREE.Mesh( cubeGeo, cubeMaterials);
//    player = new THREE.Mesh( cubeGeo, playerPhysMaterials);
    player.castShadow = true;
    player.receiveShadow = true;

    player._physijs.collision_type = CollisionTypes.PLAYER;
    player._physijs.collision_masks = CollisionMasks.PLAYER;

    // Set x/y
    player.position.x = currentPos.x;
    player.position.y = currentPos.y;
    if (currentPos.z == null) {
        lockPlayerZ(player);
    } else {
        player.position.z = currentPos.z;
    }

    scene.add( player );

    players[id] = player;

    updatePlayerSprite(id);

}

function updatePlayer(id, position) {
    var p = players[id];
    if (p != null) {
        p.position.x = position.x;
        p.position.y = position.y;
        if (position.z != null) {
            p.position.z = position.z;
        } else {
            lockPlayerZ(p);
        }
        if (position.zRotation != null) {
            p.rotation.z = position.zRotation;
        }
        p.__dirtyPosition = true;
        p.__dirtyRotation = true;
    }
}

function deletePlayer(id) {
    var p = players[id];
    if (p != null) {
        scene.remove(players[id]);
        players[id] = null;
        delete players[id];
    }
}

var positionToBroadcast = null;

function broadcastPosition() {
    positionToBroadcast = {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        zRotation: player.rotation.z
    };
}

function sendPosition() {
    if (positionToBroadcast != null) {
        socket.emit('move', positionToBroadcast);
        positionToBroadcast = null;
    }
}

function updateChaseCamLocation() {
    if (chaseCamEnabled) {
//        var relativeCameraOffset = new THREE.Vector3(0, 3 * chaseScale, 1 * chaseScale);
//        var cameraOffset = relativeCameraOffset.applyMatrix4(player.matrixWorld);
//        camera.position.x = cameraOffset.x;
//        camera.position.y = cameraOffset.y;
//        camera.position.z = cameraOffset.z;
//
        // Test for ground collision
//        var cameraPos = player.position.clone().add(camera.position);
//        var minZ = intersectGround(cameraPos.x, cameraPos.y);
//        if (cameraPos.z < minZ + 1) {
//            //console.log('bounce camera', camera.position.z, minZ + 1);
//            cameraPos.z = minZ + 1;
//
//        }
//
//
//        var target = player.position.clone();
//        target.z += 2;
//        camera.position.z += 2;
//        camera.lookAt(target);
//        //console.log(camera.rotation);


//        var radius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale));
//
//
//
//        // Test for ground collision
//        var cameraWorldPos = (new THREE.Vector3()).getPositionFromMatrix(camera.matrixWorld);
//        var minZ = intersectGround(cameraWorldPos.x, cameraWorldPos.y);
//        if (cameraWorldPos.z < minZ + 1) {
//            //console.log('bounce camera', camera.position.z, minZ + 1);
//            //cameraPos.z = minZ + 1;
//
//            var minCameraLocalPos = camera.worldToLocal(cameraWorldPos.setZ(minZ));
//            var yAdjust = Math.sqrt(radius*radius - minCameraLocalPos.z * minCameraLocalPos.z);
//
//            console.log('below ground!', camera.position, minCameraLocalPos, cameraWorldPos, yAdjust);
//
//            // Find point on the circle for the y intercept
//            // Set point to there
//
//
//            //camera.position.setZ(yAdjust + 1);
//            camera.position.set(camera.position.x, yAdjust, minCameraLocalPos.z );
//
//        }
//
//        camera.lookAt(new THREE.Vector3(0,0,0));

    }
}

function createRandomPlane(x, y, material, multiplier, subtractor) {
    var data = generateHeight( worldWidth, worldDepth );
    data = Array.prototype.slice.call(data);
    return createPlaneFromData(data, worldWidth, worldDepth, x, y, material, multiplier, subtractor);

}

function createPlaneFromData(data, worldWidth, worldDepth, width, height, material, multiplier, subtractor) {

    //console.log(data, worldWidth, worldDepth, width, height,multiplier,subtractor);

    var floatData = new Float32Array(data.length);
    for (var i = 0; i < data.length; i++) {
        floatData[i] = data[i];
    }

    var terrainGeometry = new THREE.Plane3RandGeometry( width, height, worldWidth - 1, worldDepth - 1 );

    for ( var i = 0, l = terrainGeometry.vertices.length; i < l; i ++ ) {
        terrainGeometry.vertices[ i ].z = floatData[ i ] * multiplier - subtractor;
    }

    terrainGeometry.computeFaceNormals();
    terrainGeometry.computeVertexNormals();
    terrainGeometry.computeCentroids();

    //var t = new THREE.Mesh( terrainGeometry, material  );
    var t = new Physijs.HeightfieldMesh(terrainGeometry, material, 0, worldWidth - 1, worldDepth - 1);
    t.castShadow = true;
    t.receiveShadow = true;
    t._physijs.collision_type = CollisionTypes.GROUND;
    t._physijs.collision_masks = CollisionMasks.GROUND;
    return t;
}

function addBall(position, force, restitution, playerId, color, ballId) {
    var bumperGeo = new THREE.SphereGeometry( 0.25, 6, 6 );
    var bumperMat = Physijs.createMaterial(
        new THREE.MeshLambertMaterial( { color: color, shading: THREE.FlatShading } ),
        .8, // high friction
        //.4 // low restitution
        restitution
    );

    var bumper = new Physijs.SphereMesh(
        bumperGeo,
        bumperMat,
        1.1//,
        //{ restitution: Math.random() * 1.5 }
    );

    bumper.position.copy(position);

    bumper.receiveShadow = true;
    //bumper.castShadow = true;
    bumper.up.x = 0; bumper.up.y = 0; bumper.up.z = 1;

    bumper.addEventListener( 'ready', function() {
        bumper.applyCentralImpulse(force)
    } );


    bumper.userData.sourcePlayerId = playerId;
    bumper.userData.ballId = ballId;
    bumper._physijs.collision_type = CollisionTypes.BALL;
    bumper._physijs.collision_masks = CollisionMasks.BALL;
    scene.add( bumper );

    bumper.updateMatrixWorld();
    bumper.updateMatrix();

    //balls.push(bumper);
    balls['p'+playerId+'b'+ballId] = bumper;
}

function addBumpber() {

    if (currentBallCount >= maxBallCount) {
        return;
    }

    currentBallCount++;
    hud.currentBallCount.text(maxBallCount - currentBallCount);

    var position = player.position.clone(),
     restitution = Math.min(1, Math.max(.4, Math.random() * 1.5));

    position.z += 2;

    var force = new THREE.Vector3(0, -30 + (chaseAngle * 10), 10 + (-chaseAngle) * 10), //bumper.matrix.multiplyVector3(new THREE.Vector3(0,.0000001,.00000001 )),
        rotation = player.rotation.clone();

    force.applyEuler(rotation);

    var eventData = {
        sourcePlayerId: playerId,
        force: force,
        position: position,
        restitution: restitution,
        ballId: ++ballCounter
    };

    socket.emit('fire', eventData);

    addBall(
        position,
        force,
        restitution,
        playerId,
        player.material.color,
        eventData.ballId);

    return;

//    var bumperMat = Physijs.createMaterial(
//        new THREE.MeshLambertMaterial( { color: 0xCCCCCC, shading: THREE.FlatShading } ),
//        .8, // high friction
//        //.4 // low restitution
//        restitution
//    );
//
//    var bumper = new Physijs.SphereMesh(
//        bumperGeo,
//        bumperMat,
//        1.1//,
//        //{ restitution: Math.random() * 1.5 }
//    );
//
//    bumper.position.x = player.position.x;
//    bumper.position.y = player.position.y;
//    bumper.position.z = player.position.z + 2;
//
//    bumper.receiveShadow = true;
//    //bumper.castShadow = true;
//    bumper.up.x = 0; bumper.up.y = 0; bumper.up.z = 1;
//    bumper.userData.sourcePlayerId = playerId;
//
//
//    var force = new THREE.Vector3(0, -30 + (chaseAngle * 10), 10 + (-chaseAngle) * 10), //bumper.matrix.multiplyVector3(new THREE.Vector3(0,.0000001,.00000001 )),
//        rotation = player.rotation.clone();
//
//    force.applyEuler(rotation);
//
//    bumper.addEventListener( 'ready', function() {
//        bumper.applyCentralImpulse(force)
//    } );
//
//    var eventData = {
//        sourcePlayerId: playerId,
//        force: force,
//        position: bumper.position,
//        restitution: bumper.material
//    };
//
//    socket.emit('fire', eventData);
//
//    scene.add( bumper );
//
//    bumper.updateMatrixWorld();
//    bumper.updateMatrix();
//
//    drawPlayerLazer();
//
//    balls.push(bumper);

}

function addTree(x, y, z, rotation) {
    if (z == null) {
        var c = intersectGroundObjs(x, y);
        //console.log(x,y,z);
        if (c.length > 0 && c[0].object != water) {

            // Tree model
            var tree = new THREE.Mesh( treeGeo, treeMats );
            tree.castShadow = true;
            var roationAmt = rotation != null ? rotation : Math.random() * Math.PI;

            // Container and hit boxes
            var treeContainerGeo = new THREE.CubeGeometry(1.25, 1.25, .25, 1, 1, 1 );
            var treeBoxGeo = new THREE.CubeGeometry(.742, .742, 5, 1, 1, 1 );
            var treeLeafBoxGeo = new THREE.CubeGeometry(1.38 * 2, 1.64 * 2, 1 * 2, 1, 1, 1 );

            // Invisible hit boxes
            var treeBoxMat = Physijs.createMaterial(
                new THREE.MeshPhongMaterial( {
                    color: 0x996633,
                    transparent: true,
                    opacity: 0
                } ),
                .8, // high friction
                .4 // low restitution
            );

            var treeContainer = new Physijs.BoxMesh(
                treeContainerGeo,
                treeBoxMat,
                0
            );

            var treeBox = new Physijs.BoxMesh(
                treeBoxGeo,
                treeBoxMat,
                0
            );

            var treeLeafBox = new Physijs.BoxMesh(
                treeLeafBoxGeo,
                treeBoxMat,
                0
            );


            treeBox._physijs.collision_type = CollisionTypes.TREE;
            treeBox._physijs.collision_masks = CollisionMasks.TREE;

            treeLeafBox._physijs.collision_type = CollisionTypes.TREE;
            treeLeafBox._physijs.collision_masks = CollisionMasks.TREE;


            treeContainer.position = new THREE.Vector3(x, y, c[0].point.z);
            treeContainer.add(treeBox);
            treeContainer.add(treeLeafBox);
            treeContainer.add(tree);

            treeContainer.rotation.z = roationAmt;
            treeBox.rotation.y = 0.104719755;
            treeLeafBox.rotation.z = -0.296705973;

            treeBox.position.add(new THREE.Vector3(.25631, .16644, 5.49535 / 2 ));
            treeLeafBox.position.add(new THREE.Vector3(-0.16796, -0.05714, 4.59859));

            scene.add(treeContainer);
        }
    } else {
        //var tree = new THREE.Mesh( treeGeo, treeMats );
//        var tree = new Physijs.BoxMesh(
//            treeGeo,
//            treeMats,
//            0 // mass is immobile
//        );
//        tree.castShadow = true;
//        tree.position = new THREE.Vector3(x, y, z);
//        tree.rotation.z = rotation != null ? rotation : Math.random() * Math.PI;
//
//        scene.add(tree);
    }
}


function isKeyDown(args) { 
    if (typeof args === 'number') { 
        // 'args' is a single key, eg. KEYCODE.A : 65
        if (keys[args] != null) {
            return keys[args];
        } else {
            return false;
        }
    } else if ( (typeof args === 'object' ) && args.isArray ) {
        // 'args' is a an array of keys

        for (var i=0; i<args.length; i++) {
            if ((keys[args[i]] != null) && (keys[args[i]])) {
                // do nothing, keep looping
            } else {
                // if any of the keys are null or not down
                return false;
            }
        }
        // all keys are down
        return true;  
    } else {    
        return false;
    }
}   


function lockPlayerZ(specificPlayer) {

    var p = specificPlayer || player;
    var z = intersectGround(p.position.x, p.position.y);
    if (z != null) {
        var diff = z - p.position.z + 1;
        //player.position.z += diff;
        p.translateZ(diff);
        p.__dirtyPosition = true;
        p.__dirtyRotation = true;
    }
}

function intersectGround(x, y) {

    var c = intersectGroundObjs(x, y);

    if (c.length > 0) {
        var zMax = null;
        for(var i = 0; i < c.length; i++) {
            //console.log(c[i], c[i].object == ground, c[i].object == water);
            if (zMax == null) {
                zMax = c[i].point.z;
            } else {
                if (zMax < c[i].point.z) {
                    zMax = c[i].point.z;
                }
            }
        }
        return zMax;
    }

    return null;
}

function intersectGroundObjs(x, y) {
    var rayLength = 1000,
        upperZ = rayLength / 2,
        lowerZ = upperZ * -1,
        origin = new THREE.Vector3(x, y, upperZ),
        direction = new THREE.Vector3( x, y, lowerZ),
        near = -1 * rayLength,
        far = rayLength;

//    var lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff }),
//        lineGeo = new THREE.Geometry();
//
//    lineGeo.vertices.push(origin);
//    lineGeo.vertices.push(direction);
//    var line = new THREE.Line(lineGeo, lineMat);
//    //console.log(upperZ, lowerZ, origin, direction);
//    scene.add(line);

    var r = new THREE.Raycaster(origin.clone(), direction.clone().sub(origin.clone()).normalize());

    //r.set(origin.clone(), direction.clone());

    var c = r.intersectObjects([ ground, water, hills ], true);


    //console.log('colls', c);

    return c;
}

function isWaitRequired(key) {
    if (toggleWatchers[key] != null) {
        return toggleWatchers[key];
    } else {
        return false;
    }
}

function waitRequired(key, timeout) {
    toggleWatchers[key] = true;
    if (timeout != null && timeout > 0) {
        setTimeout(function() { toggleWatchers[key] = false; }, timeout);
    }
}

function drawPlayerLazer() {

    var origin = (new THREE.Vector3()).getPositionFromMatrix(camera.matrixWorld),
        target = player.position.clone(),
        direction = target.clone().sub(origin),
        dest = target.clone().add(direction);




    //rotation.x = -rotation.x;

    target.z += 1;
    dest.z += 1;

    //var direction = new origin.clone().sub(target),
        //newTarget =


    drawLine(target, dest);
}

function drawLazer(mesh) {

    var origin = mesh.position.clone(),
        originMatrix = mesh.matrix;


    var direction = new THREE.Vector3(0, -10, 0),
        target = direction.applyMatrix4(originMatrix);

    drawLine(origin, target);
}

function drawLine(v1, v2) {
    var lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff }),
        lineGeo = new THREE.Geometry();

    lineGeo.vertices.push(v1);
    lineGeo.vertices.push(v2);
    var line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
}

function deleteBalls() {
    for(var i in balls) {
        scene.remove(balls[i]);
        balls[i] = null;
        delete balls[i];
    }
}

function deleteBallById(playerId, ballId) {
    var key = 'p'+playerId+'b'+ballId;
    if (balls[key] != null) {
        scene.remove(balls[key]);
        balls[key] = null;
        delete balls[key];
    }
}

function deletePlayerBalls(targetPlayerId) {
    var keyPrefix = 'p'+targetPlayerId+'b';
    for(var i in balls) {
        if (i.substr(0, keyPrefix.length) == keyPrefix) {
            scene.remove(balls[i]);
            balls[i] = null;
            delete balls[i];
            if (playerId == targetPlayerId) {
                currentBallCount--;
            }
        }
    }
    hud.currentBallCount.text(maxBallCount - currentBallCount);
}

function makeTextSprite( nickname, hp ) {

    var canvas = document.createElement('canvas');
    var size = 512,
        hpSize = 100,
        hpOffset = 20,
        hpWidth = Math.max(0, Math.round(hp)),
        hpHeight = 10,
        fontSize = 24,
        paddingHeight = 10,
        paddingWidth = 10;
    canvas.width = size;
    canvas.height = size;
    var context = canvas.getContext('2d');

    context.textAlign = 'center';
    context.font = fontSize+'px Arial';
    context.fillStyle = "rgba(50, 50, 50, 0.25)"; // CHANGED
    var textWidth = context.measureText(nickname).width;
    context.fillRect(
        size/2 - textWidth/2 - paddingWidth,
        size/2 - (fontSize*1.6) / 2 - paddingHeight,
        textWidth + paddingWidth*2,
        fontSize + paddingHeight*2
    );

    context.fillStyle = '#ffffff'; // CHANGED
    context.fillText(nickname, size / 2, size / 2);

    // hp bars
    context.fillStyle = "rgba(204, 31, 31, 1)"; // CHANGED
    context.fillRect(
        size/2 - hpSize/2,
        size/2 - hpHeight/2 + hpOffset,
        hpSize,
        hpHeight
    );

    context.fillStyle = "rgba(16, 189, 0, 1)"; // CHANGED
    context.fillRect(
        size/2 - hpSize/2,
        size/2 - hpHeight/2 + hpOffset,
        hpWidth,
        hpHeight
    );


    var amap = new THREE.Texture(canvas);
    amap.needsUpdate = true;

    var mat = new THREE.SpriteMaterial({
        map: amap,
        transparent: false,
        useScreenCoordinates: false,
        color: 0xffffff // CHANGED
    });

    var sp = new THREE.Sprite(mat);
    sp.scale.set( 10, 10, 1 ); // CHANGED
    return sp;
}

function updatePlayerSprite(id) {
    var p = id == playerId ? player : players[id];
    if (p != null) {

        // Remove the old one
        if (p.userData.sprite != null) {
            p.remove(p.userData.sprite);
        }

        // Add the new one
        p.userData.sprite = makeTextSprite(p.userData.nickname, p.userData.hp );
        p.userData.sprite.position.set(0, 0, 2);
        p.add( p.userData.sprite );

    } else {
        console.error('cannot update sprite cuz player is missing?');
    }
}

function isBetween(n, min, max) {
    return (min < n) && (n < max);
}

function moveIfInBounds(xTranslation, yTranslation) {
    var oldPos = player.position.clone(),
        width = worldWidth * 2,
        depth = worldDepth * 2;

    player.translateX(xTranslation);
    player.translateY(yTranslation);

    if (!isBetween(player.position.x, -width, width) ||
        !isBetween(player.position.y, -depth, depth)) {
        player.position.copy(oldPos);
        return false;
    } else {
        player.__dirtyPosition = true;
        player.__dirtyRotation = true;
        return true;
    }

}

function dropDeadBody(targetPlayer) {

    var cubeMaterials = new THREE.MeshPhongMaterial( {
        color: targetPlayer.material.color,
        ambient: targetPlayer.material.color, // should generally match color
        specular: 0x050505,
        shininess: 100
    } ) ;// new THREE.MeshPhongMaterial( { color: 0xeeeeee } );

    var cubeGeo = new THREE.CubeGeometry( 1, 1, 2, 1, 1, 1 );

    var playerPhysMaterials = Physijs.createMaterial(
        cubeMaterials,
        .8, // high friction
        .4 // low restitution
    );

    var body = new Physijs.BoxMesh(
        cubeGeo,
        playerPhysMaterials,
        0.5
    );


    body.castShadow = true;
    body.receiveShadow = true;
    body._physijs.collision_type = CollisionTypes.BODY;
    body._physijs.collision_masks = CollisionMasks.BODY;

    body.matrix.copy(targetPlayer.matrix);
    body.matrixWorld.copy(targetPlayer.matrixWorld);
    body.position.copy(targetPlayer.position);

    //body.add(targetPlayer.userData.sprite.clone());

    scene.add( body );

}

function addNotification(message) {
    $('<li>'+message+'</li>').data('added', Date.now()).appendTo(notificationHud);
}

function cycleNotifications() {
    var activeNotifications = $('li', notificationHud);
    if (activeNotifications.length > 0) {

        var n = $(activeNotifications[0]);
        if (Date.now() - n.data('added') > 3000) {
            n.css('margin-top', -38);
            setTimeout(function() {
                n.remove();
            }, 1000);
        }
    }
}

// ***** RUN TIME ******************************************************************************************************

init();