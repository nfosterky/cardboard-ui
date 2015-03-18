var scene, camera, renderer, controls;

var cells = [];

function init () {
  // create scene
  scene = new THREE.Scene();

  // add renderer
  renderer = new THREE.CSS3DStereoRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.domElement.style.position = 'absolute';
  document.body.appendChild( renderer.domElement );

  // add lighting
  scene.add( new THREE.AmbientLight( 0x666666 ) );
  light = new THREE.PointLight( 0xaaddaa, .5 );
  light.position.set( 50, 1200, -500 );
  scene.add( light );

  // add camera
  camera = new THREE.PerspectiveCamera( 40, window.innerWidth /
      window.innerHeight, 1, 1000 );

  scene.add( camera );
  
  // add view controls
  controls = new THREE.DeviceOrientationControls( camera );

  // add hud / pointer for camera

  var domElem = document.createElement( 'div' );
  domElem.className = 'hud';
  domElem.style.width = window.innerWidth * 0.01 + 'px';
  domElem.style.height = window.innerWidth * 0.01 + 'px';

  var hud = new THREE.CSS3DObject( domElem );
  hud.position.set( 0, 0, -300 );

  camera.add( hud );

  // add cells
  makeCells(2);
  animate();
}

var CELL_WIDTH = 100,
  CELL_HEIGHT = 100;

function makeCells (numCells) {
  for (var i = 0; i < numCells; i++) {
    cells[i] = makeCell(i, CELL_WIDTH, CELL_HEIGHT);

    // position.set(x, y, z)
    cells[i].position.set(
      400,
      CELL_HEIGHT / 2,
      i * CELL_WIDTH
    );

    scene.add(cells[i]);

    cells[i].lookAt(camera.position);
  }
  cells[0].elementL.focus();
}

// change to more OO approach, cell constructor
function makeCell (cellIndex, width, height) {
  var cell = document.createElement( 'input' );

  cell.className = 'cell';
  cell.id = 'c_' + cellIndex;

  cell.style.width = width + 'px';
  cell.style.height = height + 'px';

  return new THREE.CSS3DObject( cell );
}

function animate () {
  requestAnimationFrame( animate );

  controls.update();

  renderer.render( scene, camera );
}

init();
