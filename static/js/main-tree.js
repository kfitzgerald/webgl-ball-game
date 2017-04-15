'use strict';

/**
 * WebGL Ball Game Client
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




// Set physijs's Web Worker script path
Physijs.scripts.worker = 'js/libs/physijs_worker.js';

// Use Detector.js to display the "womp womp" screen if browser sux
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

// *********************************************************************************************************************
// ***** GLOBAL VARS ***************************************************************************************************
// *********************************************************************************************************************

    // screen size
var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,

    // lighting shadow map sizes
    SHADOW_MAP_WIDTH = 512,
    SHADOW_MAP_HEIGHT = 512,

    // Camera rendering range
    NEAR = 1,
    FAR = 2000,
    chaseScale = 2.5,
    chaseAngle = 0,
    cameraOffset = new THREE.Vector3(0,0,3),

    // Movement speeds
    speed = 8,
    angleSpeed = 1.25,

    worldWidth = 64,
    worldDepth = 64,

    // Ball config
    ballCounter = 0,
    currentBallCount = 0,
    maxBallCount = 10,

    // Bitwise flags for elements that can collide (for ammo.js / bullet)
    CollisionTypes = {
        NOTHING: 0,
        BALL: 1,
        PLAYER: 2,
        TREE: 4,
        BODY: 8,
        GROUND: 16
    },

    // Collison masks for ammo.js / bullet
    // Masks must reference each other to be effective
    // e.g. ball -> player ; player -> ball
    // http://www.bulletphysics.org/mediawiki-1.5.8/index.php?title=Collision_Filtering
    CollisionMasks = {
        BALL:   CollisionTypes.PLAYER |
                CollisionTypes.TREE |
                CollisionTypes.GROUND,

        PLAYER: CollisionTypes.BALL |
                CollisionTypes.BODY,

        TREE:   CollisionTypes.BALL,

        BODY:   CollisionTypes.PLAYER |
                CollisionTypes.GROUND,

        GROUND: CollisionTypes.BALL |
                CollisionTypes.BODY
    },

    // Core scene elements
    camera, controls, scene, renderer,
    clock = new THREE.Clock(),

    // jQuery Selectors / DOM references
    containerDiv, deadScreen,
    hud = {}, notificationHud,

    // Stats plugins
    stats, physicsStats,

    // Flags and interactions
    loaded = false,         // true when pointer lock is enabled and animate has called once
    pauseRotation = false,  // (pauses light rotation)
    keys = [],              // array for storing which keys are up/down
    chaseCamEnabled = true, // currently only the chase cam works, free look broke
    toggleWatchers = {},    // holds what keys are pressed until they're released

    // Scene elements
    player, balls = {}, players = {},

    // Terrain elements
    ground, hills, water,

    // Lighting elements
    light, light2, lightRig, ambient, moon,

    // Tree geometry and materials, loaded from the model
    treeGeo, treeMats,

    // Client-player info
    playerId, nickname,

    // Networking
    socket, positionToBroadcast = null,

    // Pointer lock stuff
    // (https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html)
    skyUnderlay,
    blocker = document.getElementById( 'blocker'),
    instructions = document.getElementById( 'instructions'),
    havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document,
    hasLock = false
;



// *********************************************************************************************************************
// ***** POINTER LOCK **************************************************************************************************
// *********************************************************************************************************************

// https://developer.mozilla.org/en-US/docs/WebAPI/Pointer_Lock
// Adapted from https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

// If this browser supports pointer lock, let's rock and roll
if ( havePointerLock ) {

    var element = document.body;

    // Callback when the pointerlock is obtained or released
    var pointerlockchange = function ( event ) {

        // Check if we got a lock or not
        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

            // Update the global lock flag
            hasLock = true;

            // Start the clock
            clock.start();

            // Remove the DOM overlay
            blocker.style.display = 'none';

        } else {

            // Released the lock

            // Update the global lock flag
            hasLock = false;

            // Stop the render clock
            clock.stop();

            // Show the DOM overlay
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';

            // Show the instructions overlay too
            instructions.style.display = '';
        }
    };

    // If something goes wrong, show the instructions
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

    // Add click event to the instructions overlay to let the player engage the game
    instructions.addEventListener( 'click', function ( event ) {

        // Hide the instructions
        instructions.style.display = 'none';

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

//        // If Firefox, request a full screen resize
//        // I thought about puting this back in, but firefox does a poor gl job
//        // as it is, don't want to make things worse by making it render more than it
//        // can handle..
//        if ( /Firefox/i.test( navigator.userAgent ) ) {
//
//            var fullscreenchange = function ( event ) {
//
//                if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
//
//                    document.removeEventListener( 'fullscreenchange', fullscreenchange );
//                    document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
//
//                    // Get the pointer lock
//                    element.requestPointerLock();
//                }
//
//            };
//
//            document.addEventListener( 'fullscreenchange', fullscreenchange, false );
//            document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
//
//            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
//
//            // Request fullscreen too
//            element.requestFullscreen();
//
//        } else {

            // Otherwise, just get the pointer lock
            element.requestPointerLock();

//        }

    }, false );

} else {

    // Pointer lock not supported to show a "yer browser sux" message
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API - Try Google Chrome, or Firefox';

}


// *********************************************************************************************************************
// ***** INIT TIME *****************************************************************************************************
// *********************************************************************************************************************


/**
 * Initializes the core world and scene
 */
function init() {

    //
    // BIND EVENTS
    //

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'keyup', onKeyUp, false );
    document.addEventListener( 'mouseup', onMouseUp, false );
    document.addEventListener( 'mousemove', onMouseMove, false );
    $(document).mousewheel( onMouseScroll ) ;

    //
    // DOM ELEMENTS & SELECTORS
    //

    // Create a container for the fps/physics stat monitor
    containerDiv = document.createElement( 'div' );
    document.body.appendChild( containerDiv );

    // Overlays
    skyUnderlay = $('#pagewrapper');
    deadScreen = $('#respawn');

    // Hud setup
    hud.currentBallCount = $('#hud-ammo .current');
    hud.maxBallCount = $('#hud-ammo .max');
    notificationHud = $('#hud-notifications ul');

    // Bind up the nickname screen when the dom is ready
    $(document).ready(function(){
        // Bind the form submit, so the player can hit ENTER on the nickname text box
        $('#loading form').bind('submit', function(e) {
            e.preventDefault();

            // Get and clean the player's nickname entry
            var nick = $.trim($('#nickname').val());

            // Validate the nickname is letters, numbers and between 3 and 15 chars.
            if (nick.match(/^[a-zA-Z0-9_]{3,15}$/)) {

                // Check if the socket server was reachable
                if (window.io == null) {
                    // Tell the client hte server is down and reload the page
                    // Maybe the server crashed
                    alert('Hmm. Appears the server is down... might be a fluke :/');
                    window.location.reload();
                    return;
                }

                // Don't allow double submit the form
                $('#loading button').unbind('click');
                $('#loading form').unbind('submit');

                // Update the client player's nickname
                nickname = nick;

                // Connect to the node server
                connect(nick);

                // Remove the nickname screen
                $('#loading .error').hide();
                $('#loading').hide();
            } else {
                // Invalid nickname, show the validation error
                $('#loading .error').show().html('<br/>Name must be 3-10 letters or numbers.')
            }
        });
    });

    // Update the ball counter hud
    hud.currentBallCount.text(maxBallCount - currentBallCount);
    hud.maxBallCount.text(maxBallCount);

    //
    // SCENE SETUP
    //

    // Scene has to be a Physijs Scene, not a THREE scene so physics work
    scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });
    scene.fog = new THREE.Fog( 0xffffff, 1000, FAR );   // Fog is irrelevant

    // Physics - set gravity and update listener
    scene.setGravity(new THREE.Vector3( 0, 0, -30 ));
    scene.addEventListener(
        'update',
        function() {
            scene.simulate( undefined, 1 );
            physicsStats.update();
        }
    );

    //
    // CAMERA
    //

    // Basic perspective camera
    camera = new THREE.PerspectiveCamera( 45, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );

    // I'm being "that guy" and changing the world orientation such that
    // X,Y are the top-down coordinates, and Z is the height off the ground
    // Sorry in advance.
    camera.up.y = 0;
    camera.up.z = 1;


    //
    // LIGHTS
    //

    // Ambient light is flat black
    ambient = new THREE.AmbientLight( 0x000000 );
    scene.add( ambient );

    // Sun lights (two of them for fun reflective patterns
    // This achieves the appearance/art style I'm going for
    light = new THREE.DirectionalLight( 0xffe0bb, 1.3 );
    light2 = new THREE.DirectionalLight( 0xffe0bb, 1.3 );

    // Moon light to make the "night time" not totally unplayable
    // Stays active during the day too, so essentialyl 3 lights are active
    // during they day cycle
    moon = new THREE.DirectionalLight( 0x999999, 0.6 );

    // Only the main daylight and moon cast shadows
    light.castShadow = true;
    light2.castShadow = false;
    moon.castShadow = true;

    // Update the shadow cameras
    light.shadowCameraNear = -256;
    light.shadowCameraFar = 256;
    light.shadowCameraLeft = -128;
    light.shadowCameraRight = 128;
    light.shadowCameraTop = 128;
    light.shadowCameraBottom = -128;

    moon.shadowCameraNear = -256;
    moon.shadowCameraFar = 256;
    moon.shadowCameraLeft = -128;
    moon.shadowCameraRight = 128;
    moon.shadowCameraTop = 128;
    moon.shadowCameraBottom = -128;

    // Don't show the wire lines of the lights
    // Good for debugging, though
    light.shadowCameraVisible = false;
    light2.shadowCameraVisible = false;
    moon.shadowCameraVisible = false;

    // More shadow configs
    light.shadowBias = .0001;  // 0.0001
    light.shadowDarkness = 0.25; // 0.5
    moon.shadowDarkness = 0.2;
    light.shadowMapWidth = SHADOW_MAP_WIDTH;
    light.shadowMapHeight = SHADOW_MAP_HEIGHT;

    // Create a light rig so lights rotate in tandum, relative to the core object
    lightRig = new THREE.Object3D();
    lightRig.boundRadius = 10;
    lightRig.add(light);
    lightRig.add(light2);

    // Add the lights to the scene
    scene.add( lightRig );
    scene.add( moon );

    // Offset the lights in the rig
    light.position.set( 10, 0, 0 );
    light2.position.set(0, 0, 10 );

    // Set the moon overhead position
    moon.position.set(0, 0, 10 );
    moon.lookAt(0, 0, 0);

    // Set the light rig's initial rotation
    lightRig.rotation.x = 0.6807; // middle of northern hemisphere ~39deg N latitude

    //
    // RENDERER
    //

    // Setup the THREE.js gl renderer
    // (opting out of antialias, cuz i don't really want it - or the performance costs of it)
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    containerDiv.appendChild( renderer.domElement );
    renderer.setClearColor( scene.fog.color, 1 );
    renderer.autoClear = false; // This breaks of FF on mac, apparently (v20)
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft =  true;
}


/**
 * Occurs when the user enters a nickname and is ready to connect to the game server
 * @param nickname - The nickname the player entered
 */
function connect(nickname) {

    //
    // SOCKET SETUP
    //

    // Connect to the game server on the same host, different port
    socket = io.connect(window.__ioUrl);

    /**
     * Occurs when the socket establishes a connection with the game server
     * @var object data - The world and player information
     * data => {
     *   player { player_id, nickname, hp, color, start_pos, balls },
     *   ground,
     *   hills,
     *   water,
     *   trees,
     *   players
     * }
     */
    socket.on('connected', function(data) {

        //
        // CONNECTED
        //

        // Update the global player id based on server assignment
        playerId = data.player.player_id;


        /**
         * Occurs when the socket disconnects from the server
         * This could be because the server died or the connection to the server died.
         * @var null data - Not used
         */
        socket.on('disconnect', function(data) {
            // Interrupt the game with the bad news
            alert('Connection dropped - :(');

            // Reload the page since we don't handle graceful reloads or retries
            // socket.io does reconect automatically, however if the server crashes
            // the terrain is going to be brand new, so it'll be totally unreliable
            window.location.reload();
        });

        // Now that we're connected, tell the server the name the player chose
        socket.emit('nickname', nickname);

        // Create the scene based off the world information given from the server
        createScene(data);


        //
        // SETUP STATS COUNTERS
        //

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;
        containerDiv.appendChild( stats.domElement );

        physicsStats = new Stats();
        physicsStats.domElement.style.position = 'absolute';
        physicsStats.domElement.style.top = '50px';
        physicsStats.domElement.style.zIndex = 100;
        containerDiv.appendChild( physicsStats.domElement );

    });


    /**
     * Occurs when another client sets/changes their nickname
     * @var object data - The nickname event data
     * data => {
     *   playerId,
     *   nickname
     * }
     */
    socket.on('nicknames', function(data){

        // Update the player object's nickname field
        players[data.playerId].userData.nickname = data.nickname;

        // Update the player's sprite to refect the new name
        updatePlayerSprite(data.playerId);

        // Publish notification to the screen
        addNotification(data.nickname+' connected');
    });


    /**
     * Occurs when another player moves
     * @var object data - The move event data
     * data => {
     *   id,
     *   position: { x, y, z, zRotation }
     * }
     */
    socket.on('moves', function (data) {
        // Update the player's position in the world
        updatePlayer(data.id, data.position);
    });


    /**
     * Occurs when another player throws a ball
     * @var object data - The ball launch data
     * data => {
     *   sourcePlayerId,
     *   force : { x, y, z },
     *   position: { x, y, z },
     *   restitution,
     *   ballId,
     *   color
     * }
     */
    socket.on('fires', function (data) {
        addBall(
            new THREE.Vector3(data.position.x, data.position.y, data.position.z),
            new THREE.Vector3(data.force.x, data.force.y, data.force.z),
            data.restitution,
            data.sourcePlayerId,
            data.color,
            data.ballId);
    });


    /**
     * Occurs when a ball has been removed from the world
     * @var array data - Array of balls to remove
     * data => [ {
     *   playerId,
     *   ballId
     * } ... ]
     */
    socket.on('unfires', function(data){

        for (var i in data) {
            deleteBallById(data[i].playerId, data[i].ballId);
        }
    });


    /**
     * Occurs when another client hits a player
     * @var object data - Hit event data
     * data => {
     *   playerId,
     *   playerSourceId,
     *   velocity,
     *   newHp
     * }
     */
    socket.on('hits', function (data) {

        // Check if the target is now dead (kill event)
        if (data.newHp <= 0) {

            //
            // KILLED
            //

            // Log it to the console in case you were away and wanna see who killed your ass
            console.log(' ** PLAYER ' + data.playerId + ' WAS KILLED BY PLAYER ' + data.playerSourceId + ' ***', data);

            // Names of the sender and receiver
            var sourceName = data.playerSourceId == playerId ? nickname : players[data.playerSourceId].userData.nickname,
                victimName = '';

            // Check if the client is the victim
            if (data.playerId == playerId) {
                // THIS PLAYER IS NOW DEAD
                player.userData.hp = data.newHp;
                victimName = nickname;

                // Show the dead screen
                deadScreen.show();

                // Drop a hilarious dead body clone and hide the original
                dropDeadBody(player);
                player.visible = false;
                player.userData.sprite.visible = false;

            } else {

                // A REMOTE PLAYER IS DEAD
                players[data.playerId].userData.hp = data.newHp;
                victimName = players[data.playerId].userData.nickname;

                // Drop a hilarious dead body clone and hide the original
                dropDeadBody(players[data.playerId]);
                players[data.playerId].visible = false;
                players[data.playerId].userData.sprite.visible = false;
            }

            // Publish a death notification
            addNotification(sourceName +' killed ' + victimName);

        } else {

            //
            // STILL ALIVE
            //

            // Update the target player's HP
            if (data.playerId == playerId) {
                player.userData.hp = data.newHp;
            } else {
                players[data.playerId].userData.hp = data.newHp;
            }
        }

        // Update victim player sprite (hp changes)
        updatePlayerSprite(data.playerId);
    });


    /**
     * Occurs when a player respawns (even self)
     * @var object data - Respawn data
     * data => {
     *   player_id,
     *   hp,
     *   pos
     * }
     */
    socket.on('respawns', function(data) {
        // Check if the client respawned
        if (data.player_id == playerId) {
            // SELF RESPAWN

            // Delete all my balls
            deletePlayerBalls(playerId);

            // Reset hp and position to respawn info
            player.userData.hp = data.hp;
            player.position.x = data.pos.x;
            player.position.y = data.pos.y;
            player.rotation.z = 0;
            lockPlayerZ();
            player.__dirtyPosition = true;
            player.__dirtyRotation = true;

            // Show the player model and sprite again (i hide them on death for the bouncy body)
            player.visible = true;
            player.userData.sprite.visible = true;

        } else {
            // REMOTE PLAYER RESPAWN

            // Update HP and position
            players[data.player_id].userData.hp = data.hp;
            updatePlayer(data.player_id, data.pos);

            // Show the player model and sprite again (i hide them on death for the bouncy body)
            players[data.player_id].visible = true;
            players[data.player_id].userData.sprite.visible = false;
        }

        // Update the player sprite to reflect their refreshed HP
        updatePlayerSprite(data.player_id);
    });


    /**
     * Occurs when a new player joins the game (not identified yet tho)
     * @var object data - New player event data
     * data => {
     *   player,
     *   ground,
     *   hills,
     *   water,
     *   trees,
     *   players
     * }
     */
    socket.on('new_player', function (data) {
        // Add the player to the world
        addPlayer(data);
    });


    /**
     * Occurs when a player leaves the server
     * @var int data - Player ID who left
     */
    socket.on('delete_player', function (data) {
        // Attempt to extract the name of the player
        var name = data == playerId ? nickname : players[data].userData.nickname;

        // Publish a disconnect notification
        addNotification(name + ' disconnected');

        // Remove the player from the world
        deletePlayer(data);
    });
}


/**
 * Initializes the terrain, players and the rest of the world that is dependent on the server
 * @param data - Connection info
 */
function createScene(data) {

    //
    // WATER
    //

    // Setup the water material, blue, semi-reflective, semi-transparent
    var planeMaterial = new THREE.MeshPhongMaterial({
        color: 0x4D708A,
        ambient: 0xAFCADE,
        specular: 0xf5f5f5,
        shininess: 100,
        transparent: true,
        opacity: 0.5,
        shading: THREE.FlatShading
    });

    // Create a plane based on the data given from the server
    water = createPlaneFromData(
        data.water.data,
        data.water.worldWidth,
        data.water.worldHeight,
        data.water.width,
        data.water.height,
        planeMaterial,
        data.water.multiplier,
        data.water.subtractor
    );

    // Add the water plane to the scene
    water.castShadow = false;
    water.receiveShadow = true;
    scene.add(water);


    //
    // GROUND
    //

    var groundPhysMaterial = Physijs.createMaterial(
        new THREE.MeshLambertMaterial( { color: 0x557733, shading: THREE.FlatShading } ),
        .8, // high friction
        .4 // low restitution
    );

    // Create a plane based on the data given from the server
    ground = createPlaneFromData(
        data.ground.data,
        data.ground.worldWidth,
        data.ground.worldHeight,
        data.ground.width,
        data.ground.height,
        groundPhysMaterial,
        data.ground.multiplier,
        data.ground.subtractor
    );

    // Add the ground to the scene
    scene.add(ground);


    //
    // HILLS
    //

    var hillsPhysMaterial = Physijs.createMaterial(
        new THREE.MeshLambertMaterial( { color: 0xFAD55C, shading: THREE.FlatShading } ),
        .8, // high friction
        .4 // low restitution
    );

    // Create a plane based on the data given from the server
    hills = createPlaneFromData(data.hills.data, data.hills.worldWidth, data.hills.worldHeight, data.hills.width, data.hills.height, hillsPhysMaterial, data.hills.multiplier, data.hills.subtractor );

    // Add the hills to the scene
    scene.add(hills);


    //
    // PLAYER
    //

    // Setup player material based on color from server
    var playerMaterial = new THREE.MeshPhongMaterial({
            color: data.player.color,
            ambient: data.player.color, // should generally match color
            specular: 0x050505,
            shininess: 100
        }),

        // Simple cube rectangle geometry
        playerGeometry = new THREE.CubeGeometry( 1, 1, 2, 1, 1, 1 ),

        // Create the player as a physics object, to take advantage of physics collisions
        playerPhysMaterials = Physijs.createMaterial(
            playerMaterial,
            .8, // high friction
            .4 // low restitution
        );

    // Create the physics-enabled player mesh
    player = new Physijs.BoxMesh(
        playerGeometry,
        playerPhysMaterials,
        0
    );

    // Assign starting properties
    player.userData.id = data.player.player_id;
    player.userData.nickname = nickname;
    player.userData.hp = 100.0;

    // Bind handler to detect collisions with own balls
    player.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
        // FYI, `this` has collided with `other_object` with an impact speed of `relative_velocity` and a rotational force of `relative_rotation` and at normal `contact_normal`

        // Only handle this collision if the object was sourced from this player
        if (other_object.userData.sourcePlayerId == playerId) {

            // Notify other clients that this ball has been removed from the world
            socket.emit('unfire', {
                playerId: playerId,
                ballId: other_object.userData.ballId
            });

            // Remove the ball from the scene
            deleteBallById(other_object.userData.sourcePlayerId, other_object.userData.ballId);

            // Give the player a ball back in their inventory
            currentBallCount--;
            hud.currentBallCount.text(maxBallCount - currentBallCount);
        }
    });

    // Player model should cast and receive shadows so they look pretty
    player.castShadow = true;
    player.receiveShadow = true;

    //
    // CAMERA RIG
    //

    // Rig the camera to the player, so that the camera always moves relative to the player
    player.add(camera);

    // Offset the camera from the player
    camera.position.set(0, 3 * chaseScale, 1 * chaseScale + 1);

    // Point the camera at the player
    // FIXME: Change this to point where the player is looking instead of at the player directly
    camera.lookAt(scene.position);

    // Determine the initial rotational offset based on radius, angle and scale
    var cameraOffset = new THREE.Vector3(0,0,0),
        radius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale)),
        normalizedCameraPos = camera.position.clone().sub(cameraOffset).normalize().multiplyScalar(radius);

    // Init the chase angle
    chaseAngle = Math.asin((normalizedCameraPos.z) / radius);

    // Assign collision masks so useless stuff doesn't cause collisions with the player
    player._physijs.collision_type = CollisionTypes.PLAYER;
    player._physijs.collision_masks = CollisionMasks.PLAYER;

    // Add the player to the scene
    scene.add( player );

    // Init the player's sprite
    updatePlayerSprite(playerId);

    // Set initial x/y, given from the server
    player.position.x = data.player.start_pos.x;
    player.position.y = data.player.start_pos.y;

    // Lock the player to the ground
    lockPlayerZ();

    // Tell the other clients we moved (to compensate for the z movement)
    broadcastPosition();

    //
    // SERVER PLAYERS
    //

    // Add players that are already in the server to the world
    var names = [];
    for (var i in data.players) {
        var p = data.players[i];
        if (p.player_id != playerId) {
            addPlayer(p);
            names.push(p.nickname);
        }
    }

    // Publish a notification showing who's in the server already
    if (names.length > 0) {
        addNotification('Player'+(names.length == 1 ? '' : 's')+' '+names.join(', ') + ' '+(names.length == 1 ? 'is' : 'are')+' here.');
    } else {
        addNotification('You are all alone in this server. :(');
    }


    //
    // TREES
    //

    // Init the JSON loader to load up my tree model
    var loader = new THREE.JSONLoader();

    // Load my tree model I made in Blender
    loader.load( "js/models/tree.js", function( geometry, materials ) {

        // Extract the tree geometry
        treeGeo = geometry;

        // Extract the tree materials
        treeMats = new THREE.MeshFaceMaterial( materials );

        // Modify the tree materials
        for (var i in treeMats.materials) {

            // Make the tree look like the rest of the world - FLAT SHADING!
            treeMats.materials[i].shading = THREE.FlatShading;

            // Make the foliage emissive, so they look better at night
            if (i == 0) {
                treeMats.materials[i].emissive = treeMats.materials[i].color;
                treeMats.materials[i].emissive.r *= 0.8;
                treeMats.materials[i].emissive.g *= 0.8;
                treeMats.materials[i].emissive.b *= 0.8;
            }
        }

        // Drop trees where the server said to do so
        for(var i in data.trees) {
            addTree(data.trees[i].x, data.trees[i].y, null, data.trees[i].rotation);
        }

        // Start the render loop
        requestAnimationFrame(render);

        // Watch for balls that fall off into the abyss
        setInterval(ballWatcher, 500);

        // Watch for changes in player position and send to the server, if dirty
        setInterval(sendPosition, 25);

        // Watch for notifications that need to filter off the screen
        setInterval(cycleNotifications, 3000);


        //
        // THAT'S IT FOR SETUP - THE REST IS AUTONOMOUS
        //

    } );
}


// *********************************************************************************************************************
// ***** RENDER TIME ***************************************************************************************************
// *********************************************************************************************************************


/**
 * Main render loop - executes once every frame
 */
function render() {

    // Get the time delta since last frame
    var delta = clock.getDelta();

    // Animate the frame
    animate(delta);

    // Update metrics
    stats.update();

    // Simulate physics
    scene.simulate(delta);

    // Render the changes made this frame
    renderer.render( scene, camera );

    // Request the next frame (endless)
    requestAnimationFrame( render );
}


/**
 * Core animation - user interactions handler
 * @param delta - Time since last frame
 */
function animate(delta) {

    // If we don't have a pointer lock yet, don't start rendering yet
    // otherwise indicated we have loaded the first frame under the pointer lock overlay
    if (!hasLock && loaded) {
        return;
    } else if (!loaded) {
        loaded = true;
    }

    // Frame flags and speeds based on time delta
    var playerMoved = false,
        playerSpeed = isKeyDown(KEYCODE.SHIFT) ? speed * 2 * delta : speed * delta,
        playerAngleSpeed = Math.PI / 2 * (isKeyDown(KEYCODE.SHIFT) ? 2*angleSpeed : angleSpeed) * delta;

    // Only handle user interactions if player is alive
    if (player.userData.hp > 0) {

        // Move forward
        if (
            (isKeyDown(KEYCODE.W) && !isKeyDown(KEYCODE.S)) ||
            (isKeyDown(KEYCODE.UP_ARROW) && !isKeyDown(KEYCODE.DOWN_ARROW)) // FIXME: This should do verical rotation (mouse replacement)
           ) {
            playerMoved = moveIfInBounds(0, -playerSpeed) || playerMoved;
        }

        // Move backward
        if ((isKeyDown(KEYCODE.S) && !isKeyDown(KEYCODE.W))) {
            playerMoved = moveIfInBounds(0, playerSpeed) || playerMoved;
        }

        // Strafe left
        if (isKeyDown(KEYCODE.A) && !isKeyDown(KEYCODE.D)) {
            playerMoved = moveIfInBounds(playerSpeed, 0) || playerMoved;
        }

        // Strafe right
        if (isKeyDown(KEYCODE.D) && !isKeyDown(KEYCODE.A)) {
            playerMoved = moveIfInBounds(-playerSpeed, 0) || playerMoved;
        }

        // Rotate left
        if (isKeyDown(KEYCODE.LEFT_ARROW) && !isKeyDown(KEYCODE.RIGHT_ARROW)) {
            player.rotateOnAxis( new THREE.Vector3(0,0,1), playerAngleSpeed);
            player.__dirtyRotation = true;
            player.__dirtyPosition = true;
            playerMoved = true;
        }

        // Rotate right
        if (isKeyDown(KEYCODE.RIGHT_ARROW) && !isKeyDown(KEYCODE.LEFT_ARROW)) {
            player.rotateOnAxis( new THREE.Vector3(0,0,1), -playerAngleSpeed);
            player.__dirtyRotation = true;
            player.__dirtyPosition = true;
            playerMoved = true;
        }

    } else {

        //
        // PLAYER IS DEAD
        //

        // Since the player is dead, they need to hit ENTER to respawn
        if (isKeyDown(KEYCODE.ENTER)) {
            // Don't accept another ENTER keystroke until the key has been released
            if (!isWaitRequired(KEYCODE.ENTER)) {

                // Block the ENTER key
                waitRequired(KEYCODE.ENTER);

                // Tell the server the player wants to respawn
                socket.emit('respawn');

                // Remove the dead overlay
                deadScreen.hide();
            }
        }
    }

    // If free-look is enabled, update the camera controls
    if (!chaseCamEnabled) {
        controls.update();
    }

    // If sun rotation is active
    if (!pauseRotation) {

        // Update light matricies
        light.updateMatrixWorld();
        light.target.updateMatrixWorld();
        light2.updateMatrixWorld();
        light2.target.updateMatrixWorld();

        // Rotate the lighting rig
        lightRig.rotation.y -= .001; // time of day

        // Vary the lighting and shadow intensity based on time of day (read: rotation)
        light.intensity = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(1.3, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)*2) : 0
        light2.intensity = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(1.3, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)*2) : 0
        light.shadowDarkness = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(0.25, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)/2) : 0

        // If the light rotation has reached one of the edges, toggle the sky underlay on/off
        // The underlay has css transition, so it looks like the sun fades. YOU LIKE?
        if (Math.abs(lightRig.rotation.y / Math.PI % 2) < 1) {
            skyUnderlay.css('opacity', 0);
        } else {
            skyUnderlay.css('opacity', 1);
        }

    }

    // If the player has moved
    if (playerMoved) {

        // Lock the player to the terrain
        lockPlayerZ();

        // Mark the position as dirty and queue for broadcasting
        broadcastPosition();
    }
}


// *********************************************************************************************************************
// ***** EVENT LISTENERS ***********************************************************************************************
// *********************************************************************************************************************


/**
 * Occurs when the browser window changes sizes
 */
function onWindowResize() {

    // Update the screen width globals
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    // Update the camera aspect to accomdate the new size
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    // Update the renderer resolution
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    // Update camera controls if free-look is enabled
    if (!chaseCamEnabled) {
        controls.handleResize();
    }
}


/**
 * Occurs when the player presses a key
 * Adapted on code obtained from Adam Vogel / @adambvogel (http://adamvogel.net)
 * @param event - DOM event
 */
function onKeyDown(event) {

    // Disregard if the pointer lock is not been engaged
    if (!hasLock) {
        return;
    }

    // Add/Enable key to the active array
    keys[event.keyCode] = true;
}


/**
 * Occurs when the player releases a key
 * Adapted on code obtained from Adam Vogel / @adambvogel (http://adamvogel.net)
 * @param event - DOM event
 */
function onKeyUp(event) {

    // Disregard if the pointer lock is not been engaged
    if (!hasLock) {
        return;
    }

    // Disable the key code
    keys[event.keyCode] = false;

    // Disable any holds that were active on the key, waiting for the key to be released
    if (toggleWatchers[event.keyCode] != null) {
        toggleWatchers[event.keyCode] = false;
    }
}


/**
 * Occurs when the player moves the mouse
 * Adapted on code obtained from Adam Vogel / @adambvogel (http://adamvogel.net)
 * @param e - DOM event
 */
function onMouseMove(e) {

    // Disregard if the pointer lock has not been engaged
    if (!hasLock) {
        return;
    }

    // Get the X/Y movement, and do a bunch of MATH!
    var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0,
        movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0,
        playerHorizontalAngleSpeed = Math.PI / 180 * -movementX,
        radius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale)),
        currAngle = chaseAngle,
        angleDiff = (movementY / 25) / radius,
        newAngle = Math.max(-1.5, Math.min(1.5, currAngle + angleDiff)),
        x = Math.cos(newAngle) * radius,
        y = Math.sqrt(radius * radius - x * x);

    // Invert y if angle is negative
    y = newAngle > 0 ? y : -y;

    // Cap x so that the camera cannot go past the center of the player model
    x = Math.max(x, 0.5);

    // Rotate the camera based on any horizontal movement (easy)
    player.rotateOnAxis( new THREE.Vector3(0,0,1), playerHorizontalAngleSpeed );

    // Update camera position for vertical adjustments
    camera.position.set(camera.position.x, x, y);

    // Check if there is terrain in the line-of-sight to the player
    var cameraWorldPos = (new THREE.Vector3()).getPositionFromMatrix(camera.matrixWorld),
        origin = player.position.clone(),
        direction = cameraWorldPos.clone().sub(origin),
        r = new THREE.Raycaster(origin, direction, 0, radius + 1),
        c = r.intersectObjects([ ground, water, hills ], true);

    // CAMERA-LOS-GROUND-PLAYER collision!
    if (c.length > 0) {

        // FIXME: Adjust camera position so it does not collide with terrain
        // I tried to move the camera in to the point where the collision occurs,
        // on the same angle as it exists regularly, but things get janky and weird
        // so it's on the list to fix for another day.

        // Point in which the camera LoS intersects the ground mesh
        var localCamPos = player.worldToLocal(c[0].point) ; //,
            //length = localCamPos.length(),
            //newLength = length - 1,
            //newLocalCamPos = localCamPos.normalize().multiplyScalar(newLength);

        //console.log('in da ground', radius, shortRadius, normalizedCameraPos.length(), currAngle, newAngle/*, c[0].point, player.position.distanceTo(c[0].point)*/);

        //camera.position.copy(c[0].point);
        //camera.position.copy(localCamPos);
        //camera.position.copy(newLocalCamPos);

    }

    // Apply the camera offset to the new position
    camera.position.add(cameraOffset);

    // Look at the player model
    // FIXME: Should change this to look in the direction the player is looking
    camera.lookAt(new THREE.Vector3(0,0,0));

    // Update the new chase angle
    chaseAngle = newAngle;

    // Dirty up the player cuz of the new rotation
    player.__dirtyRotation = true;
    player.__dirtyPosition = true;

    // Dirty the player posiiton to show realtime rotations
    broadcastPosition();
}


/**
 * Occurs when the user plays with the scroll wheel
 * Adapted on code obtained from Adam Vogel / @adambvogel (http://adamvogel.net)
 * @param event - DOM event
 * @param delta - Wheel delta object
 * @param deltaX - Horizontal delta
 * @param deltaY - Vertical delta
 */
function onMouseScroll(event, delta, deltaX, deltaY) {

    // Forget this if the pointer lock is not engaged
    if (!hasLock) {
        return;
    }

    // Calculate the camera radius based current angle / scale
    var radius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale));

    // Check direction
    // Change the scale if chase-cam is enabled, or scale the position if free-looking
    if (deltaY > 0) { // scroll up
        if (!chaseCamEnabled) {
            camera.position.multiplyScalar(1.1);
        } else {
            chaseScale = Math.max(0.05, chaseScale - 0.1);
        }
    } else if (deltaY < 0) { // scroll down
        if (!chaseCamEnabled) {
            camera.position.multiplyScalar(0.9);
        } else {
            chaseScale = Math.min(5, chaseScale + 0.1);
        }
    }

    // Calculate the new angle and new radius
    var newAngle = chaseAngle,
        newRadius = Math.sqrt((3 * chaseScale) * (3 * chaseScale) + (1 * chaseScale) * (1 * chaseScale)),
        x = Math.cos(newAngle) * newRadius,
        y = Math.sqrt(newRadius * newRadius - x * x);

    // Invert y if angle is negative
    y = newAngle > 0 ? y : -y;

    // Cap x such that the camera cannot look past the player model
    x = Math.max(x, 0.5);

    // Update the camera position
    camera.position.set(camera.position.x, x, y);

    // Apply the camera offset
    camera.position.add(cameraOffset);

    // Look at the player model
    // FIXME: Should change this to look in the direction the player is looking
    camera.lookAt(new THREE.Vector3(0,0,0));

    event.stopPropagation();
    event.preventDefault();
}


/**
 * Occurs when the user releases a mouse button
 * @param event - DOM event
 */
function onMouseUp(event) {

    // Disregard if the pointer lock has not been obtained
    if (!hasLock) {
        return;
    }

    // Don't propagate this event
    event.preventDefault();

    // Ignore if the player is dead
    if (player.userData.hp > 0) {
        // Throw a ball!
        throwBall();
    }
}


// *********************************************************************************************************************
// ***** HELPERS *******************************************************************************************************
// *********************************************************************************************************************


/**
 * Adds a remote player to the world
 * @param data - Player data
 */
function addPlayer(data) {

    // Apply the player color to the player material
    // and create the model
    var cubeMaterials = new THREE.MeshPhongMaterial( {
            color: data.color,
            ambient: data.color, // should generally match color
            specular: 0x050505,
            shininess: 100
        }),
        cubeGeo = new THREE.CubeGeometry( 1, 1, 2, 1, 1, 1),
            playerPhysMaterials = Physijs.createMaterial(
            cubeMaterials,
            .8, // high friction
            .4 // low restitution
            ),
        player = new Physijs.BoxMesh(
            cubeGeo,
            playerPhysMaterials,
            0
        );

    // Apply user properties to the model
    player.userData.hp = data.hp;
    player.userData.id = data.player_id;
    player.userData.start_pos = data.start_pos;
    player.userData.nickname = data.nickname;

    // Listen for collisions with the player to detect when the client player hits the remote player
    player.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
        // FYI: `this` has collided with `other_object` with an impact speed of `relative_velocity` and a rotational force of `relative_rotation` and at normal `contact_normal`

        // Only handle collisions for balls the local player fired
        if (other_object.userData.sourcePlayerId == playerId) {

            // Only handle if the remote player is not already dead
            if (player.userData.hp > 0) {

                // Update remote player's hp
                player.userData.hp -= relative_velocity.length();

                // Notify server that the player hit the remote player
                socket.emit('hit', {
                    playerId: player.userData.id,
                    playerSourceId: other_object.userData.sourcePlayerId,
                    velocity: relative_velocity.length(),
                    newHp: player.userData.hp
                });

                // Notify that the ball has been removed from the world
                socket.emit('unfire', {
                    playerId: playerId,
                    ballId: other_object.userData.ballId
                });

                // If the player killed the remote player
                if (player.userData.hp <= 0) {

                    // Drop a hilarious boundy dead body
                    dropDeadBody(player);

                    // Hide the normal model
                    player.visible = false;
                    player.userData.sprite.visible = false;

                    // Publish death notification
                    addNotification(window.nickname +' killed ' + player.userData.nickname);
                }

                // Remote the colliding ball from the scene
                deleteBallById(other_object.userData.sourcePlayerId, other_object.userData.ballId);

                // Give the ball back to the player and update the hud
                currentBallCount--;
                hud.currentBallCount.text(maxBallCount - currentBallCount);

                // Update the remote player's sprite for the HP changes
                updatePlayerSprite(player.userData.id);
            }
        }
    });

    // Players cast and receive shadows
    player.castShadow = true;
    player.receiveShadow = true;

    // Apply collision masks such that players collide with specific things
    player._physijs.collision_type = CollisionTypes.PLAYER;
    player._physijs.collision_masks = CollisionMasks.PLAYER;

    // Set initial X/Y position
    player.position.x = data.pos.x;
    player.position.y = data.pos.y;
    if (data.pos.z == null) {
        // Since z was not given, auto-lock to the ground
        lockPlayerZ(player);
    } else {
        player.position.z = data.pos.z;
    }

    // Add the new player to the scene
    scene.add( player );

    // Add the player to the global collection
    players[data.player_id] = player;

    // Update the sprite to show nickname and hp
    updatePlayerSprite(data.player_id);
}


/**
 * Moves a remote player to the given location
 * @param id - ID of the player to move
 * @param { x, y, z, zRotation } position - The position object to move to
 */
function updatePlayer(id, position) {

    // Find the player in the collection
    var p = players[id];
    if (p != null) {

        // Update given 2d position
        p.position.x = position.x;
        p.position.y = position.y;

        // Update the 3d location if given, or zlock ourselves if not set
        if (position.z != null) {
            p.position.z = position.z;
        } else {
            lockPlayerZ(p);
        }

        // If the rotation was supplied, set that too
        if (position.zRotation != null) {
            p.rotation.z = position.zRotation;
        }

        // Flag dirty for phyisijs to update physics object location
        p.__dirtyPosition = true;
        p.__dirtyRotation = true;
    }
}


/**
 * Removes a remote player from the world
 * @param id - ID of the player to remove
 */
function deletePlayer(id) {

    // Find the player in the collection
    var p = players[id];
    if (p != null) {

        // Remove the player from the scene
        scene.remove(players[id]);

        // Clear out the player object from the collection
        players[id] = null;
        delete players[id];
    }
}


/**
 * Updates the queued location to send during the next server broadcast
 */
function broadcastPosition() {

    // Extrapolate the current player location and rotation
    positionToBroadcast = {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        zRotation: player.rotation.z
    };
}


/**
 * Broadcasts the queued location of the player to the server
 */
function sendPosition() {

    // If the player position is dirty since last iteration, send it
    if (positionToBroadcast != null) {

        // Send location to the server
        socket.emit('move', positionToBroadcast);

        // Mark position as clean
        positionToBroadcast = null;
    }
}


/**
 * Creates a terrain plane from server-given data
 * @param data - Plane vertex height map
 * @param worldWidth - How wide the plane should be
 * @param worldDepth - How deep the plane should be
 * @param width - The number of vertices the plane width should contain
 * @param height - The number of vertices the plane height should contain
 * @param material - The material to assign the plane
 * @param multiplier - How dramatic the terrain elevation should be
 * @param subtractor - How far vertically to offset the terrain
 * @returns {Physijs.HeightfieldMesh}
 */
function createPlaneFromData(data, worldWidth, worldDepth, width, height, material, multiplier, subtractor) {

    // Put the serialized data point array back into a more performant Float32Array
    var floatData = new Float32Array(data.length);
    for (var i = 0; i < data.length; i++) {
        floatData[i] = data[i];
    }

    // Provision a new three-dimensional plane with the given number of vertices
    var terrainGeometry = new THREE.Plane3RandGeometry( width, height, worldWidth - 1, worldDepth - 1 );

    // Apply the height map data, multiplier and subtractor to the plane vertices
    for ( var i = 0, l = terrainGeometry.vertices.length; i < l; i ++ ) {
        terrainGeometry.vertices[ i ].z = floatData[ i ] * multiplier - subtractor;
    }

    // Update normals and centroids because we hacked the plane geometry
    terrainGeometry.computeFaceNormals();
    terrainGeometry.computeVertexNormals();
    terrainGeometry.computeCentroids();

    // Create the terrain physics mesh - heightfield because it's a perfect fit
    var t = new Physijs.HeightfieldMesh(terrainGeometry, material, 0, worldWidth - 1, worldDepth - 1);

    // Terrain should cast and receive shadows
    t.castShadow = true;
    t.receiveShadow = true;

    // Assign physics collison masks and type so it only causes collisions with specific things
    t._physijs.collision_type = CollisionTypes.GROUND;
    t._physijs.collision_masks = CollisionMasks.GROUND;

    // Return the terrain mesh
    return t;
}


/**
 * Adds a ball to the word with the given appearane and trajectory information
 * @param position - The location to start the ball
 * @param force - The initial force to apply on the ball
 * @param restitution - The bounciness of the ball
 * @param playerId - The player who threw the ball
 * @param color - The color to assign the ball
 * @param ballId - The ID of the ball
 */
function addBall(position, force, restitution, playerId, color, ballId) {

    // Create the ball geometry, apply color and restitution to the material and init the mesh
    var ballGeometry = new THREE.SphereGeometry( 0.25, 6, 6),
        ballMaterial = Physijs.createMaterial(
            new THREE.MeshLambertMaterial( { color: color, shading: THREE.FlatShading } ),
            .8, // high friction
            restitution
        ),
        ball = new Physijs.SphereMesh(
            ballGeometry,
            ballMaterial,
            1.1//,
            //{ restitution: Math.random() * 1.5 }
        );

    // Apply the given position
    ball.position.copy(position);

    // Balls can receive shadows but not cast them (performance)
    ball.receiveShadow = true;
    //bumper.castShadow = true;

    // Because I decided to make Z vertical (instead of Y)
    ball.up.x = 0; ball.up.y = 0; ball.up.z = 1;

    // When the ball has been added to the scene and is ready for business
    // apply the force. This makes it fire reliably.
    // Using applyCentralForce was super unreliable for this purpose
    ball.addEventListener( 'ready', function() {
        ball.applyCentralImpulse(force)
    } );

    // Assign ownership and ID
    ball.userData.sourcePlayerId = playerId;
    ball.userData.ballId = ballId;

    // Assign physics collision type and masks, so it collides only with specific things
    ball._physijs.collision_type = CollisionTypes.BALL;
    ball._physijs.collision_masks = CollisionMasks.BALL;

    // Put the ball in the world
    scene.add( ball );

    // Update matrices
    ball.updateMatrixWorld();
    ball.updateMatrix();

    // Add the ball to the balls collection so I can keep track of it
    balls['p'+playerId+'b'+ballId] = ball;
}


/**
 * Fired when the client player wishes to throw a ball
 */
function throwBall() {

    // Abandon this request if the player has met or exceeded their ball limit
    if (currentBallCount >= maxBallCount) {
        return;
    }

    // Increment the number of balls in use by the player and update the HUD
    currentBallCount++;
    hud.currentBallCount.text(maxBallCount - currentBallCount);

    // Copy the player's position and randomize the bounciness factor
    var position = player.position.clone(),
     restitution = Math.min(1, Math.max(.4, Math.random() * 1.5));

    // Move the firing location to just above the player's head (1-unit)
    position.z += 2;

    // Determine the initial force to apply based on player vertical angle
    // The higher you look, the farther out it will go (faster, harder)
    // The lower you look, the closer it will go (slower, shorter)
    var force = new THREE.Vector3(0, -30 + (chaseAngle * 10), 10 + (-chaseAngle) * 10),
        rotation = player.rotation.clone();

    // Apply ball rotation based on the player's current horizontal rotation
    // so the ball moves in the direction the player is facing
    force.applyEuler(rotation);

    // Collect the event data for broadcasting
    var eventData = {
        sourcePlayerId: playerId,
        force: force,
        position: position,
        restitution: restitution,
        ballId: ++ballCounter
    };

    // Broadcast the ball to the other clients
    socket.emit('fire', eventData);

    // Add the ball to the world
    addBall(
        position,
        force,
        restitution,
        playerId,
        player.material.color,
        eventData.ballId);
}


/**
 * Adds a tree model to the world
 * @param x - 2d X location
 * @param y - 2d Y location
 * @param z - 3d Z location
 * @param rotation - Optional Rotation to apply to the tree (if none given, rotation will be random)
 */
function addTree(x, y, z, rotation) {

    // 3rd dimension to drop the tree
    var zPos = null;

    // If no Z was given, z-lock the position to the terrain
    if (z == null) {

        // Find the top-most intersection with any terrain layer for the given 2d coords
        var c = intersectGroundObjs(x, y);

        // Only allow placing a tree if the location is above terrain and the top-most terrain is not water
        if (c.length == 0 || c[0].object == water) {
            return
        }

        zPos = c[0].point.z;
    } else {
        zPos = z;
    }

    // Create a new tree mesh from the stored geometry and materials loaded from the JSON model
    // Notice this is a non-physics-enabled mesh - this mesh will be added to a physics-enabled parent later)
    var tree = new THREE.Mesh( treeGeo, treeMats );

    // Trees should cast and receive shadows
    tree.castShadow = true;
    tree.receiveShadow = true;

    // Apply rotation or generate one if none is given
    var roationAmt = rotation != null ? rotation : Math.random() * Math.PI;

    // Create Container and hit box geometries
    var treeContainerGeo = new THREE.CubeGeometry(1.25, 1.25, .25, 1, 1, 1),
        treeBoxGeo = new THREE.CubeGeometry(.742, .742, 5, 1, 1, 1),
        treeLeafBoxGeo = new THREE.CubeGeometry(1.38 * 2, 1.64 * 2, 2, 1, 1, 1),

        // Invisible hit box material
        treeBoxMat = Physijs.createMaterial(
            new THREE.MeshPhongMaterial( {
                color: 0x996633,
                transparent: true,
                opacity: 0
            }),
            .8, // high friction
            .4 // low restitution
        ),

        // Parent container which holds hit boxes and tree model
        treeContainer = new Physijs.BoxMesh(
            treeContainerGeo,
            treeBoxMat,
            0
        ),

        // Trunk hit box
        treeBox = new Physijs.BoxMesh(
            treeBoxGeo,
            treeBoxMat,
            0
        ),

        // Foliage hit box
        treeLeafBox = new Physijs.BoxMesh(
            treeLeafBoxGeo,
            treeBoxMat,
            0
        );


    // Assign physics collision type and masks to both hit boxes so only specific collisions apply to trees
    treeBox._physijs.collision_type = CollisionTypes.TREE;
    treeBox._physijs.collision_masks = CollisionMasks.TREE;
    treeLeafBox._physijs.collision_type = CollisionTypes.TREE;
    treeLeafBox._physijs.collision_masks = CollisionMasks.TREE;

    // Apply the given location to the tree container
    treeContainer.position = new THREE.Vector3(x, y, zPos);

    // Add the child meshes to the container
    treeContainer.add(treeBox);
    treeContainer.add(treeLeafBox);
    treeContainer.add(tree);

    // Apply the rotation
    treeContainer.rotation.z = roationAmt;

    // Init hit box rotations to model
    treeBox.rotation.y = 0.104719755;
    treeLeafBox.rotation.z = -0.296705973;

    // Init hit box positions to model
    treeBox.position.add(new THREE.Vector3(.25631, .16644, 5.49535 / 2 ));
    treeLeafBox.position.add(new THREE.Vector3(-0.16796, -0.05714, 4.59859));

    // Add the complete tree to the scene
    scene.add(treeContainer);
}


/**
 * Checks whether a key is currently being pressed by the player
 * Adapted on code obtained from Adam Vogel / @adambvogel (http://adamvogel.net)
 * @param args - the given key(s) to check are down
 * @returns {*}
 */
function isKeyDown(args) {
    // If just one key is to be checked
    if (typeof args === 'number') { 
        // 'args' is a single key, eg. KEYCODE.A : 65
        if (keys[args] != null) {
            // Return whether the given key is down
            return keys[args];
        } else {
            return false;
        }
    } else if ( (typeof args === 'object' ) && args.isArray ) {
        // 'args' is a an array of keys
        // Verify all are down or fail
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
        // Nothing to do
        return false;
    }
}


/**
 * Locks the given player to the terrain
 * @param specificPlayer - Optional, Remote player to use if given or self if not
 */
function lockPlayerZ(specificPlayer) {

    // Which player to lock
    var p = specificPlayer || player;

    // Attempt to intersect the ground
    var z = intersectGround(p.position.x, p.position.y);

    // If there was an intersection, lock the player z to it
    if (z != null) {
        // Apply a 1 unit diff to the position, to accomodate the player model
        var diff = z - p.position.z + 1;
        p.translateZ(diff);

        // Since players are physics objects, physijs requires this hack
        p.__dirtyPosition = true;
        p.__dirtyRotation = true;
    }
}


/**
 * Finds the z position in which the given 2d location intersects the ground
 * @param x - Given 2d x
 * @param y - Given 2d y
 * @returns {null|float} - The 3d z intersection with the terrain
 */
function intersectGround(x, y) {

    // Intersect the ground for the given coords
    var c = intersectGroundObjs(x, y);

    // If there is an intersection, return the z from the top-most intersect
    if (c.length > 0) {
        return c[0].point.z;
    }

    // No intersection - return null
    return null;
}


/**
 * Finds the intersections with the terrain for the given 2d location
 * @param x - Given 2d x
 * @param y - Given 2d y
 * @returns {*} - The raw Raycaster result of intersections with the terrain
 */
function intersectGroundObjs(x, y) {

    // Init raycaster
    var rayLength = 1000,           // look for collisions in a 1000 unit span
        upperZ = rayLength / 2,     // start 500 units above origin
        lowerZ = upperZ * -1,       // go 500 units below origin
        origin = new THREE.Vector3(x, y, upperZ), // offset origin at given 2d coords
        direction = new THREE.Vector3( x, y, lowerZ), // ray direction points from top-down

        // Init the ray caster
        r = new THREE.Raycaster(origin.clone(), direction.clone().sub(origin.clone()).normalize());

    // Return the result of the ray casting
    return r.intersectObjects([ ground, water, hills ], true);
}


/**
 * Checks to see if a key is available to be pressed again.
 * @param key - Keycode to check
 * @returns {*} - Returns true if the key is already down and should block until it is released,
 *                or false if the key is available for use
 */
function isWaitRequired(key) {
    // Check if there is a hold placed on this key
    if (toggleWatchers[key] != null) {

        // Return the status of the hold
        return toggleWatchers[key];
    } else {

        // No hold - so it's available
        return false;
    }
}


/**
 * Blocks a key, marking it not to be used until it is released
 * @param key - Key to block
 * @param timeout - Optional - How long to wait to automatically release the lock if the player doesn't get off the keyboard
 */
function waitRequired(key, timeout) {

    // Add a hold on the key
    toggleWatchers[key] = true;

    // If a timeout was specified, automatically release the lock after the timeout
    if (timeout != null && timeout > 0) {
        setTimeout(function() { toggleWatchers[key] = false; }, timeout);
    }
}


/**
 * Helper to debug where a player is facing by drawing a line in the forward direction
 */
function drawPlayerLazer() {

    // Extrapolate player position and direction
    var origin = (new THREE.Vector3()).getPositionFromMatrix(camera.matrixWorld),
        target = player.position.clone(),
        direction = target.clone().sub(origin),
        dest = target.clone().add(direction);

    // Offset to the top of the player model
    target.z += 1;
    dest.z += 1;

    // Draw a line
    drawLine(target, dest);
}


/**
 * Helper to debug where an object is facing by drawing a line in the forward direction
 * @param mesh - Mesh to debug (e.g. ball)
 */
function drawLazer(mesh) {

    // Extrapolate meshes position and direction
    var origin = mesh.position.clone(),
        originMatrix = mesh.matrix,
        direction = new THREE.Vector3(0, -10, 0),
        target = direction.applyMatrix4(originMatrix);

    // Draw a line
    drawLine(origin, target);
}


/**
 * Draws a line between two vectors
 * @param v1 - Starting vector
 * @param v2 - Ending vector
 */
function drawLine(v1, v2) {

    // Generic blue line
    var lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff }),
        lineGeo = new THREE.Geometry();

    // Push start and end vectors to the line's geometry
    lineGeo.vertices.push(v1);
    lineGeo.vertices.push(v2);

    // Create the line mesh
    var line = new THREE.Line(lineGeo, lineMat);

    // Add the line to the scene
    scene.add(line);
}


/**
 * Debug function to remove all balls from the scene
 */
function deleteBalls() {
    for(var i in balls) {
        scene.remove(balls[i]);
        balls[i] = null;
        delete balls[i];
    }
}


/**
 * Removes a specific ball from the scene
 * @param playerId - The ball's owner
 * @param ballId - The ball's id
 */
function deleteBallById(playerId, ballId) {

    // Assemble the unique ball id key
    var key = 'p'+playerId+'b'+ballId;

    // Check if the ball exists and remove it if it exists
    if (balls[key] != null) {
        scene.remove(balls[key]);
        balls[key] = null;
        delete balls[key];
    }
}


/**
 * Deletes all of the given player's balls from the scene
 * @param targetPlayerId - The ID of the player to purge balls from
 */
function deletePlayerBalls(targetPlayerId) {

    // Assemble the ball key starting pattern
    var keyPrefix = 'p'+targetPlayerId+'b';

    // Find balls that belong to the player
    for(var i in balls) {

        // If the ball's id matches the starting pattern, delete the ball
        if (i.substr(0, keyPrefix.length) == keyPrefix) {
            scene.remove(balls[i]);
            balls[i] = null;
            delete balls[i];

            // If the ball was owned by the client player, give the ball back in the inventory
            if (playerId == targetPlayerId) {
                currentBallCount--;
            }
        }
    }

    // Update the ball counter HUD cuz the player count might have changed
    hud.currentBallCount.text(maxBallCount - currentBallCount);
}


/**
 * Generates the player nameplate and hp bar
 * @param nickname - Player nickname
 * @param hp - Player HP
 * @returns {THREE.Sprite} - Shiny new sprite
 */
function makePlayerSprite( nickname, hp ) {

    // Init canvas and drawing sizes, offsets, etc
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        size = 512,
        hpSize = 100,
        hpOffset = 20,
        hpWidth = Math.max(0, Math.round(hp)),
        hpHeight = 10,
        fontSize = 24,
        paddingHeight = 10,
        paddingWidth = 10;

    // Assign height/width from setup
    canvas.width = size;
    canvas.height = size;

    //
    // DRAW NAME BACKGROUND AND NAME
    //

    context.textAlign = 'center';
    context.font = fontSize+'px Arial';
    context.fillStyle = "rgba(50, 50, 50, 0.25)";
    var textWidth = context.measureText(nickname).width;

    // Text background should be semi-transparent
    context.fillRect(
        size/2 - textWidth/2 - paddingWidth,
        size/2 - (fontSize*1.6) / 2 - paddingHeight,
        textWidth + paddingWidth*2,
        fontSize + paddingHeight*2
    );

    // Draw text
    context.fillStyle = '#ffffff';
    context.fillText(nickname, size / 2, size / 2);

    //
    // DRAW HP BARS
    //

    // Red underlay
    context.fillStyle = "rgba(204, 31, 31, 1)";
    context.fillRect(
        size/2 - hpSize/2,
        size/2 - hpHeight/2 + hpOffset,
        hpSize,
        hpHeight
    );

    // Green overlay
    context.fillStyle = "rgba(16, 189, 0, 1)";
    context.fillRect(
        size/2 - hpSize/2,
        size/2 - hpHeight/2 + hpOffset,
        hpWidth,
        hpHeight
    );

    // Create a new texture from the canvas drawing
    var canvasTexture = new THREE.Texture(canvas);
    canvasTexture.needsUpdate = true;

    // Assign the texture to a new material
    var spriteMaterial = new THREE.SpriteMaterial({
        map: canvasTexture,
        transparent: false,
        useScreenCoordinates: false,
        color: 0xffffff // CHANGED
    });

    // Create and return a fancy new player sprite
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set( 10, 10, 1 );
    return sprite;
}


/**
 * Updates the sprite for a given player
 * @param id - ID of the player to update
 */
function updatePlayerSprite(id) {

    // Get he player object being referenced (local or remote)
    var p = id == playerId ? player : players[id];

    // If the target player still exists
    if (p != null) {

        // Remove the old sprite
        if (p.userData.sprite != null) {
            p.remove(p.userData.sprite);
        }

        // Create a new sprite
        p.userData.sprite = makePlayerSprite(p.userData.nickname, p.userData.hp );

        // Offset the sprite above the player
        p.userData.sprite.position.set(0, 0, 2);

        // Add the sprite to the player
        p.add( p.userData.sprite );

    } else {
        console.error('cannot update sprite cuz player is missing?');
    }
}


/**
 * Checks whether the given value is between the given min and max values
 * @param n - Given value
 * @param min - Minimum range value
 * @param max - Maximum range value
 * @returns {boolean} - True if within the given range, False if not
 */
function isBetween(n, min, max) {
    return (min < n) && (n < max);
}


/**
 * Moves a player if still within the bounds of the world
 * @param xTranslation - How much to move the player in the X direction
 * @param yTranslation - How much to move the player in the Y direction
 * @returns {boolean} - True if the player moved, False if not
 */
function moveIfInBounds(xTranslation, yTranslation) {

    // Copy the current player position and get the world bounds
    var oldPos = player.position.clone(),
        width = worldWidth * 2,
        depth = worldDepth * 2;

    // Apply the given translations to the player position
    player.translateX(xTranslation);
    player.translateY(yTranslation);

    // If the new location is outside the boundaries of the world, undo the movement
    if (!isBetween(player.position.x, -width, width) ||
        !isBetween(player.position.y, -depth, depth)) {
        // Revert and report movement failure
        player.position.copy(oldPos);
        return false;
    } else {
        // Flag to physijs as dirty, so physics objects can move
        player.__dirtyPosition = true;
        player.__dirtyRotation = true;

        // Return movement was successful
        return true;
    }
}


/**
 * Drops a dead body where the target player is standing, and hides the target player model
 * @param targetPlayer - Player object to drop a body for
 */
function dropDeadBody(targetPlayer) {

    // Clone the target player's material color
    var bodyMaterials = new THREE.MeshPhongMaterial( {
            color: targetPlayer.material.color,
            ambient: targetPlayer.material.color, // should generally match color
            specular: 0x050505,
            shininess: 100
        }),

        // Create body geometry and physics material
        bodyGeometry = new THREE.CubeGeometry( 1, 1, 2, 1, 1, 1),
        bodyPhysicsMaterial = Physijs.createMaterial(
            bodyMaterials,
            .8, // high friction
            .4 // low restitution
        ),

        // Create the body mesh
        body = new Physijs.BoxMesh(
            bodyGeometry,
            bodyPhysicsMaterial,
            0.5
        );

    // Of course bodies cast and receive shadows...
    body.castShadow = true;
    body.receiveShadow = true;

    // Apply collision masks such that bodys only collide with limited things
    body._physijs.collision_type = CollisionTypes.BODY;
    body._physijs.collision_masks = CollisionMasks.BODY;

    // Apply current target player's position and rotation matrices
    body.matrix.copy(targetPlayer.matrix);
    body.matrixWorld.copy(targetPlayer.matrixWorld);
    body.position.copy(targetPlayer.position);

    // Add the body to the world and let the hilarity commence
    scene.add( body );

}


/**
 * Publishes a notification to the notification HUD
 * @param message - HTML message to display
 */
function addNotification(message) {
    // Create a new unordered list element with the message
    // Apply the current date timestamp to the element so that it doesn't get wiped until
    // it has been on screen for a minimum amount of time
    $('<li>'+message+'</li>').data('added', Date.now()).appendTo(notificationHud);
}


/**
 * Checks for stale notifications and removes them
 */
function cycleNotifications() {

    // Find active notifications
    var activeNotifications = $('li', notificationHud);

    // If there is at least one visible notification
    if (activeNotifications.length > 0) {

        // Check the date stamp on the notification
        // If it hasn't been visibile for at least three seconds, ignore this cycle request
        var n = $(activeNotifications[0]);
        if (Date.now() - n.data('added') > 3000) {

            // Remove with CSS transition of movement off the top of the screen
            n.css('margin-top', -38);
            setTimeout(function() {
                // After the CSS transition finishes, purge the element off the dom
                n.remove();
            }, 1000);
        }
    }
}


/**
 * Checks for balls that may have fallen off the world
 */
function ballWatcher() {

    // Check each ball
    for(var i in balls) {

        // If the ball belongs to the current player and has moved 50 units below origin - PURGE IT!
        if (balls[i].userData.sourcePlayerId == playerId &&
            balls[i].position.z < -50) {

            // Notify other players the ball has been recycled
            socket.emit('unfire', {
                playerId: playerId,
                ballId: balls[i].userData.ballId
            });

            // Remove the ball from the world
            deleteBallById(balls[i].userData.sourcePlayerId, balls[i].userData.ballId);

            // Give the player back their ball and update their HUD
            currentBallCount--;
            hud.currentBallCount.text(maxBallCount - currentBallCount);
        }
    }
}


// *********************************************************************************************************************
// ***** RUN TIME ******************************************************************************************************
// *********************************************************************************************************************

// COMMENCE THE FUN
init();