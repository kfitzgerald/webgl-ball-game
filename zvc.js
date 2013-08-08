var container, stats;
var camera, scene, projector, renderer;

var cameraX = 0;
var cameraY = 0;
var cameraAngle = 0;
var cameraLookAt = {x:0,y:10,z:0};

var modelLoader;

var keys = [];

var cow;
var cowTurnAngle = 0;

var zombies = [];
var zombieLength = 0;

var scoreText;
var score = 0;
var scoreInc = 100;

var scoreMesh;
var scoreMeshEnd;

var uiHome;
var uiEnd;
var uiLogo;
var uiAbout;
var uiGame;
var ui;

var gameStarted = false;

var healthBar;
var healthBarIn;
var healthBarOut;
var health = 100;

var mouseX = 0;
var mouseY = 0;

var playOver,aboutOver,playAgainOver,playOut,aboutOut,playAgainOut;

initDebugger();
initSimple3D();
loadModels();

function initDebugger() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.color = "#666666";
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = '';
    container.appendChild( info );
    
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );
}

function initSimple3D() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.y = 0;
    camera.position.z = 0;
    camera.position.z = 80;
    scene = new THREE.Scene();
    scene.add( camera );

    projector = new THREE.Projector();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild(renderer.domElement);

    addPointLight(0x0051A3,1,200,0,100,10);
    addPointLight(0xFF8A2E, 2.5, 90, 10, 20, 0);
    addPointLight(0xFF8A2E,2.5,90,-30,20,0);
    addPointLight(0xffffff,2,70,0,40,50);
}

function addPointLight(color,a,r,x,y,z)  {
    var pl = new THREE.PointLight(color,a, r);
    pl.position.x = x;
    pl.position.y = y;
    pl.position.z = z;
    scene.add( pl );
    return pl;
}

function loadModels() {
    modelLoader = new ModelLoader(scene);
    modelLoader.onProggress = onProggress;
    modelLoader.load({name:"barn",model:"models/barn.js",texture:"models/barn.png",material:"Lambert"});
    modelLoader.load({name:"barrels",model:"models/barrels.js",texture:"models/barrels.png",material:"Lambert"});
    modelLoader.load({name:"fences",model:"models/fences.js",texture:"models/fences.png",material:"Lambert"});
    modelLoader.load({name:"waterTank",model:"models/waterTank.js",texture:"models/waterTank.png",material:"Lambert"});
    modelLoader.load({name:"well",model:"models/well.js",texture:"models/well.png",material:"Lambert"});
    modelLoader.load({name:"barn",model:"models/barn.js",texture:"models/barn.png",material:"Lambert"});
    modelLoader.load({name:"rocks",model:"models/rocks.js",texture:"models/rocks.png",material:"Lambert"});
    modelLoader.load({name:"tree",model:"models/tree.js",texture:"models/tree.png",material:"Lambert"});
    modelLoader.load({name:"water",model:"models/water.js",texture:"models/water.png",material:"Lambert",inverse:true});
    modelLoader.load({name:"cow",model:"models/cow.js",texture:"models/cow.png",material:"Lambert"});
    modelLoader.load({name:"zombi",model:"models/zombi.js",texture:"models/zombi.png",material:"Lambert"});
    
    modelLoader.loadTexture({name:"playOut",texture:"models/play.png"});
    modelLoader.loadTexture({name:"playAgainOut",texture:"models/play_again.png"});
    modelLoader.loadTexture({name:"aboutOut",texture:"models/about.png"});
    modelLoader.loadTexture({name:"homeOut",texture:"models/home.png"});
    modelLoader.loadTexture({name:"howOut",texture:"models/how.png"});

    modelLoader.loadTexture({name:"playOver",texture:"models/play_over.png"});
    modelLoader.loadTexture({name:"playAgainOver",texture:"models/play_again_over.png"});
    modelLoader.loadTexture({name:"aboutOver",texture:"models/about_over.png"});
    modelLoader.loadTexture({name:"homeOver",texture:"models/home_over.png"});
    modelLoader.loadTexture({name:"howOver",texture:"models/how_over.png"});
    
    modelLoader.loadTexture({name:"mainAbout",texture:"models/mainabout.png"});
    modelLoader.loadTexture({name:"mainHow",texture:"models/mainhow.png"});
    
    modelLoader.load({name:"logo_zombies",model:"models/logo_zombies.js",color:0xCDFA52,material:"Lambert",autoAdd:false});
    modelLoader.load({name:"logo_vs",model:"models/logo_vs.js",color:0x666666,material:"Lambert",autoAdd:false});
    modelLoader.load({name:"logo_cow",model:"models/logo_cow.js",texture:"models/logo.png",material:"Lambert",autoAdd:false});
    modelLoader.load({name:"play",model:"models/play.js",material:"Basic",inverse:true,autoAdd:false});
    modelLoader.load({name:"about",model:"models/about.js",material:"Basic",inverse:true,autoAdd:false});
    modelLoader.load({name:"how",model:"models/how.js",material:"Basic",inverse:true,autoAdd:false});
    
    modelLoader.load({name:"your_score",model:"models/your_score.js",color:0xCCFF99,material:"Lambert",autoAdd:false});
    modelLoader.load({name:"play_again",model:"models/play_again.js",material:"Basic",inverse:true,autoAdd:false});
    modelLoader.load({name:"about2",model:"models/about2.js",material:"Basic",inverse:true,autoAdd:false});
    
    
    modelLoader.load({name:"main_about",model:"models/mainabout.js",material:"Basic",inverse:true,autoAdd:false});
    modelLoader.load({name:"back",model:"models/back.js",texture:"models/back.png",material:"Basic",inverse:true,autoAdd:false});


    modelLoader.load({name:"health_bar_in",color:0xFF3333,model:"models/health_bar_in.js",material:"Lambert",autoAdd:false});
    modelLoader.load({name:"health_bar_out",texture:"models/tree.png", model:"models/health_bar_out.js",color:0x666666, material:"Lambert",autoAdd:false});


    modelLoader.load({name:"keyboardup",texture:"models/keyboarddown.png",model:"models/keyboardup.js",color:0xffffff,material:"Lambert",autoAdd:false});
    modelLoader.load({name:"keyboardright",texture:"models/keyboardleft.png",model:"models/keyboardright.js",color:0xffffff,material:"Lambert",autoAdd:false});
    modelLoader.load({name:"keyboardleft",texture:"models/keyboardright.png",model:"models/keyboardleft.js",color:0xffffff,material:"Lambert",autoAdd:false});
    modelLoader.load({name:"keyboarddown",texture:"models/keyboardup.png",model:"models/keyboarddown.js",color:0xffffff,material:"Lambert",autoAdd:false});		

    modelLoader.loadGeometry({name:"0", model:"models/number0.js"});
    modelLoader.loadGeometry({name:"1", model:"models/number1.js"});
    modelLoader.loadGeometry({name:"2", model:"models/number2.js"});
    modelLoader.loadGeometry({name:"3", model:"models/number3.js"});
    modelLoader.loadGeometry({name:"4", model:"models/number4.js"});
    modelLoader.loadGeometry({name:"5", model:"models/number5.js"});
    modelLoader.loadGeometry({name:"6", model:"models/number6.js"});
    modelLoader.loadGeometry({name:"7", model:"models/number7.js"});
    modelLoader.loadGeometry({name:"8", model:"models/number8.js"});
    modelLoader.loadGeometry({name:"9", model:"models/number9.js"});
}

function onProggress(a,b) {
    info.innerHTML = Math.floor(a/b*100);
    if(a/b*100 == 100) {
        info.innerHTML = "";
        TWEEN.start();
        
        document.addEventListener('keydown',onKeyDown,true);
        document.addEventListener('keyup',onKeyUp,true);
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        
        cow = modelLoader.get("cow");
        
        modelLoader.get("zombi").visible = false;
        
        uiGame = new THREE.Object3D();
        uiGame.position.y = 26;
        
        healthBarIn = modelLoader.get("health_bar_in");
        healthBarIn.doubleSided = true;
        healthBarOut = modelLoader.get("health_bar_out");
        healthBarOut.doubleSided = true;		
        
        healthBarIn.scale.x = 1;
        
        healthBar = new THREE.Object3D();
        healthBar.add(healthBarIn);
        healthBar.add(healthBarOut);
        
        healthBar.scale.set(0.5,0.5,0.5);
        healthBar.position.set(46,60,3);
        healthBar.rotation.y = -35/180*Math.PI
        
        uiGame.add(healthBar);
        scene.add(uiGame);
        
        
        playOver = modelLoader.getTexture("playOver");
        playAgainOver = modelLoader.getTexture("playAgainOver");
        aboutOver = modelLoader.getTexture("aboutOver");
        homeOver = modelLoader.getTexture("homeOver");
        howOver = modelLoader.getTexture("howOver");
        
        playOut = modelLoader.getTexture("playOut");
        playAgainOut = modelLoader.getTexture("playAgainOut");
        aboutOut = modelLoader.getTexture("aboutOut");
        homeOut = modelLoader.getTexture("homeOut");
        howOut = modelLoader.getTexture("howOut");
        
        modelLoader.get("main_about").material.map = modelLoader.getTexture("mainAbout");
        
        modelLoader.get("play").material.map = playOut;
        modelLoader.get("play_again").material.map = playAgainOut;
        modelLoader.get("about").material.map = aboutOut;
        modelLoader.get("about2").material.map = homeOut;
        modelLoader.get("how").material.map = howOut;			
        
        render();
        initUI();
        openHomeUI();
    }
}
function resetCow() {
    cow.position.x = 0;
    cow.position.z = 0;
    cow.rotation.y = 0;
    cowTurnAngle = 0;
}
function render() {
    requestAnimationFrame( render );
    camera.lookAt(cameraLookAt);
    renderer.render( scene, camera );
    stats.update();

    //cameraX = Math.sin(cameraAngle/180*Math.PI)*80;
    //cameraY = Math.cos(cameraAngle/180*Math.PI)*15;
    
    cameraAngle+=0.15;
    
    updateZombies();
    
    cameraX = (mouseX/window.innerWidth*2 - 1)*60;
    cameraY = (mouseY/window.innerHeight*2 - 1)*15 + 60;
    
    if(gameStarted) {
        cameraX = 0;
        cameraY = 60;
        
        scoreInc+=1;
        if(scoreInc%50==0) {
            score++;
            if(scoreMesh!=null) {
                uiGame.remove(scoreMesh);
            }
            scoreMesh = createScoreText(score,0.5,-46,0,3,35/180*Math.PI);
            uiGame.add(scoreMesh);
        }
        
        for(var i = 0; i<zombieLength; i++ ){
            if(Math.sqrt((cow.position.x-zombies[i].mesh.position.x)*(cow.position.x-zombies[i].mesh.position.x) + (cow.position.z-zombies[i].mesh.position.z)*(cow.position.z-zombies[i].mesh.position.z))<5 && zombies[i].data.state != 2) {
                health--;
                healthBarIn.scale.x=health/100;
            }
        }
        
        if(health<1) {
            openEndUI();
            gameStarted=false;
            if(scoreMeshEnd!=null) {
                uiEnd.remove(scoreMeshEnd);
            }
            scoreMeshEnd = createScoreText(score,1,0,38,20,0);
            uiEnd.add(scoreMeshEnd);	
        }
    }
    
    if (cow!=null&&gameStarted) {
        
        if(keys[38]) {
            cowSpeed = 0.3;
        }else{
            if(keys[40]) {
                cowSpeed = -0.3;
            }else{
                cowSpeed = 0;
            }
        }
        if(keys[37]) {
            cowTurnAngle+=6;
        }
        if(keys[39]) {
            cowTurnAngle-=6;
        }
        
        if(cow.position.x>35) {
            cow.position.x = 35;
        }
        if(cow.position.x<-35) {
            cow.position.x = -35;
        }
        if(cow.position.z>35) {
            cow.position.z = 35;
        }
        if(cow.position.z<-35) {
            cow.position.z = -35;
        }
        
        cow.position.x += Math.sin(cowTurnAngle/180*Math.PI)*cowSpeed;
        cow.position.z += Math.cos(cowTurnAngle/180*Math.PI)*cowSpeed;
        cow.rotation.y = cowTurnAngle/180*Math.PI;
    }
    camera.position.x += (cameraX - camera.position.x)*0.05
    camera.position.y += (cameraY - camera.position.y)*0.05
}

function createZombie() {
    var mesh = new THREE.Mesh( modelLoader.get("zombi").geometry, modelLoader.get("zombi").material );
    zombies[zombieLength] = {mesh:mesh,data: new Object() };
    zombies[zombieLength].data.state = 0;
    zombies[zombieLength].data.liveCount = 0;
    
    scene.add(mesh);
    zombieLength++;
    return mesh;
}

function addZombie() {
    if(gameStarted) {
        if(zombieLength!=19) {
            moveZombie(createZombie());
            window.setTimeout( addZombie, 15000 + Math.random()*2000 );
        }
    }
}
function moveZombie(z) {
    z.position.y = -30;
    z.position.x = Math.random()*60-30
    z.position.z = Math.random()*60-30;	
}

function resetZombies() {
    for(var i = 0; i<zombieLength; i++ ){
        scene.remove(zombies[i].mesh);
        zombies[i].mesh = null;
        zombies[i].data = null;
        zombies[i] = null;
    }
    zombies = [];
    zombieLength = 0;
}
    
function updateZombies() {
    for(var i = 0; i<zombieLength; i++ ){
        if(gameStarted) {
        zombies[i].mesh.rotation.y = 90/180*Math.PI-Math.atan2(cow.position.z-zombies[i].mesh.position.z,cow.position.x-zombies[i].mesh.position.x);
        if(zombies[i].data.state==0) {
            zombies[i].mesh.position.y+=(0-zombies[i].mesh.position.y)*0.1;
            zombies[i].data.liveCount++;
            if(zombies[i].data.liveCount>90) {
                zombies[i].data.speedX = Math.sin(90/180*Math.PI-Math.atan2(cow.position.z-zombies[i].mesh.position.z,cow.position.x-zombies[i].mesh.position.x))*0.2
                zombies[i].data.speedZ = Math.cos(90/180*Math.PI-Math.atan2(cow.position.z-zombies[i].mesh.position.z,cow.position.x-zombies[i].mesh.position.x))*0.2
                zombies[i].data.state=1;
                zombies[i].data.liveCount = 0;
            }
        }
        if(zombies[i].data.state==1) {
            zombies[i].mesh.position.x+=zombies[i].data.speedX;
            zombies[i].mesh.position.z+=zombies[i].data.speedZ;
            zombies[i].data.liveCount++;
            
            if(zombies[i].data.liveCount>150+Math.floor(Math.random()*150)) {
                zombies[i].data.state=2;
                zombies[i].data.liveCount = 0;
            }
            if(zombies[i].mesh.position.x>35) {
                zombies[i].mesh.position.x = 35;
            }
            if(zombies[i].mesh.position.x<-35) {
                zombies[i].mesh.position.x = -35;
            }
            if(zombies[i].mesh.position.z>35) {
                zombies[i].mesh.position.z = 35;
            }
            if(zombies[i].mesh.position.z<-35) {
                zombies[i].mesh.position.z = -35;
            }
        }
        if(zombies[i].data.state==2) {
            zombies[i].mesh.position.y+=(-25-zombies[i].mesh.position.y)*0.1;
            zombies[i].data.liveCount++;
            if(zombies[i].data.liveCount>90) {
                zombies[i].mesh.position.x = Math.random()*60-30
                zombies[i].mesh.position.z = Math.random()*60-30;	
                zombies[i].mesh.rotation.y = 90/180*Math.PI-Math.atan2(zombies[i].mesh.position.z,zombies[i].mesh.position.x);
                zombies[i].data.state=0;
                zombies[i].data.liveCount = 0;
            }
        }
        }
    }
}
function onDocumentMouseDown( event ) {
    event.preventDefault();

    var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
    projector.unprojectVector( vector, camera );

    var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );
    var intersects = ray.intersectObjects( modelLoader.objects );

    if ( intersects.length > 0 ) {
        if(intersects[ 0 ].object.name == "play" || intersects[ 0 ].object.name == "play_again") {
            resetGame();
            openGameUI();
            startGame();
        }
        if(intersects[ 0 ].object.name == "about") {
            openAboutUI();
        }
        if(intersects[ 0 ].object.name == "about2" || intersects[ 0 ].object.name == "back") {
            resetGame();
            openHomeUI();
        }
        if(intersects[ 0 ].object.name == "how") {
            resetGame();
            openHowUI();
        }
    }
}
function resetGame() {
    health = 100;
    score = 0;
    healthBarIn.scale.x=health/100;
    resetZombies();
    resetCow();
    if(scoreMesh!=null) {
        uiGame.remove(scoreMesh);
    }
    scoreMesh = null;
}
function startGame() {
    gameStarted = true;
    window.setTimeout( addZombie, 3000);
}
function onDocumentMouseMove( event ) {
    event.preventDefault();
    
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
    projector.unprojectVector( vector, camera );

    var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );
    var intersects = ray.intersectObjects( modelLoader.objects );

    if ( intersects.length > 0 ) {
        if(intersects[ 0 ].object.name == "play") {
            modelLoader.get("play").material.map = playOver;
        }else{
            modelLoader.get("play").material.map = playOut;
        }
        if(intersects[ 0 ].object.name == "about") {
            modelLoader.get("about").material.map = aboutOver;
        }else{
            modelLoader.get("about").material.map = aboutOut;
        }
        if(intersects[ 0 ].object.name == "play_again") {
            modelLoader.get("play_again").material.map = playAgainOver;
        }else{
            modelLoader.get("play_again").material.map = playAgainOut;
        }
        if(intersects[ 0 ].object.name == "about2") {
            modelLoader.get("about2").material.map = homeOver;
        }else{
            modelLoader.get("about2").material.map = homeOut;
        }
        if(intersects[ 0 ].object.name == "back") {
            modelLoader.get("back").material.map = homeOver;
        }else{
            modelLoader.get("back").material.map = homeOut;
        }
        if(intersects[ 0 ].object.name == "how") {
            modelLoader.get("how").material.map = howOver;
        }else{
            modelLoader.get("how").material.map = howOut;
        }
    }
}
function createScoreText(score,s,x,y,z,r) {
    var scoreSTR = score.toString();
    var scoreARY = scoreSTR.split("");
    var smesh = new THREE.Object3D();
    
    for(var i=0; i<scoreARY.length; i++) {
        var material = new THREE["MeshLambertMaterial"]( { color:0xCCCCCC,shading:THREE.SmoothShading, blending:THREE.AdditiveBlending } ); 
        var mesh = new THREE.Mesh(modelLoader.getGeometry(scoreARY[i]), material );
        mesh.scale.set(s,s,s);
        mesh.position.x = i*(5*s) - ((scoreARY.length*(5*s)-(5*s)*0.5)*0.5);
        smesh.add(mesh);
    }
    smesh.position.x = x;
    smesh.position.y = y;
    smesh.position.z = z;
    
    smesh.rotation.y = r;
    
    return smesh
}
    
function initUI() {
    uiEnd = new THREE.Object3D();
    uiEnd.add(modelLoader.get("your_score"));
    uiEnd.add(modelLoader.get("play_again"));
    uiEnd.add(modelLoader.get("about2"));


    uiHome = new THREE.Object3D();
    uiHome.add(modelLoader.get("play"));
    uiHome.add(modelLoader.get("about"));
    uiHome.add(modelLoader.get("how"));
    
    uiLogo = new THREE.Object3D();
    uiLogo.add(modelLoader.get("logo_zombies"));
    uiLogo.add(modelLoader.get("logo_vs"));
    uiLogo.add(modelLoader.get("logo_cow"));

    uiAbout = new THREE.Object3D();
    uiAbout.add(modelLoader.get("main_about"));
    uiAbout.add(modelLoader.get("back"));

    uiKeyboardButtons = new THREE.Object3D();
    uiKeyboardButtons.add(modelLoader.get("keyboardup"));
    uiKeyboardButtons.add(modelLoader.get("keyboarddown"));
    uiKeyboardButtons.add(modelLoader.get("keyboardleft"));
    uiKeyboardButtons.add(modelLoader.get("keyboardright"));
    uiAbout.add(uiKeyboardButtons);
    
    
    scene.add(uiEnd);
    scene.add(uiHome);
    scene.add(uiAbout);
    scene.add(uiLogo);
    
    /*THREE.SceneUtils.showHierarchy(uiEnd, false);
    THREE.SceneUtils.showHierarchy(uiHome, false);
    THREE.SceneUtils.showHierarchy(uiAbout, false);
    THREE.SceneUtils.showHierarchy(uiGame, false);*/
}

function hideUI(ui_holder,v) {
    THREE.SceneUtils.traverseHierarchy( ui_holder, function ( object ) { 
                                                    object.visible = v;
                                                    object.position.y = v?0:500;
                                                   } );
}
function scaleUI(ui_holder,v) {
    THREE.SceneUtils.traverseHierarchy( ui_holder, function ( object ) { 
                                                    object.scale.x = v;
                                                    object.scale.y = v;
                                                    object.scale.z = v;
                                                    
                                                   } );
}

function openHomeUI() {
    uiLogo.position.x = 0;
    hideUI(uiEnd, false);
    hideUI(uiHome, true);
    hideUI(uiAbout, false);
    hideUI(uiGame, false);
    hideUI(uiLogo, true);
}
function openGameUI() {
    hideUI(uiEnd, false);
    hideUI(uiHome, false);
    hideUI(uiAbout, false);
    hideUI(uiGame, true);
    hideUI(uiLogo, false);
}

function openEndUI() {
    hideUI(uiEnd, true);
    hideUI(uiHome, false);
    hideUI(uiAbout, false);
    hideUI(uiGame, false);
    hideUI(uiLogo, false);
}

function openAboutUI() {
    uiLogo.position.x = -10;
    hideUI(uiEnd, false);
    hideUI(uiHome, false);
    hideUI(uiAbout, true);
    hideUI(uiGame, false);
    hideUI(uiLogo, true);
    hideUI(uiKeyboardButtons,false);
    modelLoader.get("main_about").material.map = modelLoader.getTexture("mainAbout");
}

function openHowUI() {
    uiLogo.position.x = -10;
    hideUI(uiEnd, false);
    hideUI(uiHome, false);
    hideUI(uiAbout, true);
    hideUI(uiGame, false);
    hideUI(uiLogo, true);
    hideUI(uiKeyboardButtons,true);
    modelLoader.get("main_about").material.map = modelLoader.getTexture("mainHow");
}

function onKeyDown(event) {
    keys[event.keyCode] = true;
}
function onKeyUp(event) {
    keys[event.keyCode] = false;
}