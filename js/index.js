var INPUT_DISTANCE = 400;

var scene, camera, renderer, controls, hud;

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

  hud = new THREE.CSS3DObject( domElem );
  hud.position.set( 0, 0, -300 );

  camera.add( hud );

  // add cells
  makeCells(2);
  animate();
  
  // how to determine if a cell is no longer hovered over by hud?
  // var cellElems = document.getElementsByClassName("cell");
  //
  // function onCellFocus(e) {
  //   console.log("focused");
  //   console.log(e);
  // }
  //
  // function onCellFocusOut(e) {
  //   console.log("blurry");
  //   console.log(e);
  // }
  //
  // if (cellElems.length) {
  //   for (var i = 0; i < cellElems.length; i++) {
  //     cellElems[i].addEventListener('focus', onCellFocus, true);
  //     cellElems[i].addEventListener('focusOut', onCellFocusOut, true);
  //   }
  // }
}

function findFocusedCell () {
  var pos = hud.elementL.getBoundingClientRect(),
    x = pos.left,
    y = pos.top,
    elem = document.elementFromPoint(x, y),
    cell;

  if (elem && elem.className.indexOf("cell") >= 0) {
    elem.focus();
    cell = cells[elem.getAttribute("data-index")];
    // console.log(elem);
    cell.elementR.value = cell.elementL.value;
  }
}

var CELL_WIDTH = 100,
  CELL_HEIGHT = 100;

var planeMesh;

function makeCells (numCells) {
  var geometry = new THREE.PlaneGeometry(5, 5);
  var material = new THREE.MeshBasicMaterial({ wireframe: true });

  for (var i = 0; i < numCells; i++) {
    planeMesh = new THREE.Mesh( geometry, material );

    planeMesh.position.set(
      INPUT_DISTANCE,
      CELL_HEIGHT / 2,
      i * CELL_WIDTH
    )
    scene.add(planeMesh);
    planeMesh.lookAt(camera.position);

    cells[i] = makeCell(i, CELL_WIDTH, CELL_HEIGHT);

    // position.set(x, y, z)
    cells[i].position.set(
      INPUT_DISTANCE,
      CELL_HEIGHT / 2,
      i * CELL_WIDTH
    );

    scene.add(cells[i]);

    cells[i].lookAt(camera.position);
  }
}



// change to more OO approach, cell constructor
function makeCell (cellIndex, width, height) {
  var cell = document.createElement( 'input' );

  cell.className = 'cell';
  cell.setAttribute("data-index", cellIndex);

  cell.style.width = width + 'px';
  cell.style.height = height + 'px';

  return new THREE.CSS3DObject( cell );
}

function animate () {
  requestAnimationFrame( animate );

  findFocusedCell();

  controls.update();

  renderer.render( scene, camera );
}

init();
