/*//////////////////////////////////////////////////////////////////////////////
 SKTCH.js - Superpopulation Test

 @license Copyright (c) since 2020, Gabriel Suchowolski (microbians) / All Rights Reserved.
 Available via the MIT or new BSD license.
//////////////////////////////////////////////////////////////////////////////*/

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

	let n = 20000;

	let circles = [];
	for (let i=0; i<n; i++) {
		circles[i] = new Path.Circle({x:randomInt(0,stage.w-40)+20, y:randomInt(0,stage.h-40)+20, radius:4});
		if (i==0) {
			circles[i].strokeStyle = `#FF5000`;
			circles[i].lineWidth = 0;
			circles[i].fillStyle = `#FF5000`;
			circles[i].radius = 80;
			circles[i].x = stage.w/2;
			circles[i].y = stage.h/2;
			circles[i].zIndex=0;
			stage.append(circles[i]);

		} else {
			circles[i].fillStyle = colors[Math.randomInt(0,colors.length-1)];
			circles[i].vx = 0;
			circles[i].vy = 0;
			circles[i].vtime = 0;
			stage.append(circles[i]);

		}
	}

	render = function(){
		let i=0;
		circles[i].x = window.mouseX-stage.x/2;
		circles[i].y = window.mouseY-stage.y/2;

		stage.render();

		window.requestAnimFrame(render);
		tickFPS.update();
	}
	render();
}

window.ready(init);
