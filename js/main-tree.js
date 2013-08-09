'use strict';


THREE.Plane3RandGeometry = function ( width, height, widthSegments, heightSegments ) {

	THREE.Geometry.call( this );

	var ix, iz,
	width_half = width / 2,
	height_half = height / 2,
	gridX = widthSegments || 1,
	gridZ = heightSegments || 1,
	gridX1 = gridX + 1,
	gridZ1 = gridZ + 1,
	segment_width = width / gridX,
	segment_height = height / gridZ,
	normal = new THREE.Vector3( 0, 0, 1 );

	for ( iz = 0; iz < gridZ1; iz ++ ) {

		for ( ix = 0; ix < gridX1; ix ++ ) {

			var x = ix * segment_width - width_half;
			var y = iz * segment_height - height_half;

			this.vertices.push( new THREE.Vector3( x, - y, 0 ) );

		}

	}

	for ( iz = 0; iz < gridZ; iz ++ ) {

		for ( ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iz;
			var b = ix + gridX1 * ( iz + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
			var d = ( ix + 1 ) + gridX1 * iz;

			var rnd = Math.random();
			if (rnd < 0.50)	 {
				var face = new THREE.Face3( a, b, c );
				face.normal.copy( normal );
				face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
				this.faces.push( face );
				
				var face2 = new THREE.Face3( c, d, a );
				face2.normal.copy( normal );
				face2.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
				this.faces.push( face2 );
				
				this.faceVertexUvs[ 0 ].push( [
					new THREE.Vector2( ix / gridX, 1 - iz / gridZ ),					//A
					new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ ),			//B
					new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ )	//C
				] );
				
				this.faceVertexUvs[ 0 ].push( [
					new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),	//C
					new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ ),			//D
					new THREE.Vector2( ix / gridX, 1 - iz / gridZ )					//A
				] );
			} else {
				var face3 = new THREE.Face3( b, c, d );
				face3.normal.copy( normal );
				face3.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
				this.faces.push( face3 );
				
				var face4 = new THREE.Face3( d, a, b );
				face4.normal.copy( normal );
				face4.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
				this.faces.push( face4 );
				
				this.faceVertexUvs[ 0 ].push( [
					new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ ),			//B
					new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),	//C
					new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ )			//D
				] );
				
				this.faceVertexUvs[ 0 ].push( [
					new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ ),			//D
					new THREE.Vector2( ix / gridX, 1 - iz / gridZ ),					//A
					new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ )			//B
				] );
			}
		}

	}

	this.computeCentroids();

};

THREE.Plane3RandGeometry.prototype = Object.create( THREE.Geometry.prototype );


THREE.Plane3Geometry = function ( width, height, widthSegments, heightSegments ) {

	THREE.Geometry.call( this );

	var ix, iz,
	width_half = width / 2,
	height_half = height / 2,
	gridX = widthSegments || 1,
	gridZ = heightSegments || 1,
	gridX1 = gridX + 1,
	gridZ1 = gridZ + 1,
	segment_width = width / gridX,
	segment_height = height / gridZ,
	normal = new THREE.Vector3( 0, 0, 1 );

	for ( iz = 0; iz < gridZ1; iz ++ ) {

		for ( ix = 0; ix < gridX1; ix ++ ) {

			var x = ix * segment_width - width_half;
			var y = iz * segment_height - height_half;

			this.vertices.push( new THREE.Vector3( x, - y, 0 ) );

		}

	}

	for ( iz = 0; iz < gridZ; iz ++ ) {

		for ( ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iz;
			var b = ix + gridX1 * ( iz + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
			var d = ( ix + 1 ) + gridX1 * iz;

			/*var face = new THREE.Face4( a, b, c, d );
			face.normal.copy( normal );
			face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );
			
			this.faces.push( face );
			this.faceVertexUvs[ 0 ].push( [
				new THREE.UV( ix / gridX, 1 - iz / gridZ ),
				new THREE.UV( ix / gridX, 1 - ( iz + 1 ) / gridZ ),
				new THREE.UV( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),
				new THREE.UV( ( ix + 1 ) / gridX, 1 - iz / gridZ )
			] );*/
			
			
			var face = new THREE.Face3( a, b, c );
			face.normal.copy( normal );
			face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
			this.faces.push( face );
			/*this.faceVertexUvs[ 0 ].push( [
				new THREE.UV( ix / gridX, 1 - iz / gridZ ),
				new THREE.UV( ix / gridX, 1 - ( iz + 1 ) / gridZ ),
				new THREE.UV( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ )
			] );*/
			
			var face2 = new THREE.Face3( c, d, a );
			face2.normal.copy( normal );
			face2.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );
			this.faces.push( face2 );
			/*this.faceVertexUvs[ 0 ].push( [
				new THREE.UV( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),
				new THREE.UV( ( ix + 1 ) / gridX, 1 - iz / gridZ ), 
				new THREE.UV( ix / gridX, 1 - iz / gridZ ),
			] );*/
			
/*			this.faceVertexUvs[ 0 ].push( [
				new THREE.UV( ix / gridX, 1 - iz / gridZ ),
				new THREE.UV( ix / gridX, 1 - ( iz + 1 ) / gridZ ),
				new THREE.UV( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),
				new THREE.UV( ( ix + 1 ) / gridX, 1 - iz / gridZ )
			] );
*/
			this.faceVertexUvs[ 0 ].push( [
				new THREE.Vector2( ix / gridX, 1 - iz / gridZ ),			//A
				new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ ),		//B
				new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ )	//C
			] );
			
			this.faceVertexUvs[ 0 ].push( [
				new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ ),	//C
				new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ ),		//D
				new THREE.Vector2( ix / gridX, 1 - iz / gridZ )			//A
			] );

		}

	}

	this.computeCentroids();

};

THREE.Plane3Geometry.prototype = Object.create( THREE.Geometry.prototype );



if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var SHADOW_MAP_WIDTH = 512, SHADOW_MAP_HEIGHT = 512; // 512

var FLATSHADING = true;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;


var camera, controls, scene, renderer, cameraPlaceholder, cameraPlaceholderHelper, gameCameraTarget, planes, projector;
var horse, castle, player, tree;
var container, stats;

var NEAR = 1, FAR = 2000;

var worldWidth = 64;
var worldDepth = 64;

var cube, terrain, terrain2, terrain3, water;
//var sceneHUD, cameraOrtho, hudMaterial;

var light, light2, lightRig, ambient, moon;

var treeGeo, treeMats;

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
 }; //keycode enum
var keys = []; // array for storing which keys are up/down

init();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

 
    // EVENTS
    

    
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'keyup', onKeyUp, false );
    $('body').mousewheel( onMouseScroll ) ;
    $('body').mouseup( onMouseUp ) ;
    
    // SCENE

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0xffffff, 1000, FAR );
    //THREE.ColorUtils.adjustHSV( scene.fog.color, 0.02, -0.15, -0.65 );
    
    
    // SCENE CAMERA

    camera = new THREE.PerspectiveCamera( 45, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
    //gameCameraTarget = new THREE.Vector3(0,0,0);

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
    
    
    // TESTING CONTROLS
    //controls = new THREE.TrackballControls(camera, renderer.domElement );
    

}

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


function createRandomPlane(x, y, material, multiplier, subtractor) {
    var data = generateHeight( worldWidth, worldDepth );
    var terrainGeometry = new THREE.Plane3RandGeometry( x, y, worldWidth - 1, worldDepth - 1 );
    //geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    for ( var i = 0, l = terrainGeometry.vertices.length; i < l; i ++ ) {
        terrainGeometry.vertices[ i ].z = data[ i ] * multiplier - subtractor;
    }

    terrainGeometry.computeCentroids();
    terrainGeometry.computeFaceNormals();

    var t = new THREE.Mesh( terrainGeometry, material  );
    t.castShadow = true;
    t.receiveShadow = true;
    return t;
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
//    terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial /*THREE.MeshPhongMaterial*/( { color: 0x557733, shading: THREE.FlatShading }));

    terrain = createRandomPlane(terrainSize, terrainSize, new THREE.MeshLambertMaterial /*THREE.MeshPhongMaterial*/( { color: 0x557733, shading: THREE.FlatShading } ), .25, 6);

    scene.add( terrain );


    terrain2 = createRandomPlane(terrainSize, terrainSize, new THREE.MeshLambertMaterial /*THREE.MeshPhongMaterial*/( { color: 0xFAD55C, shading: THREE.FlatShading } ), .75, 35);
    //terrain2.position.z = -10
    scene.add( terrain2 );

    //terrain3 = createRandomPlane(terrainSize, terrainSize, new THREE.MeshLambertMaterial /*THREE.MeshPhongMaterial*/( { color: 0x6E3518, shading: THREE.FlatShading } ), .55, 40);
    //scene.add( terrain3 );
    //terrain2.position.z = -30

    //planes = [ water, terrain, terrain2, terrain3 ];
    planes = [ water, terrain];

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
    player = new THREE.Mesh( cubeGeo, cubeMaterials);
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
        
var pauseRotation = false;

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
            //console.log(c[i], c[i].object == terrain, c[i].object == water);
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

    var c = r.intersectObjects([ terrain, water, terrain2 ], true);


    //console.log('colls', c);

    return c;
}

var chaseCamEnabled = true;
var chaseScale = 1;
var toggleWatchers = {};

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

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

    updateChaseCamLocation();

    var playerMoved = false,
        playerSpeed = 0.05,
        playerAngleSpeed = Math.PI / 2 * playerSpeed;
    
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

        lightRig.rotation.y -= .001; // time of day
        light.intensity = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(1.3, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)*2) : 0
        light2.intensity = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(1.3, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)*2) : 0
        light.shadowDarkness = Math.abs(lightRig.rotation.y / Math.PI % 2) < 1 ? Math.min(0.25, Math.sin(Math.abs(lightRig.rotation.y / Math.PI % 2) * Math.PI)/2) : 0
    }
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
    if (toggleWatchers[event.keyCode] != null) {
        toggleWatchers[event.keyCode] = false;
    }
}
 
 //scroll input handling
function onMouseScroll(event, delta, deltaX, deltaY) {
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

    //console.log('down', event);
    event.preventDefault();

    var mouse = {};
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    projector.unprojectVector(vector, camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObjects([ terrain, terrain2 ], true);

    if (intersects.length > 0) {
        addTree(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z);
    }
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
