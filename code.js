"use strict";



function myonload()
{
	var buttonBig = document.getElementById("Big");
	var buttonSmall = document.getElementById("Small");
	var buttonDisenable = document.getElementById("Disenable");
	var buttonSerialize = document.getElementById("Serialize");

	var createRect = function(type)
	{
		var stagePos = stage.getPosition();
		var position = {x: stage.getWidth()/2 - stagePos.x, y: stage.getHeight()/2 - stagePos.y};
		addRect(position, type);
		layer.draw();
	}

	buttonBig.onclick = function() {createRect(1);};
	buttonSmall.onclick = function() {createRect(2);};
	buttonDisenable.onclick = function() 
	{
		if(selectedObject)
		{
			selectedObject.magneticEnabled = !selectedObject.magneticEnabled;
			//selectedObject.setFill("red");
			selectedObject.magneticEnabled && (selectedObject.setFill('white'));
			!selectedObject.magneticEnabled && (selectedObject.setFill('ccccdd'));
			layer.drawScene();
			dragLayer.drawScene();
		}
	}
	buttonSerialize.onclick = function()
	{
		 var json = layer.toJSON();
		 var jsonWindow = window.open('','JSON source','height=400,width=500');
		 jsonWindow.document.write(json);
		 jsonWindow.document.close();
	}
}

if(window.addEventListener) {
  window.addEventListener("load", myonload, false);
} else if(window.attachEvent) {
	window.attachEvent("onload", myonload);
} else {
	document.addEventListener("load", myonload, false);
}

// global variables declarations
var objects = [];
var selectedObject;
var mouseDown = false, moveNext = true;
var prevX, prevY;
var stage = new Kinetic.Stage({
  container: 'container',
  width: 800,
  height: 600,
  draggable: true
});
var layer = new Kinetic.Layer();
var dragLayer = new Kinetic.Layer();
var lineLayer = new Kinetic.Layer();

stage.add(layer);
stage.add(lineLayer);
stage.add(dragLayer);

stage.on('mousedown', function(evt) {
  console.log('mousedown');
  if(selectedObject != null) selectedObject.setStroke('black'); // this is needed because it sets the color of the prew draggable to black
  //if(!evt.targetNode.magneticEnabled) return;
  selectedObject = evt.targetNode;
  selectedObject.setStroke('red');
  evt.cancelBubble = true;
  mouseDown = true;
  selectedObject.moveTo(dragLayer);
  layer.draw();
  selectedObject.startDrag();
});

stage.on('mouseup', function(evt) {
  console.log('mouseup');
  drawLines(evt.targetNode);
  evt.targetNode.moveTo(layer);
  layer.draw();
  hideAllLines();
  lineLayer.drawScene();
  selectedObject.stopDrag();
  mouseDown = false;
  console.log("lineLayer count: " + lineLayer.getChildren().toArray().length);
  console.log("layer count: " + layer.getChildren().toArray().length);
  console.log("dragLayer count: " + dragLayer.getChildren().toArray().length);
});

//whenDragged is called every 1/8 of a second
setInterval(function(){whenDragged()},125);

function whenDragged() {
  if(selectedObject != null && mouseDown)
  {
    var width = selectedObject.getAttr('width');
    var xObj = selectedObject.getAttr('x') + width/2;
    var yObj = selectedObject.getAttr('y') + width/2;
   	
   	//this chunk of code determines if we want to execute the rest of this costly function.
   	//it is supposed to be executed only when drag ended. official 'dragend' event won't work in this case.
    if(!(prevX == xObj && prevY == yObj)) 
    {
    	prevX = xObj;
    	prevY = yObj;
    	moveNext = true;
    	return;
    } else if(moveNext)
    {
    	moveNext = false;
    } else return;
    //chunk end

    var changed = false;
    for(var i=0, l=objects.length; i<l; i++)
    {
      var entry = objects[i];
      if(entry != selectedObject && entry.magneticEnabled)
      {
        var x = entry.getAttr('x');
        var y = entry.getAttr('y');
        var width2 = entry.getAttr('width');

        var ylt = y;
        var ylb = y + width2;
        var xll = x;
        var xlr = x + width2; 

        var temp1 = false, temp2 = false, temp3 = false, temp4 = false;
        temp1 = magneticSnap(entry.xLineTop, width, ylt, yObj, x+width/2, xObj, 1);
        temp2 = magneticSnap(entry.xLineBottom, width, ylb, yObj, x+width/2, xObj, 2);
        temp3 = magneticSnap(entry.yLineLeft, width, xll, xObj, y+width/2, yObj, 3);
        temp4 = magneticSnap(entry.yLineRight, width, xlr, xObj, y+width/2, yObj, 4);
        if(temp1 || temp2 || temp3 || temp4) 
        {
          changed = true;
        }
      }
    }
    if(changed) 
    {
    	lineLayer.drawScene();
    }
    moveNext = false; // not sure if we need this
  }
}

function magneticSnap(line, width, linePos, dragPos, a11, a21, type)
{
  var changed = false, fromDir = false;
  var dist = linePos - dragPos;
  var absDist = Math.abs(dist); //distance from the line to the center of the draggable object.
  if(absDist < (width-width/3) && Math.abs(a11 - a21) < 80)
  {
    if(!line.near) 
    {
      line.show();
      line.near = true;
      changed = true;
    }

    if(dist > 0) fromDir = true; // coming from the top if horizontal line, from left side if vertical
    if(absDist < width/4) // if the distance is shorter than a certain value then we ignore the line. 
    {
    	type = 0; // neither of the cases below will be taken
    }

    switch(type)
    {
    	case 1: 
    	case 2:
    		if(fromDir) animatedMove(selectedObject, 0, linePos - width); 
    		else animatedMove(selectedObject, 0, linePos); 
    		break;
    	case 3: 
    	case 4:
    		if(fromDir) animatedMove(selectedObject, linePos - width, 0); 
    		else animatedMove(selectedObject, linePos, 0);  
    		break;
    }

  } else
  { 
     if(line.near) 
     {
        line.hide(); 
        line.near = false;
        changed = true;
     }
  }
  return changed;
}

function animatedMove(obj, xPos, yPos)
{
	 if(xPos == 0)
	 {
		 var tween = new Kinetic.Tween({
		    node: obj, 
		    duration: 0.1,
		    y: yPos,
		 });
		 tween.play();
	 } else if(yPos == 0)
	 {
		 var tween = new Kinetic.Tween({
		    node: obj, 
		    duration: 0.1,
		    x: xPos,
		 });
		 tween.play();
	 }
}

stage.getContainer().addEventListener('mousedown', function(evt) {
  if(selectedObject != null) selectedObject.setStroke('black');
  selectedObject = null;
});

window.addEventListener('keydown', function(e) {
  console.log(e.keyCode);
  if((e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40) && selectedObject != null)
  { 
    if (e.keyCode == 37) //Left Arrow Key
        selectedObject.move(-1, 0);
    if (e.keyCode == 38) //Up Arrow Key
        selectedObject.move(0, -1);
    if (e.keyCode == 39) //Right Arrow Key
        selectedObject.move(1, 0);
    if (e.keyCode == 40) //Top Arrow Key
        selectedObject.move(0, 1); 
    drawLines(selectedObject);
    layer.draw();
    dragLayer.draw();
  }

  if (e.keyCode == 49 || e.keyCode == 50) {
    var mousePos = stage.getPointerPosition();
    var pos = stage.getPosition();
    var finalPos = {x: mousePos.x - pos.x, y: mousePos.y - pos.y};
    addRect(finalPos, e.keyCode - 48);
    layer.draw();
  }

  if(e.keyCode == 8 && selectedObject != null)
  {
    deleteRect(selectedObject);
  }
});

function addRect(mousePos, type)
{
  var size;
  if(type == 1) size = 60;
  else if(type == 2) size = 30;
  var rect = new Kinetic.Rect({
    x: mousePos.x - size/2 - 0.5,
    y: mousePos.y - size/2 - 0.5,
    width: size,
    height: size,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 1,
   // draggable: true
  });
  rect.on('mouseover', function() {
    document.body.style.cursor = 'pointer';
  });
  rect.on('mouseout', function() {
    document.body.style.cursor = 'default';
  });
  rect.magneticEnabled = true;
  layer.add(rect);
  objects.push(rect);
  drawLines(rect);
}

function deleteRect(ref)
{
  var index = objects.indexOf(ref);
  if(index > -1) objects.splice(index, 1);
  ref.destroy();
  layer.draw();
  dragLayer.draw();
}

function drawLines(ref)
{
  var refx = ref.getAttr('x');
  var refy = ref.getAttr('y');
  var width = ref.getAttr('width');

  ref.xLineTop = drawOneLine(ref.xLineTop, [refx - 50 + width/2, refy, refx + 50 + width/2, refy]);
  ref.xLineBottom = drawOneLine(ref.xLineBottom, [refx - 50 + width/2, refy + width, refx + 50 + width/2, refy + width]);
  ref.yLineLeft = drawOneLine(ref.yLineLeft, [refx, refy - 50 + width/2, refx, refy + 50 + width/2]);
  ref.yLineRight = drawOneLine(ref.yLineRight, [refx + width, refy - 50 + width/2, refx + width, refy + 50 + width/2]);

  lineLayer.drawScene();
}

function drawOneLine(refLine, pts)
{
  if(refLine != null)
  {
    refLine.destroy();
    refLine = null;
  }
  refLine = new Kinetic.Line({
    points: pts,
    stroke: 'green',
    strokeWidth: 1,
    dashArray: [2, 2]
  });
  lineLayer.add(refLine);
  refLine.hide();
  refLine.near = false;
  return refLine;
}

function removeLines(ref)
{
  ref.xLineTop.destroy();
  ref.xLineTop = null;
  ref.xLineBottom.destroy();
  ref.xLineBottom = null;
  ref.yLineLeft.destroy();
  ref.yLineLeft = null;
  ref.yLineRight.destroy();
  ref.yLineRight = null;
}

function hideAllLines()
{
  lineLayer.getChildren().each(function(node, index) 
  {
    node.hide();
    node.near = false;
  });
}









