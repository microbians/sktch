var layer,layerWithAlpha;

var layerNum=0;
var Pt;
var oldPt;
var oldMidPt;
var title;
var color;
var strokeWeight;
var colors;
var index;
var strokesNumber=-1;
var strokes = new Array();
var draw=false;
var shiftKey=false;
var controlKey=false;
var mainUI;
var canvasWidth=1024;
var canvasHeight=900;

function keyPressed(event) {
	if (event.shiftKey) 	shiftKey=true; 		else 	shiftKey=false;
	if (event.ctrlKey) 		controlKey=true;	else 	controlKey=false;
}
window.addEventListener('keydown',keyPressed,false);
window.addEventListener('keyup'  ,keyPressed,false);

function init() {
	layer = new Layer({
		x:50,
		y:50,
		w:canvasWidth,
		h:canvasHeight,
		debug:false
	});
	layer.appendTo( document.body );
	layerWithAlpha  = new Layer({
		x:50,
		y:50,
		w:canvasWidth,
		h:canvasHeight,
		debug:false
	});
	layerWithAlpha.appendTo( document.body );
	layerWithAlpha.domElm.style.opacity=.6;

	index = 0;
	colors = ["#828b20", "#b0ac31", "#cbc53d", "#fad779", "#f9e4ad", "#faf2db", "#563512", "#9b4a0b", "#d36600", "#fe8a00", "#f9a71f"];

	let tickFPS = new FPS('fps');

	render = function() {
		if (draw) {
			drawing();
		}
		tickFPS.update();
		window.requestAnimFrame(render);
	}
	render();

	window.addEventListener("mousedown", 	startDraw);
	window.addEventListener("mouseup", 		stopDraw);
	window.addEventListener("mousemove", 	function (event) {
		window.mouse = new Vector({x:event.clientX - layer.x/layer.RETINA, y:event.clientY - layer.y/layer.RETINA});
	});
}

function startDraw(event) {

	if (controlKey==true) return;

	color = colors[(index++) % colors.length];
	strokeWeight = (Math.random() * 30 + 10 | 1);

	oldPt    = new Vector({ x: window.mouse.x, y: window.mouse.y });
	oldMidPt = new Vector({ x: oldPt.x, y: oldPt.y });

	strokesNumber++;

	strokes[strokesNumber] = [];
	strokes[strokesNumber].subStrokesNum = 0;
	strokes[strokesNumber].alpha=1;

	draw=true;
}

function drawing() {

	if ( oldPt.distance(window.mouse)<1 ) return;  // Don't draw if not movement

	var Pt    = new Vector({x: window.mouse.x, y:window.mouse.y });
	var midPt = oldPt.med(window.mouse);

	strokes[strokesNumber].subStrokesNum++;

	layerWithAlpha.canvas.beginPath();
	layerWithAlpha.canvas.strokeStyle = color;
	layerWithAlpha.canvas.lineWidth = strokeWeight;

	layerWithAlpha.canvas.lineCap = "round";
	layerWithAlpha.canvas.lineJoin = "round";

	layerWithAlpha.canvas.globalAlpha = 1;
	//layerWithAlpha.canvas.globalCompositeOperation = "destination-atop";

	layerWithAlpha.canvas.moveTo(midPt.x, midPt.y);
	layerWithAlpha.canvas.quadraticCurveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
	layerWithAlpha.canvas.stroke();

	oldPt 	 = new Vector({x: Pt.x, y:Pt.y });
	oldMidPt = new Vector({x: midPt.x, y:midPt.y });
}

function stopDraw(event) {

	draw=false;

	if (controlKey==true) return;

	if (strokes[strokesNumber].subStrokesNum == 0) {
		strokes.pop();
		strokesNumber--;
	} else {
		layer.canvas.globalAlpha = layerWithAlpha.domElm.style.opacity;
		layer.copy(layerWithAlpha);
		layer.canvas.globalAlpha = 1;
		layer.canvas.globalCompositeOperation = "source-over";
		layerWithAlpha.canvas.clearRect(0, 0, layerWithAlpha.w, layerWithAlpha.h);
	}
}

window.ready(init);
