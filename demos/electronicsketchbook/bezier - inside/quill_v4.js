var layer, layerStroke;

var layerNum = 0;

var np;
var op;

var p1;
var pc;
var p2;

var stroke = [];

var brushQuill = {
    min: 50,
    max: 150,
    acc: 4,
    limiter: 2000,
    friction: 1.2
};

var dirtyQuill = {
    min: 4,
    max: 20,
    acc: 2,
    drops: 2000,
    dropsFrecuency: 100,
    dropsSmooth: 400,
    limiter: 120,
    friction: 0.2
};

var brushPen = {
    min: 0,
    max: 3,
    acc: 4,
    limiter: 2000,
    friction: 1.2
};

var brush = brushQuill;

var d = 0;
var acc = 0;

var drops = 1; // Drops level
var flow = 1; // Stroke flow (efecto de presion mediante la aceleración)

var strokes = [];
var draw = false;
var shiftKey = false;
var controlKey = false;

window.mouse = {
    x: 0,
    y: 0
};

DEBUG = true
ACCURATE = 120;
ACCURATEcurr = 0;

function keyPressed(event) {
    if (event.shiftKey) shiftKey = true;
    else shiftKey = false;
    if (event.ctrlKey) controlKey = true;
    else controlKey = false;
}
window.addEventListener('keydown', keyPressed, false);
window.addEventListener('keyup', keyPressed, false);

var MOUSEEL;

function init() {
    stage = new Layer({
        x: 0,
        y: 0,
        w: window.innerWidth,
        h: window.innerHeight,
        debug: false
    });
    stage.appendTo(document.body);

    if (DEBUG) {
        Q1 = new Circle({
            x: 300,
            y: 300,
            radius: 20
        });
        QC = new Circle({
            x: 600,
            y: 600,
            radius: 20
        });
        Q2 = new Circle({
            x: 1200,
            y: 300,
            radius: 20
        });

        Q1.fillStyle = "red";
        QC.fillStyle = "red";
        Q2.fillStyle = "red";

        stage.append(Q1);
        stage.append(QC);
        stage.append(Q2);
    }

    layerStroke = new Layer({
        id: "STROKE",
        x: 0,
        y: 0,
        w: window.innerWidth,
        h: window.innerHeight,
        debug: false
    });

    layerStroke.appendTo(document.body);

    layerStroke.domElm.style.opacity = 1;

    /*

    	let filterid="waves";
    	layerStroke.domElm.style.filter=`url(#${filterid})`;
    	stage.domElm.style.filter=`url(#${filterid})`;

    */

    let tickFPS = new FPS('fps');
    render = function() {
        if (draw) {
            //window.mouse = window.mouse.lrp( window.mouse.add({x:random(-10,10),y:random(-10,10)}), .2);
            drawing();

            if (DEBUG) {
                if (MOUSEEL) {
                    MOUSEEL.x = window.mouse.x;
                    MOUSEEL.y = window.mouse.y;
                }
            }

        }


        if (DEBUG) {
            stage.render()
        }

        tickFPS.update();
        setTimeout(render, 1000 / 120);
    }
    render();

    updateMouseEvent = function(e) {
        window.mouse = new Vector(e.clientX - stage.x / stage.RETINA, e.clientY - stage.y / stage.RETINA);
    }

    window.addEventListener("mousedown", startDraw);
    window.addEventListener("mouseup", stopDraw);
    window.addEventListener("mousemove", updateMouseEvent);
}

function startDraw(event) {
    updateMouseEvent(event);

    stroke = []; // 0
    d = brush.min;
    acc = brush.acc;

    drawing();
    draw = true;

    if (DEBUG) {
        MOUSEEL = undefined

        if (Q1.hitTest(window.mouse)) {
            Q1.x = window.mouse.x;
            Q1.y = window.mouse.y;
            MOUSEEL = Q1
        }
        if (QC.hitTest(window.mouse)) {
            QC.x = window.mouse.x;
            QC.y = window.mouse.y;
            MOUSEEL = QC
        }
        if (Q2.hitTest(window.mouse)) {
            Q2.x = window.mouse.x;
            Q2.y = window.mouse.y;
            MOUSEEL = Q2
        }
    }

}

function drawing(last, force) {

    var newPos = new Vector(window.mouse.x, window.mouse.y);

    if (!last) {
        // Controla el tiempo entre trazos para no crear más de los necesarios
        var curTime = new Date().getTime();
        if (curTime < ACCURATEcurr + 1000 / ACCURATE) {
            return;
        } else ACCURATEcurr = curTime;

        if (!DEBUG) {
            if (stroke.last() && Math.distance(stroke.last().p, newPos) < 4) {
                return; // Don't draw if not movement
            }
        }

    }

    stroke.push({
        p: newPos,
        d: d
    }); // 1 ... n

    if (stroke.length < 3) {
        return;
    }

    stroke.last().p = stroke.prior().p.lrp(stroke.last().p, .7); // Smooth positions

    if (last) { // last Stroke

        var p1 = stroke.in(-2).p.med(stroke.prior().p);
        var pc = stroke.prior().p;
        var p2 = stroke.last().p;

    } else if (stroke.length == 3) { // first stroke can be drawn

        var p1 = stroke.in(-2).p;
        var pc = stroke[1].p;
        var p2 = stroke[1].p.med(stroke[2].p);

    } else {

        var p1 = stroke.in(-2).p.med(stroke.prior().p);
        var pc = stroke.prior().p;
        var p2 = stroke.last().p.med(stroke.prior().p);

    }
    var np = stroke.last().p;

    // DIRTY TRICKS - To solve the union betwen each trace
    p1 = p1.sub(p1.vec(pc).uni().mul(.1));
    //p2=p2.add( pc.vec(p2).uni().mul(.1) );

    if (!last) {
        var strokeDistance = Math.distance2(p1, pc) + Math.distance2(pc, p2);

        acc += strokeDistance / brush.limiter;
        acc = acc / brush.friction;

        d = Math.lerp(brush.min, brush.max, 1 / acc);
        d = Math.clamp(d, brush.min, brush.max);

        if (brush.drops) {
            if (Math.random(0, 100) < brush.dropsFrecuency) {
                d = Math.lerp(d, Math.random(brush.min, brush.drops), 1 / brush.dropsSmooth);
            }
        }
    } else d = stroke.prior().d;

    if (DEBUG) {
        layerStroke.clear()
        d = 100;
    }

    if (DEBUG) {
        p1 = new Vector(Q1);
        pc = new Vector(QC);
        p2 = new Vector(Q2);
    }

    d = Math.lerp(stroke.prior().d, d, .7);
    stroke.last().d = d;

    let b = new QuadBezier(p1, pc, p2);
    let t = b.closestTtoPc();
    let pt = b.getPointAtT(t);

    let d1 = stroke.prior().d;
    let d2 = stroke.last().d;

    if (DEBUG) {
        d1 = 50
        d2 = 200
    }

    function splitCurveAtClosed(at, P) {
        let nc = b.getControlPointOfASegment(P[at-1].t, P[at].t)
        P[at-1].c = nc;
        let nt = b.closestTtoPc(nc);
        let newPoint = b.getOffsetingDataAt(nt, P.first().d, P.last().d);
        P.splice(at, 0, newPoint);
    }

    function splitCurveAtMiddle(at, P) {
        let nc = b.getControlPointOfASegment(P[at-1].t, P[at].t)
        P[at-1].c = nc;
        let nt = (P[at-1].t + P[at].t)/2;
        let newPoint = b.getOffsetingDataAt(nt, P.first().d, P.last().d);
        P.splice(at, 0, newPoint);
    }

    function splitCurveAtVectorAngle(at, P, vectorAtAnAngle) {

        if ( Math.abs(P[at].n.ang(P[at-1].n))<Math.PI/3 ) return;

        let nc = b.getControlPointOfASegment(P[at-1].t, P[at].t)
        P[at-1].c = nc;
        let nt = b.TtangentToVector( vectorAtAnAngle.per() );

        if(nt == undefined || nt>P[at].t || nt<P[at-1].t) return false;

        let newPoint = b.getOffsetingDataAt(nt, P.first().d, P.last().d);

        P.splice(at, 0, newPoint);
        return true
    }


    function controlPointOf(at) {
        let nc = b.getControlPointOfASegment(P[at].t, P[at + 1].t)
        P[at].c = nc;
        P[at].m = (P[at].n).add(P[at + 1].n);

        let nt = Math.lerp(P[at].t, P[at + 1].t, .5);
        let NP = b.getOffsetingDataAt(nt, P.first().d, P.last().d);

        P[at].cl = nc.add(P[at].m.mul(+NP.d / P[at].m.length2()));
        P[at].cr = nc.add(P[at].m.mul(-NP.d / P[at].m.length2()));
    }


    function bez(p1,pc,p2, w,c,o) {
        if (w) layerStroke.lineStyle(w,c,o);
        layerStroke.beginPath();
        layerStroke.moveTo(p1);
        layerStroke.quadraticCurveTo(pc, p2);
        layerStroke.stroke();
    }

    function cir(p1,r, w,c,o) {
        if (w) layerStroke.lineStyle(w,c,o);
        layerStroke.beginPath();
        layerStroke.circle(p1, r)
        layerStroke.stroke();
    }

    function lin(p1,p2, w,c,o) {
        if (w) layerStroke.lineStyle(w,c,o);
        layerStroke.beginPath();
        layerStroke.moveTo(p1);
        layerStroke.lineTo(p2);
        layerStroke.stroke();
    }

    let nt, NP, nc;

    var P = [];
    P[0] = b.getOffsetingDataAt(0, d1, d2);
    P[1] = b.getOffsetingDataAt(1, d1, d2);

    let angleLimit  = Math.PI/4;
    let SGN         = b.clockwise() ? +1 : -1;

    splitCurveAtClosed(1, P);
    indexCenter=1;

    let angle  = Math.abs(Vector.ang3(P.first().p,P[indexCenter].p,P.last().p));

/*
    //EXTERIOR???
    if (splitCurveAtVectorAngle(indexCenter, P, P[indexCenter].n.rot(-angle).per())) {
        indexCenter++;
        splitCurveAtMiddle(indexCenter, P)
        indexCenter++;
        if (splitCurveAtVectorAngle(indexCenter, P, P[indexCenter].n.rot(-Math.PI/6).per())) {
            indexCenter++;
        }
    }
    if (splitCurveAtVectorAngle(indexCenter+1, P, P[indexCenter].n.rot(+angle).per())) {
        splitCurveAtMiddle(indexCenter+1, P)
            if (splitCurveAtVectorAngle(indexCenter+1, P, P[indexCenter].n.rot(Math.PI/6).per())) {
            }
    }
*/
    for (let i = 0; i<P.length-1; i++ ) {
        controlPointOf(i)
    }

    RES=150//Math.ceil(b.getLength());
    for(let i=0; i<RES; i++) {
        let nt = b.getSegment(0,i/RES).getLength()/b.getLength();
        let NP = b.getOffsetingDataAt(nt, d1, d2);
        if (nt<P[indexCenter].t) {
            cir(NP.p, NP.d/2,  1,"green",.1)
        } else {
            cir(NP.p, NP.d/2,  1,"purple",.1)
        }
    }

    // CENTRAL
    for (let i = 0; i < P.length-1; i++) {
        if (i<P.length/2) {
            bez(P[i].p, P[i].c, P[i+1].p,   4,"red",.1);
        } else {
            bez(P[i].p, P[i].c, P[i+1].p,   4,"green",.1);
        }
    }

    for (let i = 0; i < P.length; i++) {

        if (i==0) {
            layerStroke.lineStyle(3, "blue", .3)
            layerStroke.beginPath();
    		let angStart= new Vector(1,0).ang( P[i].l.vec( P[i].r ) );
    		layerStroke.arc(p1.sub(pc.vec(p1).uni().mul(.1)), P[i].d/2 , angStart, angStart+Math.PI);
            layerStroke.stroke();
        } else if (i==P.length-1) {
            layerStroke.lineStyle(3, "black", .3);
            layerStroke.beginPath();
    		let angStart= new Vector(1,0).ang( P[i].r.vec( P[i].l ) );
    		layerStroke.arc(p2.sub(pc.vec(p2).uni().mul(.1)), P[i].d/2 , angStart, angStart+Math.PI);
            layerStroke.stroke();
        } else {
            if (i==indexCenter) {
                cir(P[i].p, P[i].d / 2 ,      1,"black",.3);
            } else {
                cir(P[i].p, P[i].d / 2 ,      1,"red",.3);
            }
        }

        if (i==indexCenter) {
            lin(P[i].p, P[i].r.add( P[i].n.mul(-1000) )    ,1,"blue",.3);
            lin(P[i].p, P[i].l.add( P[i].n.mul(1000) )    ,1,"green",.3);
        } else {
            lin(P[i].p, P[i].r    ,1,"blue",.3);
            lin(P[i].p, P[i].l    ,1,"green",.3);
        }

    }

/*
    l1 = Math.tangentPointsOfaCircleAndPoint( P[indexCenter].p, P[indexCenter].d/2, P.last().r )[1];
    l2 = Math.tangentPointsOfaCircleAndPoint( P[indexCenter].p, P[indexCenter].d/2, P.last().l )[1];
    if (l1==undefined) l1 = P[indexCenter].l;
    if (l2==undefined) l2 = P[indexCenter].l;
    cir(l1,2,   1,"green",1)
    cir(l2,2,   1,"blue",1)
*/

    if (-angle+Math.PI/2>0 && SGN<0) {
        subAng1 = P[indexCenter].n.ang()-angle+Math.PI/2
        subAng2 = P[indexCenter].n.ang()+angle-Math.PI/2
    } else {
        subAng1 = P[indexCenter].n.ang()
        subAng2 = P[indexCenter].n.ang()
    }

    v1 = new Vector(Math.sin(subAng1)*P[indexCenter].d/2, Math.cos(subAng1)*P[indexCenter].d/2)
    l1 =P[indexCenter].p.add(v1);
    bez( P.last().l, P[indexCenter].cl, l1,  1,"black",1)

    v2 = new Vector(Math.sin(subAng2)*P[indexCenter].d/2, Math.cos(subAng2)*P[indexCenter].d/2)
    l2 = P[indexCenter].p.add(v2);
    bez( P.first().l, P.first().cl, l2,  1,"black",1)

    ang2 = P.last().l.add( P.last().n.per() ).ang( P[indexCenter].n )



/*
    ci = Math.intersectLineCircle(P.last().l,  P.last().l.add( P.last().n.per().rot(Math.PI/32*angle).mul(1000) ), P[indexCenter].p, P[indexCenter].d/2 );
    if (ci.length>0) {
        ci[0] && cir( ci[0], 5,    1,"red",1);
        ci[1] && cir( ci[1], 5,    1,"red",1);

        if (ci[1]) {
             bez( P.last().l, P[indexCenter].cl, ci[1],  2,"black",.1)
         } else {
             bez( P.last().l, P[indexCenter].cl, ci[0],  2,"black",1)
         }
    }
*/

//    lin( P.last().l,  P.last().l.add( P.last().n.per().rot(0).mul(1000) )   ,1,"blue",.3);
//    lin( P.last().l,  P.last().l.add( P.last().n.per().rot(Math.PI/32*angle).mul(1000) )   ,1,"blue",.3);

/*
    // Calc control points of each segment
    l1 = Math.tangentPointsOfaCircleAndPoint( P[indexCenter].p, P[indexCenter].d/2, P.first().l )[0];
    l2 = Math.tangentPointsOfaCircleAndPoint( P[indexCenter].p, P[indexCenter].d/2, P.last().l )[1];
    if (l1==undefined) l1 = P[indexCenter].l;
    if (l2==undefined) l2 = P[indexCenter].l;

    // Calc control points of each segment
    r1 = Math.tangentPointsOfaCircleAndPoint( P[indexCenter].p, P[indexCenter].d/2, P.first().r )[1];
    r2 = Math.tangentPointsOfaCircleAndPoint( P[indexCenter].p, P[indexCenter].d/2, P.last().r )[0];
    if (r1==undefined) r1 = P[indexCenter].r;
    if (r2==undefined) r2 = P[indexCenter].r;

    if (SGN<0) {
        layerStroke.lineStyle(1, "blue", 1)
        layerStroke.beginPath();
        layerStroke.moveTo(P.first().l);
        layerStroke.quadraticCurveTo(P.first().cl, l1);
        layerStroke.stroke();
        layerStroke.beginPath();
        layerStroke.circle(l1, 5);
        layerStroke.stroke();

        layerStroke.lineStyle(1, "blue", 1)
        layerStroke.beginPath();
        layerStroke.moveTo(l2);
        layerStroke.quadraticCurveTo(P[indexCenter].cl, P.first().l);
        layerStroke.stroke();
        layerStroke.beginPath();
        layerStroke.circle(P.first().cl, 5);
        layerStroke.stroke();

        layerStroke.lineStyle(1, "black", 1)
        layerStroke.beginPath();
        layerStroke.moveTo(P.first().r);
        layerStroke.quadraticCurveTo(P.first().cr, P[indexCenter].r);
        layerStroke.stroke();
        layerStroke.beginPath();
        layerStroke.circle(P.first().cr, 5);
        layerStroke.stroke();

    } else {
        layerStroke.lineStyle(1, "blue", 1)
        layerStroke.beginPath();
        layerStroke.moveTo(P[0].r);
        layerStroke.quadraticCurveTo(P[0].cr, r1);
        layerStroke.stroke();
        layerStroke.beginPath();
        layerStroke.circle(P[0].cr, 5);
        layerStroke.stroke();

        layerStroke.lineStyle(1, "blue", 1)
        layerStroke.beginPath();
        layerStroke.moveTo(r2);
        layerStroke.quadraticCurveTo(P[1].cr, P[2].r);
        layerStroke.stroke();
        layerStroke.beginPath();
        layerStroke.circle(P[0].cr, 5);
        layerStroke.stroke();


    }
*/
/*
// Tengo que corregir el CL como intersección de la tangente del punto en el circulo y el otro del extremo
cl = Math.intersectRaysTn( l1, l1.vec(P[1].p).per(), P[0].l, P[0].l.vec(P[0].r).per() );

layerStroke.beginPath();
layerStroke.circle(cl,10);
layerStroke.stroke();

P[0].cl=P[0].cl;


cl = Math.intersectRaysTn( l2, l2.vec(P[1].p).per(), P[P.length-1].l, P[P.length-1].l.vec(P[P.length-1].r).per() );

layerStroke.beginPath();
layerStroke.circle(cl,10);
layerStroke.stroke();

P[P.length-2].cl=cl;


    r1 = Math.tangentPointsOfaCircleAndPoint(P[1].p, P[1].d/2, P[0].r)[1];
    r2 = Math.tangentPointsOfaCircleAndPoint(P[1].p, P[1].d/2, P[P.length-1].r)[0];


    if (r1==undefined) r1 = P[1].r;
    if (r2==undefined) r2 = P[1].r;
    */



/*
    layerStroke.save();
    layerStroke.lineStyle(1, "blue", 1)
    layerStroke.beginPath();
    layerStroke.moveTo(P[0].l);
    layerStroke.quadraticCurveTo(P[0].cl, l1);
    layerStroke.stroke();
    layerStroke.lineStyle(1, "blue", .2)
    layerStroke.beginPath();
    layerStroke.moveTo(P[0].r);
    layerStroke.quadraticCurveTo(P[0].cr, r1);
    layerStroke.stroke();

    layerStroke.save();
    layerStroke.lineStyle(1, "black", 1)
    layerStroke.beginPath();
    layerStroke.moveTo(l2);
    layerStroke.quadraticCurveTo(P[1].cl, P[2].l);
    layerStroke.stroke();
    layerStroke.lineStyle(1, "black", .2)
    layerStroke.beginPath();
    layerStroke.moveTo(r2);
    layerStroke.quadraticCurveTo(P[1].cr, P[2].r);
    layerStroke.stroke();

    layerStroke.beginPath();
    layerStroke.circle(l1, 5);
    layerStroke.stroke();
    layerStroke.beginPath();
    layerStroke.circle(l2, 5);
    layerStroke.stroke();

    layerStroke.beginPath();
    layerStroke.circle(r1, 5);
    layerStroke.stroke();
    layerStroke.beginPath();
    layerStroke.circle(r2, 5);
    layerStroke.stroke();
*/

    //*/

    /*

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

    if(!DEBUG){
    	// Cap
    	if (last) {
    		layerStroke.beginPath();
    		let angStart= new Vector(1,0).ang(p2R.vec(p2L));
    		layerStroke.arc(p2.sub(pc.vec(p2).uni().mul(.1)), stroke.last().d/2 , angStart, angStart+Math.PI);
    		layerStroke.fill();
    	} else if (stroke.length==3) {
    		layerStroke.beginPath();
    		let angStart= new Vector(1,0).ang(p1L.vec(p1R));
    		layerStroke.arc(p1.add(p1.vec(pc).uni().mul(.1)), stroke.first().d/2 , angStart, angStart+Math.PI);
    		layerStroke.fill();
    	}

    }

    // Mirar si lo haogo con RES como lo que hacía en flash

    	if (Math.abs(b.angDegrees())<145) { // IF the angle is closed

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

    		layerStroke.beginPath();
    		layerStroke.moveTo(p1L);
    		layerStroke.quadraticCurveTo(p1cL, ptLfix);
    		layerStroke.lineTo(ptRfix);
    		layerStroke.quadraticCurveTo(p1cR, p1R);
    		layerStroke.stroke();

    		layerStroke.beginPath();
    		layerStroke.moveTo(p2L);
    		layerStroke.quadraticCurveTo(p2cL, ptL);
    		layerStroke.lineTo(ptR);
    		layerStroke.quadraticCurveTo(p2cR, p2R);
    		layerStroke.stroke();

    	} else {
    		ptm  = p1n.add(p2n);
    		var strokeWeight = Math.lerp(stroke.prior().d, stroke.last().d, t);
    		ptcL = pc.add( ptm.mul( +strokeWeight/ptm.length2() ) );
    		ptcR = pc.add( ptm.mul( -strokeWeight/ptm.length2() ) );

    		layerStroke.beginPath();
    		layerStroke.moveTo(p1L);
    		layerStroke.quadraticCurveTo(ptcL, p2L);
    		layerStroke.lineTo(p2R);
    		layerStroke.quadraticCurveTo(ptcR, p1R);
    		layerStroke.stroke();
    	}

    	var dd= p1.distance(pc)/p2.distance(pc);

    	var ptt= (pc.mul(2*d).add(p1).add(p2.mul(dd*dd))).mul(1/((dd+1)*(dd+1)));

    	layerStroke.beginPath();
    	layerStroke.fillStyle="green"
    	layerStroke.circle(ptt,5);
    	layerStroke.fill();

    	log(ptt)

    //*/

}

function stopDraw(event) {

    updateMouseEvent(event);
    draw = false;

    d = brush.min;
    acc = brush.acc;
    drawing(true); //Last
    if (!DEBUG) {
        setTimeout(function() {
            stage.globalAlpha = layerStroke.domElm.style.opacity;
            stage.copy(layerStroke);
            stage.globalAlpha = 1;
            stage.globalCompositeOperation = "source-over";
            layerStroke.clear();
        }, 200)
    }

}

window.ready(init);
