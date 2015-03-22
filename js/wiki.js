var INPUT_DISTANCE = 500;
var WIKI_ROOT = "http://en.wikipedia.org/wiki/";

var scene, camera, renderer, controls, pointer, vObj;

var cells = [];
var pages = [];

var move = {
  up: false,
  down: false
};

var elemStartHoverTime;
var currentElem;

// current element under pointer
var currentIndex = false;

function prep () {
  var searchForm = document.getElementById("searchForm"),
    inpSearch = document.getElementById("searchInput"),
    btnSearch = document.getElementById("searchButton");

  btnSearch.onclick = function () {
    if (inpSearch.value.length) {
      init(inpSearch.value)
      // hide ui

      searchForm.style.display = "none";

    } else {
      alert("Please enter search term");
    }
  }
}

function init (searchTerm) {
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

  // add pointer / pointer for camera

  var domElem = document.createElement( 'div' );
  domElem.className = 'pointer';
  domElem.style.width = window.innerWidth * 0.01 + 'px';
  domElem.style.height = window.innerWidth * 0.01 + 'px';

  pointer = new THREE.CSS3DObject( domElem );
  pointer.position.set( 0, 0, -300 );

  camera.add( pointer );

  requestPage( "Cat" );
  // requestPage( searchTerm );

  animate();

  initGyro();
}

function requestPage ( title ) {
  $.ajax({
      type: "GET",
      url: "http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=" + title + "&callback=?",
      contentType: "application/json; charset=utf-8",
      async: false,
      dataType: "json",
      success: makePage,
      error: function (errorMessage) {
        console.log("error: ", errorMessage);
      }
  });
}

function makePage (data, textStatus, jqXHR) {
  var page = document.createElement( 'div' ),
    content = document.createElement( 'div' ),
    pageObj, pagePos;

  page.className = "page";
  page.setAttribute("data-index", pages.length);

  page.appendChild(makeCloseButton());
  content.innerHTML = data.parse.text["*"];
  page.appendChild(content);

  pageObj = new THREE.CSS3DObject( page );

  pages.push( pageObj );

  // recalculate page positions
  calculatePagePositions();

  scene.add( pageObj );

  pageObj.lookAt( camera.position );
}

function makeCloseButton () {
  var button = document.createElement( 'button' );

  button.innerText = "X";

  return button;
}

function calculatePagePositions () {
  var angle = findAngle( pages.length + 1 );
  var lastAngle = angle;
  var pos;

  for (var i = 0; i < pages.length; i++) {
    pos = findNextPagePosition(lastAngle);

    lastAngle += angle;

    pages[i].position.set(pos.x, pos.y, pos.z);
    pages[i].lookAt( camera.position );
  }
}

function findNextPagePosition (angle) {
  return {
    x: camera.position.x + (INPUT_DISTANCE * Math.cos(angle)),
    y: 0,
    z: camera.position.z + (INPUT_DISTANCE * Math.sin(angle))
  };
}

function findPointerElem () {
  var p = pointer.elementL.getBoundingClientRect(),
    elem = document.elementFromPoint(p.left, p.top);

  return elem ? elem : false;
}

var linkTitles = [];

function trackUIEvents () {
  var elem = findPointerElem();

  // element changed
  if (elem !== currentElem) {
    currentElem = elem;
    elemStartHoverTime = new Date();
  }

  // element is link
  if (elem.nodeName === "A") {
    link_title = elem.title;

    // if element hovered over for half second
    // TODO: need to provide feedback
    if (new Date() - elemStartHoverTime > 500) {

      // if link not currently opened
      if ( linkTitles.indexOf( link_title ) < 0 ) {
        requestPage( link_title );
        linkTitles.push( link_title );
      }
    }

  } else if (elem.nodeName === "BUTTON") {
    var index = elem.parentElement.getAttribute("data-index");

    if (new Date() - elemStartHoverTime > 500) {
      scene.remove( pages[ index ] );
      // TODO: need to remove from 1000 list as well
    }

  } else {
    link_title = "";
  }
}

function findFocusedCell () {
  var p = pointer.elementL.getBoundingClientRect(),
    elem = document.elementFromPoint(p.left, p.top),
    prevIndex,
    cell, oldObj, currentObj;

  // console.log( elem );
  // if element is cell
  if (elem && elem.className.indexOf("cell") >= 0) {

    // check for last hovered cell
    if (currentIndex) {
      prevIndex = currentIndex;
      oldObj = cells[ prevIndex ];

    } else {
      prevIndex = false;
    }

    currentIndex = elem.getAttribute("data-index");
    currentObj = cells[ currentIndex ];

    // if element has changed
    if (prevIndex && prevIndex !== currentIndex) {

      // remove focus from previously focused elements
      oldObj.elementL.className =
          oldObj.elementL.className.replace("focused", "");

      oldObj.elementR.className =
          oldObj.elementR.className.replace("focused", "");

      // console.log(currentObj);
      // add focus to new elements
      currentObj.elementL.focus();
      currentObj.elementL.className += " focused";
      currentObj.elementR.className += " focused";
    }

    // sync left and right elements values
    currentObj.elementR.value = currentObj.elementL.value;

  } else {

    if (currentIndex) {
      prevIndex = currentIndex;
      oldObj = cells[ prevIndex ];

      oldObj.elementL.className =
          oldObj.elementL.className.replace("focused", "");

      oldObj.elementR.className =
          oldObj.elementR.className.replace("focused", "");
    }
    currentIndex = false;
  }
}

function findAngle ( numItems ) {
  numItems = numItems > 8 ? numItems : 8;

  return (2 * Math.PI) / numItems;
}

function initGyro () {
  gyro.frequency = 100;

  gyro.startTracking(function(o) {
    if (o.gamma) {

      if (o.gamma > 0 && o.gamma < 60) {
        move.up = true;
        move.down = false;

      } else if (o.gamma < 0 && o.gamma > -60) {
        move.up = false;
        move.down = true;

      } else {
        move.up = false;
        move.down = false;
      }
    }
  });
}

function animate () {
  requestAnimationFrame( animate );

  trackUIEvents();

  controls.update();

  renderer.render( scene, camera );

  if (typeof vObj !== "undefined") {
    if (vObj.elementL.paused) {
      vObj.elementL.play();
    }

    if (vObj.elementR.paused) {
      vObj.elementR.play();
    }
  }

  var speed = 3;
  var elem;
  var pElem,
    page,
    index;

  elem = findPointerElem();
  pElem = elem.parentElement;

  // find page element
  while (pElem) {

    if (pElem.className.indexOf("page") >= 0) {
      index = pElem.getAttribute("data-index");
      page = pages[index];
      break;
    }

    pElem = pElem.parentElement;
  }

  if (page) {
    if (move.up) {
      // console.log("scroll down");
      page.position.y -= speed;

    } else if (move.down) {
      // console.log("scroll up");
      page.position.y += speed;
    }
  }

}

init();
