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

var balls = [];

var chaseCamEnabled = true;
var chaseScale = 2.5;
var toggleWatchers = {};
var speed = 0.2, angleSpeed = 0.1;

var mouse = {
    x: null,
    y: null,
    lastX: null,
    lastY: null,
    xDiff: null,
    yDiff: null
};

// ***** POINTER LOCK **************************************************************************************************


var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var hasLock = false;

if ( havePointerLock ) {
    var element = document.body;

    var pointerlockchange = function ( event ) {

        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

            //controls.enabled = true;
            hasLock = true;
            clock.start();

            blocker.style.display = 'none';

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

    //TWEEN.start();

    container = document.createElement( 'div' );
    document.body.appendChild( container );



 
    // EVENTS
    

    
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'keyup', onKeyUp, false );

    //document.addEventListener( 'mousewheel', onMouseScroll, false );
    document.addEventListener( 'mouseup', onMouseUp, false );
    document.addEventListener( 'mousemove', onMouseMove, false );

    $('body').mousewheel( onMouseScroll ) ;
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
            scene.simulate( undefined, 2 );
            physicsStats.update();
        }
    );




    //THREE.ColorUtils.adjustHSV( scene.fog.color, 0.02, -0.15, -0.65 );
    
    
    // SCENE CAMERA

    camera = new THREE.PerspectiveCamera( 45, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
    //gameCameraTarget = new THREE.Vector3(0,0,0);

    //plControls = new THREE.PointerLockControls(camera);
    //scene.add(plControls.getObject());

    projector = new THREE.Projector();

    //camera.position.set( 0, -10, 10 );
    //camera.rotation.setX(Math.PI/4);
    //camera.lookAt(scene.position);
	


	//camera.position.x = -120.99318691416968;
	//camera.position.y = -37.705309121503035;
	//camera.position.z = 55.23685574177473;

	

	//camera.rotation.x = 1.4609687721031974;
	//camera.rotation.y = -0.7819771154302685;
	//camera.rotation.z = -0.051950711527804484;


    camera.position.set(0, 8, 16);
    //camera.lookAt(gameCameraTarget);
    camera.lookAt(scene.position);
    camera.up.y = 0;
    camera.up.z = 1;
    //cameraPlaceholderHelper = new THREE.CameraHelper( camera );
    //scene.add( cameraPlaceholderHelper );

	//camera.position.set( -120.99318691416968, -37.
	// 705309121503035, 55.23685574177473 );
	//camera.rotation.set( 1.4609687721031974, -0.7819771154302685, -0.051950711527804484 );
    //camera.up.x =  0.5243388972589702;
	//camera.up.y =  0.5503652213423956;
	//camera.up.z = 0.6497436755813536;
	
    // CAMERA PLACEHOLDER
//    cameraPlaceholder = new THREE.PerspectiveCamera( 23, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
//    cameraPlaceholder.position.set( 0, -10, 10 );
//    cameraPlaceholder.rotation.setX(Math.PI/4);
//    scene.add( cameraPlaceholder );
//    cameraPlaceholderHelper = new THREE.CameraHelper( cameraPlaceholder );
//    scene.add( cameraPlaceholderHelper );
//    cameraPlaceholderHelper.visible = true;
    
    
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
    
    createScene();

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
    

}

function createScene( ) {

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

    water = createRandomPlane(terrainSize, terrainSize, planeMaterial, .1, 4);


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

    ground = createRandomPlane(terrainSize, terrainSize, groundPhysMaterial, .25, 6);

    scene.add( ground );

    var hillsPhysMaterial = Physijs.createMaterial(
        new THREE.MeshLambertMaterial( { color: 0xFAD55C, shading: THREE.FlatShading } ),
        .8, // high friction
        .4 // low restitution
    );

    hills = createRandomPlane(terrainSize, terrainSize, hillsPhysMaterial, .75, 35);
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
            color: 0x996633,
            ambient: 0x996633, // should generally match color
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

//    player = new Physijs.BoxMesh(
//        cubeGeo,
//        playerPhysMaterials,
//        0
//    );



//    player = new THREE.Mesh( cubeGeo, cubeMaterials);
    player = new THREE.Mesh( cubeGeo, playerPhysMaterials);
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add( player );






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
        tree = new THREE.Mesh( geometry, treeMats );
        tree.castShadow = true;

        //scene.add(tree);
        addTree(0, 0);

        // Add a shit load of trees
        for(var i = 0; i < 50; i++) { addTree(Math.random() * 256 - 128, Math.random() * 256 - 128); }

        //camera.lookAt(gameCameraTarget);
        animate();

        lockPlayerZ();
    } );



//    var loader = new THREE.JSONLoader( true );
//    loader.load( "js/models/horse.js", function( geometry ) {
//
//        horse = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0x606060/*, morphTargets: true*/ } ) );
//        horse.scale.set( .015, .015, .015 );
//        horse.rotation.x = Math.PI / 2;
//        horse.position.z = 1;
//        horse.castShadow = true;
//        horse.center.point
//        horse.receiveShadow = true;
//        scene.add( horse );
//
//        animate(); // LAST THING TO DO
//        camera.lookAt(gameCameraTarget);
//
//    } );


//	var loader2 = new THREE.ColladaLoader();
//	//loader2.options.convertUpAxis = true;
//	loader2.load( 'js/models/castle-no-water.dae', function ( collada ) {
//
//		// Grab the collada scene data:
//		castle = collada.scene;
//
//		// No skin applied to my model so no need for the following:
//		var skin = collada.skins[ 0 ];
//
//		// Scale-up the model so that we can see it:
//		castle.scale.x = castle.scale.y = castle.scale.z = 0.02;
//
//		castle.position.x = 100;
//		castle.position.y = -20;
//		castle.position.z = -40;
//
//		castle.castShadow = true;
//		castle.receiveShadow = true;
//
//		castle.updateMatrix();
//
//		scene.add(castle);
//
//
//		animate();
//
//
//	  });


}

// ***** RENDER TIME ***************************************************************************************************

function render() {
    var delta = clock.getDelta();
    renderer.render( scene, camera );
}

function animate() {

    requestAnimationFrame( animate );
    scene.simulate();

    render();
    stats.update();

    if (!hasLock) {
        return;
    }

    updateChaseCamLocation();

    var playerMoved = false,
        playerSpeed = isKeyDown(KEYCODE.SHIFT) ? speed * 2 : speed,
        playerAngleSpeed = Math.PI / 2 * angleSpeed;

    if (isKeyDown(KEYCODE.W)) {
        //player.position.y -= 0.10;
        player.translateY(-playerSpeed);
        lockPlayerZ();
        playerMoved = true;
    }

    if (isKeyDown(KEYCODE.S)) {
        //player.position.y += 0.10;
        player.translateY(playerSpeed);
        lockPlayerZ();
        playerMoved = true;
    }

    if (isKeyDown(KEYCODE.A)) {
//        player.position.x += 0.10;
        player.translateX(playerSpeed);
        lockPlayerZ();
        playerMoved = true;
    }

    if (isKeyDown(KEYCODE.D)) {
        //player.position.x -= 0.10;

        player.translateX(-playerSpeed);
        lockPlayerZ();
        playerMoved = true;
    }

    if (isKeyDown(KEYCODE.Z)) {
        //player.position.x -= 0.10;

        player.position.set(0,0,0);
        lockPlayerZ();
        playerMoved = true;
    }

    if (isKeyDown(KEYCODE.UP_ARROW)) {
        //player.position.z += 0.10;
        //player.translateZ(playerSpeed);
        //playerMoved = true;
    }

    if (isKeyDown(KEYCODE.DOWN_ARROW)) {
        //player.position.z -= 0.10;
        //player.translateZ(-playerSpeed);
        //playerMoved = true;
    }

    var rotation_matrix = new THREE.Matrix4().identity();
    if (isKeyDown(KEYCODE.LEFT_ARROW)) {
        //player.rotation.x -= Math.PI / 20;
        player.rotateOnAxis( new THREE.Vector3(0,0,1), playerAngleSpeed);
        //playerMoved = true;
    }

    if (isKeyDown(KEYCODE.RIGHT_ARROW)) {
        //player.rotation.x += Math.PI / 20;
        player.rotateOnAxis( new THREE.Vector3(0,0,1), -playerAngleSpeed);
        //playerMoved = true;
    }

    if (isKeyDown(KEYCODE.SPACE)) {
        if (!isWaitRequired(KEYCODE.SPACE)) {
            waitRequired(KEYCODE.SPACE);
            pauseRotation = !pauseRotation;
        }
    }

    if (isKeyDown(KEYCODE.SHIFT) && isKeyDown(KEYCODE.SPACE)) {
        lightRig.rotation.y -= 0.01;
    }

    if (isKeyDown(KEYCODE.P)) {
        //cameraPlaceholderHelper.visible = !cameraPlaceholderHelper.visible;
        light.shadowCameraVisible = !light.shadowCameraVisible;
    }

    if (isKeyDown(KEYCODE.ENTER)) {
        if (!isWaitRequired(KEYCODE.ENTER)) {
            waitRequired(KEYCODE.ENTER);
            chaseCamEnabled = !chaseCamEnabled;
            if (!chaseCamEnabled) {
                if (controls == null) {
                    controls = new THREE.TrackballControls(camera, renderer.domElement );
                    controls.handleResize();
                } else {
                    controls.enabled = true;
                }
            } else {
                if (controls != null) {
                    controls.enabled = false;
                }
                camera.up.x = 0;
                camera.up.y = 0;
                camera.up.z = 1;
            }
        }
    }

    if (isKeyDown(KEYCODE.L)) {
        if (!isWaitRequired(KEYCODE.L)) {
            var lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff }),
                lineGeo = new THREE.Geometry();

            lineGeo.vertices.push(player.position);
            //player.l
            lineGeo.vertices.push(new THREE.Vector3(player.position.x, player.position.y, player.position.z));
            var line = new THREE.Line(lineGeo, lineMat);
            //console.log(upperZ, lowerZ, origin, direction);
            scene.add(line);
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
    }

    // Color balls based on speed
    for(var i in balls) {
        var r = Math.max(0.8, Math.min(balls[i].getLinearVelocity().length(), 1.0)),
            mod = 0.8 - (r-0.8);
        balls[i].material.color.r = r;
        balls[i].material.color.g = mod;
        balls[i].material.color.b = mod;

    }

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

function onMouseMove(e) {

    if (!hasLock) {
        return;
    }

    var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0,
        movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
//
//
//    // Current location
//    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//
//    // Update diffs
//    if (mouse.lastX != null) {
//        mouse.xDiff = mouse.lastX - mouse.x;
//    }
//
//    if (mouse.lastY != null) {
//        mouse.yDiff = mouse.lastY - mouse.y;
//    }


    // Handle camera rotation

//    var relativeXPos = mouse.x - (window.innerWidth / 2),
//        relativeYPos = mouse.y - (window.innerHeight / 2);

    //console.log(e, movementX, movementY);

    var playerHorizontalAngleSpeed = Math.PI / 180 * -movementX,
        playerVerticalAngleSpeed = Math.PI / 360 * movementY;

    //player.rotateOnAxis( new THREE.Vector3(0,0,1), playerAngleSpeed);
    player.rotateOnAxis( new THREE.Vector3(0,0,1), playerHorizontalAngleSpeed );
    player.rotateOnAxis( new THREE.Vector3(1,0,0), playerVerticalAngleSpeed );


    // Update
//    mouse.lastX = mouse.x;
//    mouse.lastY = mouse.y;

}

//scroll input handling
function onMouseScroll(event, delta, deltaX, deltaY) {

    if (!hasLock) {
        return;
    }

    if (deltaY > 0) {
        //scroll up
        //console.log("scrollup");
        if (!chaseCamEnabled) {
            camera.position.multiplyScalar(1.1);
        } else {
            chaseScale = Math.max(0.5, chaseScale - 0.1);
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

    event.stopPropagation();
    event.preventDefault();
}

function onMouseUp(event) {

    if (!hasLock) {
        return;
    }


    //console.log('down', event);
    event.preventDefault();

    if (isKeyDown(KEYCODE.SHIFT)) {
        addBumpber();
    } else {

        var mouse = {};
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        projector.unprojectVector(vector, camera);
        var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

        var intersects = raycaster.intersectObjects([ ground, hills ], true);

        if (intersects.length > 0) {
            addTree(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z);
        }
    }
}


// ***** HELPERS *******************************************************************************************************


function createRandomPlane(x, y, material, multiplier, subtractor) {
    var data = generateHeight( worldWidth, worldDepth );
    var terrainGeometry = new THREE.Plane3RandGeometry( x, y, worldWidth - 1, worldDepth - 1 );
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    for ( var i = 0, l = terrainGeometry.vertices.length; i < l; i ++ ) {
        terrainGeometry.vertices[ i ].z = data[ i ] * multiplier - subtractor;
    }

    terrainGeometry.computeFaceNormals();
    terrainGeometry.computeVertexNormals();
    terrainGeometry.computeCentroids();

    //var t = new THREE.Mesh( terrainGeometry, material  );
    var t = new Physijs.HeightfieldMesh(terrainGeometry, material, 0, worldWidth - 1, worldDepth - 1);
    t.castShadow = true;
    t.receiveShadow = true;
    return t;
}

var ballLaunchSpeed = new THREE.Vector3(5,1,1);
function addBumpber() {

//    var box_geometry = new THREE.CubeGeometry( 3, 3, 3 ),
//        sphere_geometry = new THREE.SphereGeometry( 1.5, 32, 32 ),
//        cylinder_geometry = new THREE.CylinderGeometry( 2, 2, 1, 32 ),
//        cone_geometry = new THREE.CylinderGeometry( 0, 2, 4, 32 ),
//        octahedron_geometry = new THREE.OctahedronGeometry( 1.7, 1 ),
//        torus_geometry = new THREE.TorusKnotGeometry ( 1.7, .2, 32, 4 );
//
//    var shape, material = new THREE.MeshLambertMaterial( { color: 0xCCCCCC, shading: THREE.FlatShading } );
//
//    switch ( Math.floor(Math.random() * 6) ) {
//        case 0:
//            shape = new Physijs.BoxMesh(
//                box_geometry,
//                material
//            );
//            break;
//
//        case 1:
//            shape = new Physijs.SphereMesh(
//                sphere_geometry,
//                material,
//                undefined,
//                { restitution: Math.random() * 1.5 }
//            );
//            break;
//
//        case 2:
//            shape = new Physijs.CylinderMesh(
//                cylinder_geometry,
//                material
//            );
//            break;
//
//        case 3:
//            shape = new Physijs.ConeMesh(
//                cone_geometry,
//                material
//            );
//            break;
//
//        case 4:
//            shape = new Physijs.ConvexMesh(
//                octahedron_geometry,
//                material
//            );
//            break;
//
//        case 5:
//            shape = new Physijs.ConvexMesh(
//                torus_geometry,
//                material
//            );
//            break;
//    }
//
//    //shape.material.color.setRGB( Math.random() * 100 / 100, Math.random() * 100 / 100, Math.random() * 100 / 100 );
//    shape.castShadow = true;
//    shape.receiveShadow = true;
//
//    shape.position.set(player.position.x, player.position.y, player.position.z + 2);
//    shape.rotation.set(
//        Math.random() * Math.PI,
//        Math.random() * Math.PI,
//        Math.random() * Math.PI
//    );
//
//    scene.add(shape);


    var bumperGeo = new THREE.SphereGeometry( 0.25, 12, 12 );

    var bumperMat = Physijs.createMaterial(
        new THREE.MeshLambertMaterial( { color: 0xCCCCCC, shading: THREE.FlatShading } ),
        .8, // high friction
        .4 // low restitution
    );

    var bumper = new Physijs.SphereMesh(
        bumperGeo,
        bumperMat,
        0.1,
        { restitution: Math.random() * 1.5 }
    );

//    bumper = new THREE.Mesh(bumperGeo, new THREE.MeshLambertMaterial( { color: 0xCCCCCC, shading: THREE.FlatShading } ));

    bumper.position.x = player.position.x;
    bumper.position.y = player.position.y;
    bumper.position.z = player.position.z + 2;

    bumper.receiveShadow = true;
    bumper.castShadow = true;
    bumper.up.x = 0; bumper.up.y = 0; bumper.up.z = 1;


    scene.add( bumper );

    bumper.updateMatrixWorld();
    bumper.updateMatrix();



    var force = bumper.position.clone().add(new THREE.Vector3(0, -200, 50));
    force.applyEuler(player.rotation);
    bumper.applyCentralForce(force);




    drawPlayerLazer();

    balls.push(bumper);

}

function addTree(x, y, z) {
    if (z == null) {
        var c = intersectGroundObjs(x, y);
        //console.log(x,y,z);
        if (c.length > 0 && c[0].object != water) {
            var tree = new THREE.Mesh( treeGeo, treeMats );
            tree.castShadow = true;
            tree.position = new THREE.Vector3(x, y, c[0].point.z);
            tree.rotation.z = Math.random() * Math.PI;

            scene.add(tree);
        }
    } else {
        var tree = new THREE.Mesh( treeGeo, treeMats );
        tree.castShadow = true;
        tree.position = new THREE.Vector3(x, y, z);
        tree.rotation.z = Math.random() * Math.PI;

        scene.add(tree);
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


function lockPlayerZ() {

    var z = intersectGround(player.position.x, player.position.y);
    if (z != null) {
        var diff = z - player.position.z;
        //player.position.z += diff;
        player.translateZ(diff);
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

function updateChaseCamLocation() {
    if (chaseCamEnabled) {
        var relativeCameraOffset = new THREE.Vector3(0, 3 * chaseScale, 1 * chaseScale);
        var cameraOffset = relativeCameraOffset.applyMatrix4(player.matrixWorld);
        camera.position.x = cameraOffset.x;
        camera.position.y = cameraOffset.y;
        camera.position.z = cameraOffset.z;

        // Test for ground collision
        var minZ = intersectGround(camera.position.x, camera.position.y);
        if (camera.position.z < minZ + 1) {
            //console.log('bounce camera', camera.position.z, minZ + 1);
            camera.position.z = minZ + 1;

        }


        var target = player.position.clone();
        camera.lookAt(target);
        //console.log(camera.rotation);
    }
}

function drawPlayerLazer() {
    drawLazer(player);
}

function drawLazer(mesh) {
    var lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff }),
        lineGeo = new THREE.Geometry();

    var origin = mesh.position.clone(),
        originMatrix = mesh.matrix;

    origin.z += 1;

    var direction = new THREE.Vector3(0, -10, 0),
        target = direction.applyMatrix4(originMatrix);

    lineGeo.vertices.push(origin);
    lineGeo.vertices.push(target);
    var line = new THREE.Line(lineGeo, lineMat);
    console.log(line);
    scene.add(line);
}

// ***** RUN TIME ******************************************************************************************************

init();