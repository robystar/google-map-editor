// The Google Map.
var map;

// The HTML element that contains the drop container.
var dropContainer;
var panel;
var geoJsonInput;
var downloadLink;
var selectedShape;
var colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
var selectedColor;
var colorButtons = {};
var newShape;


function init() {
  // Initialise the map.
  map = new google.maps.Map(document.getElementById('map-holder'), {
    center: {lat: 0, lng: 0},
    zoom: 3
  });
  map.data.setControls(['Point', 'LineString', 'Polygon', 'Polygon']);
  map.data.setStyle({
    editable: false,
    draggable: false
  });

  var deleteMenu = new DeleteMenu();
  bindDataLayerListeners(map.data);

  // Retrieve HTML elements.
  dropContainer = document.getElementById('drop-container');
  panel = document.getElementById('panel');
  var mapContainer = document.getElementById('map-holder');
  geoJsonInput = document.getElementById('geojson-input');
  downloadLink = document.getElementById('download-link');

  // Resize the geoJsonInput textarea.
  resizeGeoJsonInput();

  // Set up the drag and drop events.
  // First on common events.
  [mapContainer, dropContainer].forEach(function(container) {
    google.maps.event.addDomListener(container, 'drop', handleDrop);
    google.maps.event.addDomListener(container, 'dragover', showPanel);
  });

  // Then map-specific events.
  google.maps.event.addDomListener(mapContainer, 'dragstart', showPanel);
  google.maps.event.addDomListener(mapContainer, 'dragenter', showPanel);

  // Then the overlay specific events (since it only appears once drag starts).
  google.maps.event.addDomListener(dropContainer, 'dragend', hidePanel);
  google.maps.event.addDomListener(dropContainer, 'dragleave', hidePanel);
  // Set up events for changing the geoJson input.
  google.maps.event.addDomListener(
      geoJsonInput,
      'input',
      refreshDataFromGeoJson);
  google.maps.event.addDomListener(
      geoJsonInput,
      'input',
      refreshDownloadLinkFromGeoJson);

  // Set up events for styling.
  google.maps.event.addDomListener(window, 'resize', resizeGeoJsonInput);





  // Create the DIV to hold the control and call the HomeControl() constructor
  var homeControlDiv = document.createElement('div');
  var homeControl = new HomeControl(homeControlDiv, map);

  homeControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(homeControlDiv);
  
  var homeControlDiv2 = document.createElement('div');
  homeControlDiv2.index = 1;
  var homeControl2 = new HomeControl(homeControlDiv2, map);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(homeControlDiv2);


  //To set CSS and handling event for the control
  function HomeControl(controlDiv, map) {
      // Set CSS for the control border.
      var controlUI = document.createElement('div');
      controlUI.style.backgroundColor = 'blue';       
      controlUI.style.height = '23px';
      controlUI.style.marginTop = '5px';
      controlUI.style.marginLeft = '-9px';
      controlUI.style.paddingTop = '1px';
      controlUI.style.cursor = 'pointer';        
      controlUI.title = 'Your Custom function..';
      controlDiv.appendChild(controlUI);

      // Set CSS for the control interior.
      var controlText = document.createElement('div');
      controlText.style.padding = '11px';
      controlText.innerHTML = 'Custom Text';
      controlText.style.color = '#fff';    
      controlUI.appendChild(controlText);

      // Setup the click event listeners
      google.maps.event.addDomListener(controlUI, 'click', function () {
          alert('Your Custom function..');            
      });
  }


  //To set CSS and handling event for the control
  function HomeControl(controlDiv, map) {
      // Set CSS for the control border.
      var controlUI = document.createElement('div');
      controlUI.style.backgroundColor = 'blue';       
      controlUI.style.height = '23px';
      controlUI.style.marginTop = '5px';
      controlUI.style.marginLeft = '-9px';
      controlUI.style.paddingTop = '1px';
      controlUI.style.cursor = 'pointer';        
      controlUI.title = 'Your Custom function..';
      controlDiv.appendChild(controlUI);

      // Set CSS for the control interior.
      var controlText = document.createElement('div');
      controlText.style.padding = '11px';
      controlText.innerHTML = 'Custom Text';
      controlText.style.color = '#fff';    
      controlUI.appendChild(controlText);

      // Setup the click event listeners
      google.maps.event.addDomListener(controlUI, 'click', function () {
          alert('Your Custom function..');            
      });
  }


  return;
  google.maps.event.addListener(newShape, 'click', function (e) {
      if (e.vertex !== undefined) {
          if (newShape.type === google.maps.drawing.OverlayType.POLYGON) {
              var path = newShape.getPaths().getAt(e.path);
              path.removeAt(e.vertex);
              if (path.length < 3) {
                  newShape.setMap(null);
              }
          }
          if (newShape.type === google.maps.drawing.OverlayType.POLYLINE) {
              var path = newShape.getPath();
              path.removeAt(e.vertex);
              if (path.length < 2) {
                  newShape.setMap(null);
              }
          }
      }
      setSelection(newShape);
  });
  //setSelection(newShape);




}

google.maps.event.addDomListener(window, 'load', init);


function selectFeatures(ev){

  console.log(this)

  //this.setEditable(true);
  console.log(ev.feature.getGeometry())

  //array to hold all LatLng in the new polygon, except the clicked one
  var newPolyPoints = [];
  map.data.setStyle({draggable: true, editable: true});


  //iterating over LatLng in features geometry
  ev.feature.getGeometry().forEachLatLng(function(latlng) {

      //excluding the clicked one
      if (latlng.lat() == ev.latLng.lat() && latlng.lng() == ev.latLng.lng()) {
          console.log('This one will be removed: lat: ' + latlng.lat() + ', lng: ' + latlng.lng());
      } else {
          //keeping not matching LatLng
          newPolyPoints.push(latlng);
      }
  });

  //creating new linear ring
  var newLinearRing = new google.maps.Data.LinearRing(newPolyPoints);

  //creating a new polygon out of the new linear ring
  var newPoly = new google.maps.Data.Polygon([newLinearRing]);

  //apply the new polygon to the clicked feature
  ev.feature.setGeometry(newPoly);


}


// Refresh different components from other components.
function refreshGeoJsonFromData() {
  map.data.toGeoJson(function(geoJson) {

    //geoJson.features[0].geometry.type="MultiPolygon";
    if(geoJson.features.length==1){
      geoJson.features[0].geometry.coordinates=geoJson.features[0].geometry.coordinates;
    }
    if(geoJson.features.length>1){
      geoJson.features[0].geometry.coordinates.push(geoJson.features[1].geometry.coordinates[0])
      geoJson.features=[geoJson.features[0]];
    }
    console.log(geoJson);
    geoJsonInput.value = JSON.stringify(geoJson, null, 2);


    //aggiungo anche il tipo:
    console.log(map.data.getDrawingMode())

    refreshDataFromGeoJson();


    refreshDownloadLinkFromGeoJson();
  });
  console.log(map.data)
  //map.data.remove(geoJson.features[1])

}


// Replace the data layer with a new one based on the inputted geoJson.
function refreshDataFromGeoJson() {
  var newData = new google.maps.Data({
    map: map,
    style: map.data.getStyle(),
    controls: ['Point', 'LineString', 'Polygon']
  });
  try {
    var userObject = JSON.parse(geoJsonInput.value);
    var newFeatures = newData.addGeoJson(userObject);
  } catch (error) {
    newData.setMap(null);
    if (geoJsonInput.value !== "") {
      setGeoJsonValidity(false);
    } else {
      setGeoJsonValidity(true);
    }
    return;
  }
  // No error means GeoJSON was valid!
  map.data.setMap(null);
  map.data = newData;
  bindDataLayerListeners(newData);
  setGeoJsonValidity(true);
}

// Refresh download link.
function refreshDownloadLinkFromGeoJson() {
  downloadLink.href = "data:;base64," + btoa(geoJsonInput.value);
}

// Apply listeners to refresh the GeoJson display on a given data layer.
function bindDataLayerListeners(dataLayer) {
  dataLayer.addListener('click', selectFeatures);
  dataLayer.addListener('addfeature', refreshGeoJsonFromData);
  dataLayer.addListener('removefeature', refreshGeoJsonFromData);
  dataLayer.addListener('setgeometry', refreshGeoJsonFromData);
}

// Display the validity of geoJson.
function setGeoJsonValidity(newVal) {
  if (!newVal) {
    geoJsonInput.className = 'invalid';
  } else {
    geoJsonInput.className = '';
  }
}

// Control the drag and drop panel. Adapted from this code sample:
// https://developers.google.com/maps/documentation/javascript/examples/layer-data-dragndrop
function showPanel(e) {
  e.stopPropagation();
  e.preventDefault();
  dropContainer.className = 'visible';
  return false;
}

function hidePanel() {
  dropContainer.className = '';
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  hidePanel();

  var files = e.dataTransfer.files;
  if (files.length) {
    // process file(s) being dropped
    // grab the file data from each file
    for (var i = 0, file; file = files[i]; i++) {
      var reader = new FileReader();
      reader.onload = function(e) {
        map.data.addGeoJson(JSON.parse(e.target.result));
      };
      reader.onerror = function(e) {
        console.error('reading failed');
      };
      reader.readAsText(file);
    }
  } else {
    // process non-file (e.g. text or html) content being dropped
    // grab the plain text version of the data
    var plainText = e.dataTransfer.getData('text/plain');
    if (plainText) {
      map.data.addGeoJson(JSON.parse(plainText));
    }
  };
  // prevent drag event from bubbling further
  return false;
}

// Styling related functions.
function resizeGeoJsonInput() {
  var geoJsonInputRect = geoJsonInput.getBoundingClientRect();
  var panelRect = panel.getBoundingClientRect();
  geoJsonInput.style.height = panelRect.bottom - geoJsonInputRect.top - 8 + "px";
}



function clearSelection () {
    if (selectedShape) {
        if (selectedShape.type !== 'marker') {
            selectedShape.setEditable(false);
        }
        
        selectedShape = null;
    }
}

function setSelection (shape) {
    if (shape.type !== 'marker') {
        clearSelection();
        shape.setEditable(true);
        selectColor(shape.get('fillColor') || shape.get('strokeColor'));
    }
    
    selectedShape = shape;
}

function deleteSelectedShape () {
    if (selectedShape) {
        selectedShape.setMap(null);
    }
}

function selectColor (color) {
    selectedColor = color;
    for (var i = 0; i < colors.length; ++i) {
        var currColor = colors[i];
        colorButtons[currColor].style.border = currColor == color ? '2px solid #789' : '2px solid #fff';
    }

    // Retrieves the current options from the drawing manager and replaces the
    // stroke or fill color as appropriate.
    var polylineOptions = drawingManager.get('polylineOptions');
    polylineOptions.strokeColor = color;
    drawingManager.set('polylineOptions', polylineOptions);

    var rectangleOptions = drawingManager.get('rectangleOptions');
    rectangleOptions.fillColor = color;
    drawingManager.set('rectangleOptions', rectangleOptions);

    var circleOptions = drawingManager.get('circleOptions');
    circleOptions.fillColor = color;
    drawingManager.set('circleOptions', circleOptions);

    var polygonOptions = drawingManager.get('polygonOptions');
    polygonOptions.fillColor = color;
    drawingManager.set('polygonOptions', polygonOptions);
}

function setSelectedShapeColor (color) {
    if (selectedShape) {
        if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
            selectedShape.set('strokeColor', color);
        } else {
            selectedShape.set('fillColor', color);
        }
    }
}

function makeColorButton (color) {
    var button = document.createElement('span');
    button.className = 'color-button';
    button.style.backgroundColor = color;
    google.maps.event.addDomListener(button, 'click', function () {
        selectColor(color);
        setSelectedShapeColor(color);
    });

    return button;
}

function buildColorPalette () {
    var colorPalette = document.getElementById('color-palette');
    for (var i = 0; i < colors.length; ++i) {
        var currColor = colors[i];
        var colorButton = makeColorButton(currColor);
        colorPalette.appendChild(colorButton);
        colorButtons[currColor] = colorButton;
    }
    selectColor(colors[0]);
}

/**
 * A menu that lets a user delete a selected vertex of a path.
 * @constructor
 */
function DeleteMenu() {
  this.div_ = document.createElement('div');
  this.div_.className = 'delete-menu';
  this.div_.innerHTML = 'Delete';

  var menu = this;
  google.maps.event.addDomListener(this.div_, 'click', function() {
    menu.removeVertex();
  });
}
DeleteMenu.prototype = new google.maps.OverlayView();

DeleteMenu.prototype.onAdd = function() {
  var deleteMenu = this;
  var map = this.getMap();
  this.getPanes().floatPane.appendChild(this.div_);

  // mousedown anywhere on the map except on the menu div will close the
  // menu.
  this.divListener_ = google.maps.event.addDomListener(map.getDiv(), 'mousedown', function(e) {
    if (e.target != deleteMenu.div_) {
      deleteMenu.close();
    }
  }, true);
};

DeleteMenu.prototype.onRemove = function() {
  google.maps.event.removeListener(this.divListener_);
  this.div_.parentNode.removeChild(this.div_);

  // clean up
  this.set('position');
  this.set('path');
  this.set('vertex');
};

DeleteMenu.prototype.close = function() {
  this.setMap(null);
};

DeleteMenu.prototype.draw = function() {
  var position = this.get('position');
  var projection = this.getProjection();

  if (!position || !projection) {
    return;
  }

  var point = projection.fromLatLngToDivPixel(position);
  this.div_.style.top = point.y + 'px';
  this.div_.style.left = point.x + 'px';
};

/**
 * Opens the menu at a vertex of a given path.
 */
DeleteMenu.prototype.open = function(map, path, vertex) {
  //this.set('position', path.getAt(vertex));
  //this.set('path', path);
  //this.set('vertex', vertex);
  this.setMap(map);
  this.draw();
};

/**
 * Deletes the vertex from the path.
 */
DeleteMenu.prototype.removeVertex = function() {
  var path = this.get('path');
  var vertex = this.get('vertex');

  if (!path || vertex == undefined) {
    this.close();
    return;
  }

  path.removeAt(vertex);
  this.close();
};
