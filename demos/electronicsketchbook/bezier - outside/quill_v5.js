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

        Q1.fillStyle = "rgba(255,0,0,.2)";
        QC.fillStyle = "rgba(255,0,0,.2)";
        Q2.fillStyle = "rgba(255,0,0,.2)";

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

    let nt, NP, nc,angStart;

    var P = [];
    P[0] = b.getOffsetingDataAt(0, d1, d2);
    P[1] = b.getOffsetingDataAt(1, d1, d2);

    let angle  = b.angle;
    let angleLimit  = Math.PI/8;
    let SGN         = b.clockwise() ? +1 : -1;

    splitCurveAtClosed(1, P);
    indexCenter = 1;

    //EXTERIOR???
    if (splitCurveAtVectorAngle(indexCenter, P, P[indexCenter].n.rot(-angle).per())) {
        indexCenter++;
        splitCurveAtMiddle(indexCenter, P)
        indexCenter++;
        if (splitCurveAtVectorAngle(indexCenter, P, P[indexCenter].n.rot(-Math.PI/12).per())) {
            indexCenter++;
        }
    }
    if (splitCurveAtVectorAngle(indexCenter+1, P, P[indexCenter].n.rot(+angle).per())) {
        splitCurveAtMiddle(indexCenter+1, P)
            if (splitCurveAtVectorAngle(indexCenter+1, P, P[indexCenter].n.rot(Math.PI/12).per())) {
            }
    }


    // Calc control points of each segment
    for (let i = 0; i < P.length - 1; i++) {
        nc = b.getControlPointOfASegment(P[i].t, P[i + 1].t);
        P[i].c = nc;
        P[i].m = (P[i].n).add(P[i + 1].n);

        nt = Math.lerp(P[i].t, P[i + 1].t, .5);
        NP = b.getOffsetingDataAt(nt, P.first().d, P.last().d);

        P[i].cl = nc.add(P[i].m.mul(+NP.d / P[i].m.length2()));
        P[i].cr = nc.add(P[i].m.mul(-NP.d / P[i].m.length2()));
    }



    layerStroke.save();
    layerStroke.lineStyle(1, "blue", 1)
    layerStroke.beginPath();
    angStart= new Vector(1,0).ang( P[0].l.vec( P[0].r ) );
    layerStroke.arc(p1.sub(pc.vec(p1).uni().mul(.1)), P[0].d/2 , angStart, angStart+Math.PI);
    layerStroke.stroke();

    layerStroke.lineStyle(1, "black", 1);
    layerStroke.beginPath();
    angStart= new Vector(1,0).ang( P.last().r.vec( P.last().l ) );
    layerStroke.arc(p2.sub(pc.vec(p2).uni().mul(.1)), P.last().d/2 , angStart, angStart+Math.PI);
    layerStroke.stroke();


    for (let i = 0; i < P.length; i++) {
        layerStroke.lineStyle(1, "red", .2);
        layerStroke.beginPath();
        if (i==indexCenter) layerStroke.circle(P[i].p, P[i].d / 2);
        layerStroke.stroke();
        layerStroke.lineStyle(1, "red", .3);
        layerStroke.beginPath();
        layerStroke.moveTo(P[i].l);
        layerStroke.lineTo(P[i].r);
        layerStroke.stroke();
    }

    for (let i = 0; i < P.length - 1; i++) {

        layerStroke.lineStyle(1, "red", .1)
        layerStroke.beginPath();
        layerStroke.moveTo(P[i].p);
        layerStroke.quadraticCurveTo(P[i].c, P[i + 1].p);
        layerStroke.stroke();

        layerStroke.lineStyle(1, "blue", 1)
        layerStroke.beginPath();
        layerStroke.moveTo(P[i].l);
        layerStroke.quadraticCurveTo(P[i].cl, P[i + 1].l);
        layerStroke.stroke();

        layerStroke.lineStyle(1, "black", 1)
        layerStroke.beginPath();
        layerStroke.moveTo(P[i].r);
        layerStroke.quadraticCurveTo(P[i].cr, P[i + 1].r);
        layerStroke.stroke();
    }

    layerStroke.restore();

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
