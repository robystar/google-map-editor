var drawingManager;
var selectedShape;
var colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
var selectedColor;
var colorButtons = {};
var polygons = [];


function clearList(list) {
    for (var i=0;i<list.length;i++) {
        if (!list[i].map) {
            list.splice(i, 1);
            break;
        }
    }
    
    console.log(list)
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
    shape.setDraggable(true);
    selectedShape = shape;
}

function deleteSelectedShape () {
    if (selectedShape) {
        selectedShape.setMap(null);
        clearList(polygons);
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

function ColorPalette (controlDiv, map) {
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';       
  controlUI.style.height = '23px';
  controlUI.style.marginTop = '5px';
  controlUI.style.marginLeft = '-9px';
  controlUI.style.paddingTop = '1px';
  controlUI.style.cursor = 'pointer';        
  controlUI.title = 'Your Custom function..';
  controlDiv.appendChild(controlUI);

  var colorPalette = document.createElement('div');
  for (var i = 0; i < colors.length; ++i) {
      var currColor = colors[i];
      var colorButton = makeColorButton(currColor);
      colorPalette.appendChild(colorButton);
      colorButtons[currColor] = colorButton;
    }
  controlUI.appendChild(colorPalette);
  selectColor(colors[0]);
}


//To set CSS and handling event for the control
function DeleteControl(controlDiv, map) {
  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = 'blue';       
  controlUI.style.height = '23px';
  controlUI.style.marginTop = '5px';
  controlUI.style.marginLeft = '0px';
  controlUI.style.paddingTop = '1px';
  controlUI.style.cursor = 'pointer';        
  controlUI.title = 'Your Custom function..';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.padding = '11px';
  controlText.innerHTML = 'Elimina selezionato';
  controlText.style.color = '#fff';    
  controlUI.appendChild(controlText);

  // Setup the click event listeners
  google.maps.event.addDomListener(controlUI, 'click', deleteSelectedShape);
}

function makeHole(polygon, hole){

    var outerCoords = [];
    var innerCoords = [];
    var paths = [];

    polygon.getPath().forEach(function(coords,index){
        outerCoords.push(coords.toJSON())
    });
    paths.push(outerCoords);

    //Altri buchi presenti?
    if (polygon.getPaths().getLength()>1){
        polygon.getPaths().forEach(function(path,index){
            if (index>0){
                var holesCoords = [];
                path.forEach(function(coords,i){
                    holesCoords.push(coords.toJSON())
                });
                paths.push(holesCoords);
            }
        });  
    }

    hole.getPath().forEach(function(coords,index){
        innerCoords.push(coords.toJSON())
    });
    paths.push(innerCoords.reverse());

    newPolygon = new google.maps.Polygon({
      paths: paths,//[outerCoords, innerCoords.reverse()],
      strokeColor: '#FFC107',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FFC107',
      fillOpacity: 0.35
    });

    return newPolygon

}

function initialize () {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: new google.maps.LatLng(45.438, 12.33),
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true,
        zoomControl: true
    });

    var polyOptions = {
        strokeWeight: 0,
        fillOpacity: 0.4,
        editable: true,
        draggable: true
    };
    // Creates a drawing manager attached to the map that allows the user to draw
    // markers, lines, and shapes.
    drawingManager = new google.maps.drawing.DrawingManager({
        drawingControlOptions:{drawingModes:['marker','polygon']},
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        markerOptions: {
            draggable: true
        },
        polygonOptions: polyOptions,
        map: map
    });
    google.maps.event.addListener(drawingManager, 'markercomplete', function (marker) {
        console.log(marker.getPosition().toString())
        google.maps.event.addListener(marker, 'click', function (e) {
            setSelection(marker);
        });
    });

    google.maps.event.addListener(drawingManager, 'polygoncomplete', function (polygon) {

        //se esiste un poligono che contiene quello appena inserito allora questo fa da buco
        var newPolygon;
        for (var i=0;i<polygons.length;i++){
            if (google.maps.geometry.poly.containsLocation(polygon.getPath().getAt(0),polygons[i])){
                newPolygon = makeHole(polygons[i], polygon);
                newPolygon.setMap(map);
                polygons[i].setMap(null);
                polygon.setMap(null);
                polygons[i]=newPolygon;
                break;
            }
        }
        if (!newPolygon){
            polygons.push(polygon);
            newPolygon = polygon;
        }
        setSelection(newPolygon);
        // Switch back to non-drawing mode after drawing a shape.
        //drawingManager.setDrawingMode(null);

        // Add an event listener that selects the newly-drawn shape when the user
        // mouses down on it.
        google.maps.event.addListener(newPolygon, 'click', function (e) {
            if (e.vertex !== undefined) {
                var path = newPolygon.getPaths().getAt(e.path);

                //Se sono buchi rimuovo solo il buco
                path.removeAt(e.vertex);
                if (path.length < 3) {
                    if(newPolygon.getPaths().getLength()>1){
                        newPolygon.getPaths().removeAt(e.path);
                    }
                    else{
                        newPolygon.setMap(null);
                        clearList(polygons);
                    }
                }
            }
            setSelection(newPolygon);
        });

        google.maps.event.addListener(newPolygon.getPath(), 'set_at', function(index) {
            console.log('ddd')
        });


 
    });

    // Clear the current selection when the drawing mode is changed, or when the
    // map is clicked.
    google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
    google.maps.event.addListener(map, 'click', clearSelection);
 

    var colorControlDiv = document.createElement('div');
    var colorControl = new ColorPalette(colorControlDiv, map);
    colorControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(colorControlDiv);

    // Create the DIV to hold the control and call the DeleteControl() constructor
    var deleteControlDiv = document.createElement('div');
    var deleteControl = new DeleteControl(deleteControlDiv, map);
    deleteControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(deleteControlDiv);







}
google.maps.event.addDomListener(window, 'load', initialize);