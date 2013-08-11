
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var SHADOW_MAP_WIDTH = 256, SHADOW_MAP_HEIGHT = 256;
			
			var FLATSHADING = true;

			var SCREEN_WIDTH = window.innerWidth;
			var SCREEN_HEIGHT = window.innerHeight;
			var FLOOR = 0;

			var camera, controls, scene, renderer;
			var container, stats;

			var NEAR = 5, FAR = 30000;

            var cube;
			var sceneHUD, cameraOrtho, hudMaterial;

			var light;

			var clock = new THREE.Clock();
			
			var KEYCODES = {
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
             }
			

			init();
			animate();

			function init() {

				container = document.createElement( 'div' );
				document.body.appendChild( container );

				// SCENE CAMERA

				camera = new THREE.PerspectiveCamera( 23, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
				camera.position.set( 0, 2000, 2000 );
				camera.rotation.setX(-(Math.PI/4));
                
                /*controls = new THREE.CustomControls( camera);

				controls.lookSpeed = 0.0125;
				controls.movementSpeed = 500;
				controls.noFly = false;
				controls.lookVertical = true;
				controls.constrainVertical = false;


				controls.lon = -110;*/
				
				
				// CONTROLS
				
				window.addEventListener( 'keydown', keydown, false );
	            window.addEventListener( 'keyup', keyup, false );
	            
	            function keydown(event) {
	                
                }
                
                function keyup(event) {
                    console.log(event.keyCode);
                    
                    if (event.keyCode == KEYCODES.A) {
                        console.log("A");
                    }
                
                
	                switch (event.keyCode) {
	                
	                    case KEYCODES.A:
	                        cube.position.x -= 100;
	                        console.log("a");
	                        break;
	                    case KEYCODES.D:
	                        cube.position.x += 100;
	                        console.log("d");
	                        break;
	                    case KEYCODES.W:
	                        cube.position.z -= 100;
	                        console.log("w");
	                        break;
	                    case KEYCODES.S:
	                        cube.position.z += 100;
	                        console.log("s");
	                        break;
	                    default:
	                        console.log("default");
	                }
	                    
                }
                
				// SCENE

				scene = new THREE.Scene();
				scene.fog = new THREE.Fog( 0xffffff, 1000, FAR );
				//THREE.ColorUtils.adjustHSV( scene.fog.color, 0.02, -0.15, -0.65 );

				// LIGHTS

				var ambient = new THREE.AmbientLight( 0x444444 );
				scene.add( ambient );

				light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI, 1 );
				light.position.set( 1500, 1500, 1500 );
				light.target.position.set( 0, 0, 0 );

				light.castShadow = true;

				light.shadowCameraNear = 700;  // 700
				light.shadowCameraFar = camera.far;
				light.shadowCameraFov = 50; //50

				//light.shadowCameraVisible = true;

				light.shadowBias = 0.0001;  // 0.0001
				light.shadowDarkness = 0.5; // 0.5

				light.shadowMapWidth = SHADOW_MAP_WIDTH;
				light.shadowMapHeight = SHADOW_MAP_HEIGHT;

				scene.add( light );

				createScene();

				// RENDERER

				renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
				renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
				container.appendChild( renderer.domElement );

				renderer.setClearColor( scene.fog.color, 1 );
				renderer.autoClear = false;

				//

				renderer.shadowMapEnabled = true;
				renderer.shadowMapSoft = true;

				// STATS

				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				stats.domElement.style.zIndex = 100;
				container.appendChild( stats.domElement );

				//

				window.addEventListener( 'resize', onWindowResize, false );

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

				var geometry = new THREE.PlaneGeometry( 2048, 2048 );
				var texture = THREE.ImageUtils.loadTexture( "img/grass.png" );
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set( 16, 16 );
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
    
				texture.needsUpdate = true;
                var planeMaterial;
                if (FLATSHADING) {
                    planeMaterial = new THREE.MeshPhongMaterial( { color: 0x554433 } );
                } else {
                    planeMaterial = new THREE.MeshPhongMaterial( { map: texture } );
                }
				var ground = new THREE.Mesh( geometry, planeMaterial );

				ground.position.set( 0, FLOOR, 0 );
				ground.rotation.x = - Math.PI / 2;

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
                
                var cubeGeo = new THREE.CubeGeometry( 500, 500, 500, 1, 1, 1, cubeMaterials );
                cube = new THREE.Mesh( cubeGeo, new THREE.MeshFaceMaterial());

				cube.position.y = FLOOR + 250;
				


				cube.castShadow = true;
				cube.receiveShadow = true;

				scene.add( cube );

				


		


			}

			

			function animate() {

				requestAnimationFrame( animate );

				render();
				stats.update();

			}

			function render() {

				var delta = clock.getDelta();

				//controls.update( delta );

				renderer.clear();
				renderer.render( scene, camera );

			}