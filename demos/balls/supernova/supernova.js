function init() {

	var MAX_PARTICLES = 10000;
	var MAX_VELOCITY = 500;
	var PARTICLE_RADIUS = 6;

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

	let n = MAX_PARTICLES;

	let circles = [];
	for (let i=0; i<n; i++) {
		circles[i] = new Path.Circle({x:randomInt(0,stage.w-40)+20, y:randomInt(0,stage.h-40)+20, radius:PARTICLE_RADIUS});
		if (i==0) {
			circles[i].strokeStyle = `#FF5000`;
			circles[i].lineWidth = 20;
			circles[i].radius = 80;
			circles[i].x = stage.w/2;
			circles[i].y = stage.h/2;
			stage.append(circles[i]);
			//circles[i].zIndex = Infinity;
		} else {
			circles[i].fillStyle = colors[Math.randomInt(0,colors.length-1)];
			circles[i].angle 	= Math.random(0,Math.PI*2);
			circles[i].velocity = MAX_VELOCITY / 8 * 7 * Math.random() + MAX_VELOCITY / 8;
			circles[i].x = stage.w/2;
			circles[i].y = stage.h/2;
			stage.append(circles[i]);
		}
	}

	update = function(c, timeDelta)	{
		var x = c.x;
		var y = c.y;
		var angle = c.angle;
		var velocity = c.velocity;

		// Calculate next position of particle
		var nextX = x + Math.cos(angle) * velocity * (timeDelta / 1000);
		var nextY = y + Math.sin(angle) * velocity * (timeDelta / 1000);

		// If particle is going to move off right side of screen
		if (nextX + PARTICLE_RADIUS * 2 > stage.w)
		{
			// If angle is between 3 o'clock and 6 o'clock
			if ((angle >= 0 && angle < Math.PI / 2))
			{
				angle = Math.PI - angle;
			}
			// If angle is between 12 o'clock and 3 o'clock
			else if (angle > Math.PI / 2 * 3)
			{
				angle = angle - (angle - Math.PI / 2 * 3) * 2
			}
		}

		// If particle is going to move off left side of screen
		if (nextX < 0)
		{
			// If angle is between 6 o'clock and 9 o'clock
			if ((angle > Math.PI / 2 && angle < Math.PI))
			{
				angle = Math.PI - angle;
			}
			// If angle is between 9 o'clock and 12 o'clock
			else if (angle > Math.PI && angle < Math.PI / 2 * 3)
			{
				angle = angle + (Math.PI / 2 * 3 - angle) * 2
			}
		}

		// If particle is going to move off bottom side of screen
		if (nextY + PARTICLE_RADIUS * 2 > stage.h)
		{
			// If angle is between 3 o'clock and 9 o'clock
			if ((angle > 0 && angle < Math.PI))
			{
				angle = Math.PI * 2 - angle;
			}
		}

		// If particle is going to move off top side of screen
		if (nextY < 0)
		{
			// If angle is between 9 o'clock and 3 o'clock
			if ((angle > Math.PI && angle < Math.PI * 2))
			{
				angle = angle - (angle - Math.PI) * 2;
			}
		}

		c.angle = angle;
		c.x = nextX;
		c.y = nextY;

	};

	var lastTime = new Date().getTime();
	render = function(){

		var currentTime = new Date().getTime();
		var timeDelta = currentTime - lastTime;

		let newX = window.mouseX-stage.x/2;
		let newY = window.mouseY-stage.y/2;

		circles[0].x = newX;
		circles[0].y = newY;

		for (let i=1; i<n; i++) {
			update(circles[i],timeDelta);
		}

		lastTime = currentTime;

		stage.render();

		window.requestAnimFrame(render);
		tickFPS.update();
	}
	render();

}
window.ready(init);
