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

MAXCONTROLS = 4;

function keyPressed(event) {
    if (event.shiftKey) shiftKey = true;
    else shiftKey = false;
    if (event.ctrlKey) controlKey = true;
    else controlKey = false;
}
window.addEventListener('keydown', keyPressed, false);
window.addEventListener('keyup', keyPressed, false);

var OBJECTonDRAG;

function init() {
    stage = new Layer({
        x: 60,
        y: 80,
        w: window.innerWidth,
        h: window.innerHeight,
        debug: false
    });
    stage.appendTo(document.body);

    if (DEBUG) {

        Q=[];

        for(let i=0; i<MAXCONTROLS; i++) {
            Q[i] = new Circle({
                        x: 300 + 250 * i,
                        y: 300+ 100 * (i%2),
                        radius: 10 //20*(i/2)+20
                    });
            Q[i].fillStyle = "red";
            stage.append(Q[i]);
        }

        SWITCH = new Circle({
            x: 30,
            y: 30,
            radius: 20
        });
        SWITCH.fillStyle = "green";
        SWITCH.status = true;
        stage.append(SWITCH);

    }

    layerStroke = new Layer({
        id: "STROKE",
        x: stage.x,
        y: stage.y,
        w: stage.w,
        h: stage.h,
        debug: false
    });

    layerStroke.appendTo(document.body);
    layerStroke.domElm.style.opacity = 1;


    let tickFPS = new FPS('fps');
    render = function() {
        if (draw) {
            //window.mouse = window.mouse.lrp( window.mouse.add({x:random(-10,10),y:random(-10,10)}), .2);
            drawing();

            if (DEBUG) {
                if (OBJECTonDRAG) {
                    OBJECTonDRAG.x = window.mouse.x;
                    OBJECTonDRAG.y = window.mouse.y;
                }
            }

        }

        stage.render()

        tickFPS.update();
        setTimeout(render, 1000 / 60);
    }
    render();

    updateMouseEvent = function(e) {
        window.mouse = new Vector( e.clientX - stage.x / stage.RETINA, e.clientY - stage.y / stage.RETINA);
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

    if (SWITCH.status) {
        OBJECTonDRAG = undefined
        for(let i=0; i<MAXCONTROLS; i++) {
            Q[i].fillStyle = "red";
        }

        for(let i=0; i<MAXCONTROLS; i++) {
            if (Q[i].hitTest(window.mouse)) {
                    Q[i].x = window.mouse.x;
                    Q[i].y = window.mouse.y;
                    OBJECTonDRAG = Q[i];
            }
        }
    } else {
        for(let i=0; i<MAXCONTROLS; i++) {
            Q[i].fillStyle="rgba(0,0,0,0)";
        }
    }

    drawing();
    draw = true;

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

    var p1 = stroke.in(-2).p;
    var pc = stroke[1].p;
    var p2 = stroke[1].p.med(stroke[2].p);


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

    if (SWITCH.status) {
        layerStroke.clear()
    }

    d = Math.lerp(stroke.prior().d, d, .7);
    stroke.last().d = d;

    let d1 = stroke.prior().d;
    let d2 = stroke.last().d;

    if (SWITCH.status) {
        d1 = 50
        d2 = 200
    }

    function splitCurveAtClosed(at, P) {
        let nc = b.getControlPointOfASegment(P[at-1].t, P[at].t)
        P[at-1].c = nc;
        let nt = b.closestTtoPc(nc);
        let PP2oint = b.getOffsetingDataAt(nt, P.first().d, P.last().d);
        P.splice(at, 0, PP2oint);
    }

    function splitCurveAtMiddle(at, P) {
        let nc = b.getControlPointOfASegment(P[at-1].t, P[at].t)
        P[at-1].c = nc;
        let nt = (P[at-1].t + P[at].t)/2;
        let PP2oint = b.getOffsetingDataAt(nt, P.first().d, P.last().d);
        P.splice(at, 0, PP2oint);
    }

    function splitCurveAtVectorAngle(at, P, vectorAtAnAngle) {

        if ( Math.abs(P[at].n.ang(P[at-1].n))<Math.PI/3 ) return;

        let nc = b.getControlPointOfASegment(P[at-1].t, P[at].t)
        P[at-1].c = nc;
        let nt = b.TtangentToVector( vectorAtAnAngle.per() );

        if(nt == undefined || nt>P[at].t || nt<P[at-1].t) return false;

        let PP2oint = b.getOffsetingDataAt(nt, P.first().d, P.last().d);

        P.splice(at, 0, PP2oint);
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


    if (SWITCH.status) {


        for(let i=0; i<MAXCONTROLS-1; i++) {

            if (i>0 && i<MAXCONTROLS-1) {

                if (Q[i-2]) PP0 = new Vector( Q[i-2] );
                else        PP0 = new Vector( Q[i] );
                let PP1 = new Vector( Q[i-1] );
                let PP2 = new Vector( Q[i]   );
                let PP3 = new Vector( Q[i+1] );
                if (Q[i+2]) PP4 = new Vector( Q[i+2] );
                else        PP4 = new Vector( Q[i] );

                SGN0 = Math.sign( Vector.isLeft(PP0,PP1,PP2) );
                ANG0 = Vector.ang3(PP0,PP1,PP2);

                SGN1 = Math.sign( Vector.isLeft(PP1,PP2,PP3) );
                ANG1 = Vector.ang3(PP1,PP2,PP3);

                SGN2 = Math.sign( Vector.isLeft(PP2,PP3,PP4) );
                ANG2 = Vector.ang3(PP2,PP3,PP4);

                b0  = new QuadBezier(PP0.med(PP1),PP1,PP1.med(PP2));
                t0  = b0.closestTtoPc();
                pt0 = b0.getPointAtT(t0);
                n0  = b0.normalVectorAtT(t0);

                b1  = new QuadBezier(PP1.med(PP2),PP2,PP2.med(PP3));
                t1  = b1.closestTtoPc();
                pt1 = b1.getPointAtT(t1);
                n1  = b1.normalVectorAtT(t1);

                b2  = new QuadBezier(PP2.med(PP3),PP3,PP3.med(PP4));
                t2  = b2.closestTtoPc();
                pt2 = b2.getPointAtT(t2);
                n2  = b2.normalVectorAtT(t2);



                c0 = PP1.add( n0.uni().mul( pt0.distance(PP1)*1.7*SGN0 ) );
                c1 = PP2.add( n1.uni().mul( pt1.distance(PP2)*1.7*SGN1 ) );
                c2 = PP3.add( n2.uni().mul( pt2.distance(PP3)*1.7*SGN2 ) );



                if ( i==1 ) {
                    bc= new QuadBezier( PP1, PP2, c1.med(c2), true );
                } else if (i==MAXCONTROLS-2) {
                    bc= new QuadBezier( c0.med(c1), PP2, PP3, true );
                } else {
                    bc= new QuadBezier( c0.med(c1), PP2, c1.med(c2), true );
                }

                bez( bc.p1, bc.pc,  bc.p2, 1,"red",.5)

                cir( c0.med(c1), 12, 2,"green", .5)
                cir( c1.med(c2), 2, 2,"green", .5)

            }
        }

    } else {

    }
}

function stopDraw(event) {

    updateMouseEvent(event);
    draw = false;

    d = brush.min;
    acc = brush.acc;
    drawing(true); //Last
    if (!SWITCH.status) {
        setTimeout(function() {
            stage.globalAlpha = layerStroke.domElm.style.opacity;
            stage.copy(layerStroke);
            stage.globalAlpha = 1;
            stage.globalCompositeOperation = "source-over";
            layerStroke.clear();
        }, 200)
    }

    if (SWITCH.hitTest(window.mouse)) {
        if (SWITCH.status) {
            SWITCH.fillStyle = "red";
            SWITCH.status = false;
        } else {
            SWITCH.fillStyle = "green";
            SWITCH.status = true;
        }
    }

}

window.ready(init);
