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
  makeCells(24, 4);
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

function makeCells (numCells, numCols) {
  var angle = (2 * Math.PI) / numCells,
    elemWidth = 2 * INPUT_DISTANCE * Math.tan(angle / 2),
    cAngle = 0;

  var pos = {
    x: camera.position.x + INPUT_DISTANCE,
    z: camera.position.z
  }

  var geometry = new THREE.PlaneGeometry(5, 5);

  var material = new THREE.MeshBasicMaterial({ wireframe: true });

  var yCoord = camera.position.z;
  var centerPoint = new THREE.Vector3(0,0,1);

  for (var i = 0; i <= numCells; i++) {
    for (var j = 0; j < numCols; j++) {
      cells[i + j] = makeCell(i, elemWidth, elemWidth);

      // * 1.1 to remove overlap. need to find out what causes overlap
      yCoord = j * elemWidth * 1.1;

      // position.set(x, y, z)
      cells[i + j].position.set(
        pos.x,
        yCoord,
        pos.z
      );

      scene.add(cells[i + j]);

      centerPoint.setY(yCoord);

      cells[i + j].lookAt(centerPoint);
    }
    pos.x = camera.position.x + (INPUT_DISTANCE * Math.cos(cAngle));
    pos.z = camera.position.z + (INPUT_DISTANCE * Math.sin(cAngle));

    cAngle += angle;
  }
  camera.position.y = (j / 2) * elemWidth * 1.1
}

// change to more OO approach, cell constructor
function makeCell (cellIndex, width, height) {
  var cell = document.createElement( 'textarea' );

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
