var INPUT_DISTANCE = 600;
var POINTER_Z = -200;
var WIKI_ROOT = "http://en.wikipedia.org/w/api.php";
var PAGE_CLASS = "page-container";
var PAGE_WIDTH = 320;

var HOVER_CLICK_SPEED = 400;

var scene, camera, renderer, controls, pointer, vObj;

var cells = [];
var pages = [];
var linkTitles = [];

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
      searchForm.style.display = "none";
      init(inpSearch.value);

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
  renderer.setSize( viewportWidth, viewportHeight );
  renderer.domElement.style.position = 'absolute';
  document.body.appendChild( renderer.domElement );

  // add lighting
  scene.add( new THREE.AmbientLight( 0x666666 ) );
  light = new THREE.PointLight( 0xaaddaa, .5 );
  light.position.set( 50, 1200, -500 );
  scene.add( light );

  // add camera
  camera = new THREE.PerspectiveCamera( 40, viewportWidth /
      viewportHeight, 1, 1000 );

  scene.add( camera );

  // add view controls
  controls = new THREE.DeviceOrientationControls( camera );

  // add pointer / pointer for camera
  var pointerRadius = viewportWidth * 0.01 + 'px';

  var domElem = document.createElement( 'div' );
  domElem.className = 'pointer';
  domElem.style.width = pointerRadius;
  domElem.style.height = pointerRadius;

  pointer = new THREE.CSS3DObject( domElem );
  pointer.position.set( 0, 0, POINTER_Z );

  camera.add( pointer );

  requestPage( searchTerm );

  animate();

  initGyro();

  addVideoFeed();
}

function requestPage ( title ) {
  $.ajax({
      type: "GET",
      url: WIKI_ROOT +
          "?action=parse&format=json&prop=text&section=0&page=" + title +
          "&callback=?",
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

  page.className = PAGE_CLASS;
  page.setAttribute("data-index", pages.length);

  // make header
  var header = document.createElement( 'header' );
  header.className = "page-header";

  var title = document.createElement( 'span' );
  title.innerText = "title";
  title.className ="page-title";

  header.appendChild( makeCloseButton() );
  header.appendChild( title );

  page.appendChild( header );

  content.innerHTML = data.parse.text["*"];
  content.className = "page-content";
  page.appendChild(content);

  var footer = document.createElement( 'footer' );
  footer.innerText = "footer!";

  page.appendChild(footer);

  pageObj = new THREE.CSS3DObject( page );

  pages.push( pageObj );

  // recalculate page positions
  calculatePagePositions();

  scene.add( pageObj );

  pageObj.lookAt( camera.position );
}

function makeCloseButton () {
  var button = document.createElement( 'button' );

  button.className = "btnClose";

  button.innerText = "X";

  return button;
}

// need to rewrite to handle page removal
function calculatePagePositions () {
  var angle = findAngle( pages.length ),
    distance = ( PAGE_WIDTH / 2 ) / ( Math.tan( angle / 2 ) ),
    pageScrollY,
    lastAngle = 90,
    pos;

  console.log(distance);

  for (var i = pages.length - 1; i >= 0 ; i--) {
    pos = findNextPagePosition( lastAngle, distance );
    lastAngle -= angle;

    pageScrollY = pages[i].position.y

    pages[i].position.set( pos.x, pos.y, pos.z );
    pages[i].lookAt( camera.position );

    // reset y scroll - if done before lookAt(camera.position), page will be tilted
    pages[i].position.y = pageScrollY;
  }
}

function findNextPagePosition (angle, distance) {
  return {
    x: camera.position.x + (distance * Math.cos(angle)),
    y: 0,
    z: camera.position.z + (distance * Math.sin(angle))
  };
}

function findAngle ( numItems ) {
  numItems = numItems > 8 ? numItems : 8;

  // return (2 * Math.PI) / numItems;
  return (2 * Math.PI) / numItems;
}

function findPointerElem () {
  var p = pointer.elementL.getBoundingClientRect(),
    elem = document.elementFromPoint(p.left, p.top);

  return elem ? elem : false;
}

function trackUIEvents () {
  var elem = findPointerElem(),
    page,
    hoverTime,
    index;

  // element changed
  if (elem !== currentElem) {
    currentElem = elem;

    elemStartHoverTime = new Date();

    // reset pointer to original distance / size
    pointer.position.z = POINTER_Z;

    // make sure pointer not active
    pointer.elementL.className.replace("active-green", "");
    pointer.elementR.className.replace("active-green", "");
  }

  hoverTime = new Date() - elemStartHoverTime

  // element is link
  if ( elem.nodeName === "A" ) {
    link_title = elem.title;

    // if element hovered over for half second
    if ( hoverTime > HOVER_CLICK_SPEED ) {

      // turn pointer green
      if (pointer.elementL.className.indexOf("active-green") === -1) {
        pointer.elementL.className += " active-green";
        pointer.elementR.className += " active-green";
      }

      // if link not currently opened
      if ( linkTitles.indexOf( link_title ) < 0 ) {
        requestPage( link_title );
        linkTitles.push( link_title );
      }

    // change size of pointer to reflect time hovered over element
    } else if ( hoverTime > 75 ) {
      pointer.position.z = POINTER_Z - hoverTime / 2;
    }

  } else if ( elem.nodeName === "BUTTON" ) {
    page = findElementPage( elem );

    if ( page ) {

      if ( new Date() - elemStartHoverTime > 500 ) {

        index = page.elementL.getAttribute( "data-index" );

        // remove from scene
        scene.remove( pages[ index ] );

        // remove from page list
        pages.splice( index, 1 );

        // recalculate page index
        for ( var i = 0; i < pages.length; i++ ) {
          pages[i].elementL.setAttribute( "data-index", i );
          pages[i].elementR.setAttribute( "data-index", i );
        }
      }

    } else {
      console.log( elem );
    }

  } else {
    link_title = "";
  }
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

function findElementPage ( elem ) {
  var page = false,
    parent = elem.parentElement,
    index;

  while ( parent ) {

    if ( parent.className.indexOf( PAGE_CLASS ) >= 0 ) {
      index = parent.getAttribute( "data-index" );
      page = pages[ index ];
      break;
    }

    parent = parent.parentElement;
  }

  return page;
}

function trackPageMovement () {
  var speed = 3,
    page;

  // find page element
  page = findElementPage( findPointerElem() );

  if ( page ) {

    // scroll down
    if ( move.up ) {
      page.position.y -= speed;

    // scroll up
    } else if ( move.down ) {
      page.position.y += speed;
    }
  }
}

function addVideoFeed () {
  var videoSource = null
    errBack = function(error) {
      console.log("Video capture error: ", error);
    };

  var getUserMedia = null;

  if (navigator.getUserMedia) {
    getUserMedia = function(a, b, c) {
      navigator.getUserMedia(a, b, c);
    }

  } else if (navigator.webkitGetUserMedia) {
    getUserMedia = function(a, b, c) {
      navigator.webkitGetUserMedia(a, b, c);
    }
  }

  if (typeof MediaStreamTrack !== "undefined") {
    MediaStreamTrack.getSources(function(sourceInfos) {
      var sourceInfo, media;

      // find last video source - might need to add check, last video might not
      // always be what we want?
      for (var i = 0; i < sourceInfos.length; i++) {
        sourceInfo = sourceInfos[i];

        if (sourceInfo.kind === 'video') {
          videoSource = sourceInfo.id;

        } else {
          console.log('Some other kind of source: ', sourceInfo);
        }
      }

      // use sourceId to select either front or back camera
      media = { video: { optional: [{ sourceId: videoSource }] } };

      getUserMedia(media, function(stream) {
        var url = window.URL.createObjectURL(stream);

        var video = document.createElement( 'video' );

        vObj = new THREE.CSS3DObject( video );

        vObj.elementL.src = url;
        vObj.elementR.src = url;

        // double size of video so it can be farther away
        vObj.scale.set(2,2,2);

        vObj.position.set(0, 0, -2 * INPUT_DISTANCE);

        camera.add(vObj);

      }, errBack);
    });
  }
}

function animate () {
  requestAnimationFrame( animate );

  trackUIEvents();

  controls.update();

  renderer.render( scene, camera );

  // if video objects, make sure videos are playing
  if (typeof vObj !== "undefined") {
    if (vObj.elementL.paused) {
      vObj.elementL.play();
    }

    if (vObj.elementR.paused) {
      vObj.elementR.play();
    }
  }

  trackPageMovement();
}

window.addEventListener("keydown", function (event) {

  // return / enter - hide keyboard
  if (event.keyCode === 13) {
    event.srcElement.blur();
    document.getElementById("searchButton").click();
  }
}, true);

prep();
