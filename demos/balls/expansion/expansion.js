function init() {

	colors = ["#F7A1C0", "#CE6490", "#218380", "#FBB13C", "#FBB13C"];

	let stage = new Layer({
		x:50,
		y:50,
		w:1200,
		h:1200,
		gridSize:20,
		debug:true
	});

	stage.appendTo( document.body );

    window.addEventListener("mousemove", handleMouseMove);
    function handleMouseMove(event) {
		window.mouseX = event.clientX;
		window.mouseY = event.clientY;
    }

	// Meter will be attached to `document.body` with all default options.
	let tickFPS = new FPS('fps');

	let n = 10000;

	let circles = [];
	for (let i=0; i<n; i++) {
		circles[i] = new Path.Circle({x:randomInt(0,stage.w-40)+20, y:randomInt(0,stage.h-40)+20, radius:random(2,5)});
		if (i==0) {
			circles[i].strokeStyle = `#FF5000`;
			circles[i].lineWidth = 20;
			circles[i].radius = 80;
			circles[i].x = stage.w/2;
			circles[i].y = stage.h/2;
			stage.append(circles[i]);
			circles[i].zIndex = Infinity;
		} else {
			circles[i].fillStyle = colors[Math.randomInt(0,colors.length-1)];
			circles[i].vx= random(2,-2)/2;
			circles[i].vy= random(2,-2)/2;
			stage.append(circles[i]);

		}
	}

	let frame=0;
	let oldCircles=[];
	render = function(){
		let newX = window.mouseX-stage.x/2;
		let newY = window.mouseY-stage.y/2;

		circles[0].x = newX;
		circles[0].y = newY;

		for (let i=1; i<n; i++) {
				circles[i].vx += random(1,-1)/10;
				circles[i].vy += random(1,-1)/10;
				circles[i].x += circles[i].vx;
				circles[i].y += circles[i].vy;
		}

		stage.render();

		window.requestAnimFrame(render);
		tickFPS.update();
	}
	render();

}
window.ready(init);
