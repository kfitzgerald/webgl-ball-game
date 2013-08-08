'use strict';

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var SHADOW_MAP_WIDTH = 512, SHADOW_MAP_HEIGHT = 512; // 512

var FLATSHADING = true;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;


var camera, controls, scene, renderer, cameraPlaceholder, cameraPlaceholderHelper;

var container, stats;

var NEAR = 1, FAR = 1000;

var worldWidth = 64;
var worldDepth = 64;

var cube, terrain;
var sceneHUD, cameraOrtho, hudMaterial;

var light, lightRig;

var clock = new THREE.Clock();

var KEYCODE = {
  'BACKSPACE' : 8,
  'TAB' : 9,
  'ENTER' : 13,
  'SHIFT' : 16,
  'CTRL' : 17,
  'ALT' : 18,
  'PAUSE_BREAK' : 19,
  'CAPS_LOCK' : 20,
  'ESCAPE' : 27,
  'SPACE' : 32,
  'PAGE_UP' : 33,
  'PAGE_DOWN' : 34,
  'END' : 35,
  'HOME' : 36,
  
  'LEFT_ARROW' : 37,
  'UP_ARROW' : 38,
  'RIGHT_ARROW' : 39,
  'DOWN_ARROW' : 40,
  
  'INSERT' : 45,
  'DELETE' : 46,
  
  '0' : 48,
  '1' : 49,
  '2' : 50,
  '3' : 51,
  '4' : 52,
  '5' : 53,
  '6' : 54,
  '7' : 55,
  '8' : 56,
  '9' : 57,
  'PLUS' : 59,
  'MINUS' : 61,
  
  'A' : 65,
  'B' : 66,
  'C' : 67,
  'D' : 68,
  'E' : 69,
  'F' : 70,
  'G' : 71,
  'H' : 72,
  'I' : 73,
  'J' : 74,
  'K' : 75,
  'L' : 76,
  'M' : 77,
  'N' : 78,
  'O' : 79,
  'P' : 80,
  'Q' : 81,
  'R' : 82,
  'S' : 83,
  'T' : 84,
  'U' : 85,
  'V' : 86,
  'W' : 87,
  'X' : 88,
  'Y' : 89,
  'Z' : 90,
  
  'WINDOWS_KEY' : 91,
  'SELECT_KEY' : 93,
  
  'NUMPAD_0' : 96,
  'NUMPAD_1' : 97,
  'NUMPAD_2' : 98,
  'NUMPAD_3' : 99,
  'NUMPAD_4' : 100,
  'NUMPAD_5' : 101,
  'NUMPAD_6' : 102,
  'NUMPAD_7' : 103,
  'NUMPAD_8' : 104,
  'NUMPAD_9' : 105,
  'NUMPAD_MULTIPLY' : 106,
  'NUMPAD_ADD' : 107,
  'NUMPAD_SUBTRACT' : 109,
  'NUMPAD_DECIMAL_POINT' : 110,
  'NUMPAD_DIVIDE' : 111,
  
  'F1' : 112,
  'F2' : 113,
  'F3' : 114,
  'F4' : 115,
  'F5' : 116,
  'F6' : 117,
  'F7' : 118,
  'F8' : 119,
  'F9' : 120,
  'F10' : 121,
  'F11' : 122,
  'F12' : 123,
  
  'NUM_LOCK' : 144,
  'SCROLL_LOCK' : 145,
  'SEMI_COLON' : 186,
  'EQUAL_SIGN' : 187,
  'COMMA' : 188,
  'DASH' : 189,
  'PERIOD' : 190,
  'FORWARD_SLASH' : 191,
  'GRAVE_ACCENT' : 192,
  'OPEN_BRACKET' : 219,
  'BACKSLASH' : 220,
  'CLOSE_BRACKET' : 221,
  'SINGLE_QUOTE' : 222
 } //keycode enum
var keys = []; // array for storing which keys are up/down

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

 
    // EVENTS
    

    
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'keyup', onKeyUp, false );
    $('body').mousewheel( onMouseScroll ) ;
    
    // SCENE

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0xffffff, 1000, FAR );
    //THREE.ColorUtils.adjustHSV( scene.fog.color, 0.02, -0.15, -0.65 );
    
    
    // SCENE CAMERA

    camera = new THREE.PerspectiveCamera( 23, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
    camera.position.set( 0, -10, 10 );
    camera.rotation.setX(Math.PI/4);
    //camera.lookAt(scene.position);
    
    // CAMERA PLACEHOLDER
    cameraPlaceholder = new THREE.PerspectiveCamera( 23, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
    cameraPlaceholder.position.set( 0, -10, 10 );
    cameraPlaceholder.rotation.setX(Math.PI/4);
    scene.add( cameraPlaceholder );
    cameraPlaceholderHelper = new THREE.CameraHelper( cameraPlaceholder );
    scene.add( cameraPlaceholderHelper );
    cameraPlaceholderHelper.visible = true;
    
    
    // LIGHTS

    var ambient = new THREE.AmbientLight( 0x444444 );
    scene.add( ambient );

    //light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI, 1 );
    light = new THREE.DirectionalLight( 0xffe0bb, 1.3 );
    //light.position.set( -1, 0, 0 );
    //light.target.position.set( 0, 0, 0 );

    light.castShadow = true;

    //light.shadowCameraNear = 700;  // 700
    //light.shadowCameraFar = camera.far;  // camera.far
    //light.shadowCameraFov = 50; //50
    
    light.shadowCameraNear = -10; // -20
    light.shadowCameraFar = 30; // 60
    light.shadowCameraLeft = -10; // -24
    light.shadowCameraRight = 10; // 24
    light.shadowCameraTop = 10; // 24
    light.shadowCameraBottom = -10; // -24

    light.shadowCameraVisible = true;

    light.shadowBias = 0.0001;  // 0.0001
    light.shadowDarkness = 0.25; // 0.5

    //light.sunLightPos = new THREE.Vector3(10, 0, 0); //-6, 7, 10 
    
    
    
    light.shadowMapWidth = SHADOW_MAP_WIDTH;
    light.shadowMapHeight = SHADOW_MAP_HEIGHT;

    //scene.add( light );

    lightRig = new THREE.Object3D();
    lightRig.boundRadius = 10;
    lightRig.add(light);
    scene.add( lightRig );
    
    light.position.set( 10, 1, 0 ) 
    lightRig.rotation.setX(0.6807); // middle of northern hemisphere ~39deg N latitude
    
    createScene();

    // RENDERER

    renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
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
    
    
    // TESTING CONTROLS
    controls = new THREE.TrackballControls(camera, renderer.domElement );
    
}

function onWindowResize() {


    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    controls.handleResize();

}



function createScene( ) {

    // GROUND

    var geometry = new THREE.PlaneGeometry( 64, 64 );
    var texture = THREE.ImageUtils.loadTexture( "img/grass.png" );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 16, 16 );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    texture.needsUpdate = true;
    var planeMaterial;
    if (FLATSHADING) {
        planeMaterial = new THREE.MeshPhongMaterial( { color: 0x002288 } ); //554433
    } else {
        planeMaterial = new THREE.MeshPhongMaterial( { map: texture } );
    }
    var ground = new THREE.Mesh( geometry, planeMaterial );

    ground.position.set( 0, 0, 0 );

    ground.castShadow = false;
    ground.receiveShadow = true;

    scene.add( ground );

    // CUBE

    var cubeMaterials = [];
    for (var i=0; i<6; i++) {
        var img = new Image();
        img.src = 'img/world-grid'+ i + '.png'; // 0=right, 1=left, 2=top, 3=bottom, 4=front, 5=back
        
        var tex = new THREE.Texture(img, THREE.UVMapping(), THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
        //console.log(tex);

        img.tex = tex;
        img.onload = function() {
            this.tex.needsUpdate = true;
        };
        var mat = new THREE.MeshPhongMaterial({color: 0xffffff, map: tex});
        
        cubeMaterials.push(mat);
    }
    
    if (FLATSHADING) {
        cubeMaterials = new THREE.MeshPhongMaterial( { color: 0xeeeeee } );
    } 
    
    var cubeGeo = new THREE.CubeGeometry( 1, 1, 2, 1, 1, 1, cubeMaterials );
    cube = new THREE.Mesh( cubeGeo, new THREE.MeshFaceMaterial());



    cube.castShadow = true;
    cube.receiveShadow = true;

    scene.add( cube );

    // Terrain    
    var data = generateHeight( worldWidth, worldDepth );
    var geometry = new THREE.PlaneGeometry( 64, 64, worldWidth - 1, worldDepth - 1 );
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

        geometry.vertices[ i ].z = data[ i ] * 0.05 -1.5;

    }
    var terrainMaterial = new THREE.MeshPhongMaterial( { color: 0x557733 } )
    terrain = new THREE.Mesh( geometry, terrainMaterial  );
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    
    scene.add( terrain );


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

        for (i=0; i<args.length; i++) {
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
        


function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();
    
    if (isKeyDown(KEYCODE.W)) { 
        cube.position.y += 0.10;
        cameraPlaceholder.position.y += 0.10;
    }
    
    if (isKeyDown(KEYCODE.S)) { 
        cube.position.y -= 0.10;
        cameraPlaceholder.position.y -= 0.10;
    }
    
    if (isKeyDown(KEYCODE.A)) { 
        cube.position.x -= 0.10; 
        cameraPlaceholder.position.x -= 0.10;
    }
    
    if (isKeyDown(KEYCODE.D)) { 
        cube.position.x += 0.10; 
        cameraPlaceholder.position.x += 0.10;
    }
    
    //light.target.position.copy(cameraPlaceholder.position);  // target the light at the camera
    //light.position.copy(cameraPlaceholder.position).addSelf(light.sunLightPos); // position the light at the camera + offset
    light.updateMatrixWorld();
    light.target.updateMatrixWorld();
    
    
    controls.update();
    
    lightRig.rotation.y -= .001; // time of day
   
    
}


function render() {
    var delta = clock.getDelta();
    renderer.render( scene, camera );
    

}

function onKeyDown(event) {
    keys[event.keyCode] = true;   
}
    
function onKeyUp(event) {
    keys[event.keyCode] = false;

}
 
 //scroll input handling
function onMouseScroll(event, delta, deltaX, deltaY) {
    if (deltaY > 0) {
        //scroll up 
        console.log("scrollup");
        camera.position.multiplyScalar(1.2);
    } else if (deltaY < 0) {
       //scroll down
       console.log("scrolldown");
       camera.position.multiplyScalar(0.8);
    }
    
    event.stopPropagation();
    event.preventDefault();
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