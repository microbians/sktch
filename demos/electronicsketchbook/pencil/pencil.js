var layer,layerWithAlpha;

var layerNum=0;

var np;
var op;

var p1;
var pc;
var p2;

var stroke=[];

var brush = {
	min:0,
	max:2.2,
	limiter: 1400,
	friction: 1.3
};

var d=0;
var acc=0;

var drops=1; // Drops level
var flow=1;  // Stroke flow (efecto de presion mediante la aceleración)

var strokes = [];
var draw=false;
var shiftKey=false;
var controlKey=false;

window.mouse={x:0,y:0};

ACCURATE=120;
ACCURATEcurr=0;

function keyPressed(event) {
	if (event.shiftKey) 	shiftKey=true; 		else 	shiftKey=false;
	if (event.ctrlKey) 		controlKey=true;	else 	controlKey=false;
}
window.addEventListener('keydown',keyPressed,false);
window.addEventListener('keyup'  ,keyPressed,false);

function init() {
	layer = new Layer({
		x:0,
		y:0,
		w:window.innerWidth,
		h:window.innerHeight,
		debug:false
	});
	layer.appendTo( document.body );
	layerWithAlpha  = new Layer({
		x:0,
		y:0,
		w:window.innerWidth,
		h:window.innerHeight,
		debug:false
	});
	layerWithAlpha.appendTo( document.body );
	layerWithAlpha.domElm.style.opacity=1;

	let tickFPS = new FPS('fps');
	updateMouseEvent = function() {
		window.mouse = new Vector( event.clientX - layer.x/layer.RETINA, event.clientY - layer.y/layer.RETINA);
		if (draw) {
			drawing();
		}
		tickFPS.update();
	}

	window.addEventListener("mousedown", 	startDraw);
	window.addEventListener("mouseup", 		stopDraw);
	window.addEventListener("mousemove", 	updateMouseEvent);
}

function startDraw(event) {
	updateMouseEvent(event);

	stroke = []; // 0
	d=brush.min;

	//Fake entrace
	drawing();
	draw=true;
}

function drawing(last) {

	var newPos = new Vector( window.mouse.x, window.mouse.y );

	if (!last) {
		/*
		// Controla el tiempo entre trazos para no crear más de los necesarios
		var curTime=new Date().getTime();
		if ( curTime < ACCURATEcurr+1000/ACCURATE ) 	{
			return;
		} else ACCURATEcurr=curTime;
		*/
		if ( stroke.last() && Math.distance(stroke.last().p, newPos)<3 ) {
			return;  // Don't draw if not movement
		}
	}

	stroke.push({
		p: newPos,
		d: d
	});// 1 ... n

	if(stroke.length<3) {
		return;
	}

	stroke.last().p = stroke.prior().p.lrp( stroke.last().p,.9); // Smooth positions

	if (last) { // last Stroke

		var p1 = stroke.in(-2).p.med( stroke.prior().p );
		var pc = stroke.prior().p;
		var p2 = stroke.last().p;

	} else if (stroke.length==3) { // first stroke can be drawn

		var p1 = stroke.in(-2).p;
		var pc = stroke[1].p;
		var p2 = stroke[1].p.med( stroke[2].p );

	} else {

		var p1 = stroke.in(-2).p.med( stroke.prior().p );
		var pc = stroke.prior().p;
		var p2 = stroke.last().p.med( stroke.prior().p );

	}
	var np = stroke.last().p;

	// DIRTY TRICKS - To solve the union betwen each trace
	p1=p1.sub( p1.vec(pc).uni().mul(.1) );
	//p2=p2.add( pc.vec(p2).uni().mul(.1) );

	var strokeDistance = Math.distance2(p1,pc)+Math.distance2(pc,p2);

	if (stroke.length==3) {
		acc = strokeDistance / brush.limiter;
	}

	acc += strokeDistance / brush.limiter;
	acc = acc / brush.friction;
	d = Math.lerp(stroke.prior().d, Math.clamp(Math.lerp( brush.min, brush.max, 1/acc), brush.min, brush.max), .4);

	stroke.last().d = d;

	layerWithAlpha.strokeStyle=undefined;
	layerWithAlpha.lineWidth=undefined;
	layerWithAlpha.fillStyle="black";

	var b  = new QuadBezier(p1,pc,p2);

	var t  = b.closestTtoPc();
	var pt = b.getPointAtT(t);

	var strokeWeight = stroke.prior().d;
	var p1n = b.normalUnitVectorAtT(0);
	var p1L = p1.add( p1n.mul(+strokeWeight/2) );
	var p1R = p1.add( p1n.mul(-strokeWeight/2) );

	var strokeWeight = Math.lerp(stroke.prior().d, stroke.last().d, t);
	var ptn = b.normalUnitVectorAtT(t);
	var ptL = pt.add( ptn.mul(+strokeWeight/2) );
	var ptR = pt.add( ptn.mul(-strokeWeight/2) );

	var strokeWeight = stroke.last().d;
	var p2n = b.normalUnitVectorAtT(1);
	var p2L = p2.add( p2n.mul(+strokeWeight/2) );
	var p2R = p2.add( p2n.mul(-strokeWeight/2) );

	// Cap
	if (last) {
		layerWithAlpha.beginPath();
		let angStart= new Vector(1,0).ang(p2R.vec(p2L));
		layerWithAlpha.arc(p2.sub(pc.vec(p2).uni().mul(.1)), stroke.last().d/2 , angStart, angStart+Math.PI);
		layerWithAlpha.fill();
	} else if (stroke.length==3) {
		layerWithAlpha.beginPath();
		let angStart= new Vector(1,0).ang(p1L.vec(p1R));
		layerWithAlpha.arc(p1.add(p1.vec(pc).uni().mul(.1)), stroke.first().d/2 , angStart, angStart+Math.PI);
		layerWithAlpha.fill();
	}

	layerWithAlpha.globalAlpha=.15

	if (b.angle<Math.PIHalf) { // IF the angle is closed

		var p1c  = b.getControlPointOfASegment(0,t);
		var b1   = new QuadBezier(p1,p1c,pt);
		var p1m  = p1n.add(ptn);
		var p1t  = Math.lerp( 0,t, b1.closestTtoPc() ); // Interpolate over 0-t (original bezier b) the t of p1 p1c pt
		var strokeWeight = Math.lerp(stroke.prior().d, stroke.last().d, p1t); // Use that t to know the weight on that point
		var p1cL = p1c.add( p1m.mul( +strokeWeight/p1m.length2() ) ); // Expand with that strokeWeight the bezier stroke
		var p1cR = p1c.add( p1m.mul( -strokeWeight/p1m.length2() ) );

		var p2c  = b.getControlPointOfASegment(t,1);
		var b2   = new QuadBezier(pt,p2c,p2);
		var p2m  = ptn.add(p2n);
		var p2t  = Math.lerp( t,1, b2.closestTtoPc() );
		var strokeWeight = Math.lerp(stroke.prior().d, stroke.last().d, p2t);
		var p2cL = p2c.add( p2m.mul( +strokeWeight/p2m.length2() ) );
		var p2cR = p2c.add( p2m.mul( -strokeWeight/p2m.length2() ) );

		// DIRTY TRICKS - To solve the union betwen each trace
		ptLfix=ptL.add( ptL.vec(ptR).per().uni().mul(.1) );
		ptRfix=ptR.add( ptL.vec(ptR).per().uni().mul(.1) );

		layerWithAlpha.beginPath();
		layerWithAlpha.moveTo(p1L);
		layerWithAlpha.quadraticCurveTo(p1cL, ptLfix);
		layerWithAlpha.lineTo(ptRfix);
		layerWithAlpha.quadraticCurveTo(p1cR, p1R);
//layerWithAlpha.closePath();
		layerWithAlpha.fill();
//layerWithAlpha.stroke();

		layerWithAlpha.beginPath();
		layerWithAlpha.moveTo(p2L);
		layerWithAlpha.quadraticCurveTo(p2cL, ptL);
		layerWithAlpha.lineTo(ptR);
		layerWithAlpha.quadraticCurveTo(p2cR, p2R);
//layerWithAlpha.closePath();
		layerWithAlpha.fill();
//layerWithAlpha.stroke();

	} else {
		ptm  = p1n.add(p2n);
		var strokeWeight = Math.lerp(stroke.prior().d, stroke.last().d, t);
		ptcL = pc.add( ptm.mul( +strokeWeight/ptm.length2() ) );
		ptcR = pc.add( ptm.mul( -strokeWeight/ptm.length2() ) );

		layerWithAlpha.beginPath();
		layerWithAlpha.moveTo(p1L);
		layerWithAlpha.quadraticCurveTo(ptcL, p2L);
		layerWithAlpha.lineTo(p2R);
		layerWithAlpha.quadraticCurveTo(ptcR, p1R);
//layerWithAlpha.closePath();
		layerWithAlpha.fill();
//layerWithAlpha.stroke();
	}

}

function stopDraw(event) {

	updateMouseEvent(event);
	draw=false;

	layer.globalAlpha = layerWithAlpha.domElm.style.opacity;
	layer.copy(layerWithAlpha);
	layer.globalAlpha = 1;
	layer.globalCompositeOperation = "source-over";
	layerWithAlpha.clearRect(0, 0, layerWithAlpha.w, layerWithAlpha.h);

	d=brush.min;
	acc=1000;
	drawing(true); //Last
}

window.ready(init);
