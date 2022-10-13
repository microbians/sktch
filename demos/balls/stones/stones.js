function init() {

	let frac=2;

	let colors = ["#F7A1C0", "#CE6490", "#218380", "#FBB13C", "#FBB13C"];

	let stage = new Layer({
		x:50,
		y:50,
		w:1200,
		h:1200,
		debug:false,
		gridSize:20
	});

	stage.appendTo( document.body );

	// Meter will be attached to `document.body` with all default options.
	let tickFPS = new FPS('fps');

	let n = 100;

    function handleMouseMove(event) {
		window.mouseX = event.clientX;
		window.mouseY = event.clientY;
    }
	window.addEventListener("mousemove", handleMouseMove);

	window.mouseIsDown=false;
	function handleMouseDown(event) {
		window.mouseIsDown=true;
    }
	window.addEventListener("mousedown", handleMouseDown);

	function handleMouseUp(event) {
		window.mouseIsDown=false;
    }
	window.addEventListener("mouseup", handleMouseUp);

	let circles = [];
	for (let i=0; i<n; i++) {
		circles[i] = new Path.Circle({x:randomInt(0,stage.w-40)+20, y:randomInt(0,stage.h-40)+20, radius:random(10,20)});
		if (i==0) {
			circles[i].strokeStyle = `#FF5000`;
			circles[i].lineWidth = 20;
			circles[i].radius = 80;
			circles[i].x = stage.w/2;
			circles[i].y = stage.h/2;
			stage.append(circles[i]);
		} else {
			circles[i].fillStyle = colors[Math.randomInt(0,colors.length-1)];
			circles[i].vx= random(1,-1)/5;
			circles[i].vy= random(1,-1)/5;
			circles[i].dx = circles[i].x;
			circles[i].dy = circles[i].y;
			stage.append(circles[i]);
		}
	}

	function addonemore() {
		let xtrad = random(15,100);
		let a=Math.random(0,Math.PI*2);
		let vx=Math.cos(a);
		let vy=Math.sin(a);
		circles[n] = new Path.Circle({x:circles[0].x+(circles[0].radius+xtrad)*vx, y:circles[0].y+(circles[0].radius+xtrad)*vy, radius:1});

		circles[n].finalradius=random(5,15)+xtrad/20;

		circles[n].vx= vx*(circles[n].finalradius+xtrad)/20;
		circles[n].vy= vy*(circles[n].finalradius+xtrad)/20;

		if (random(0,1000)<10) {
			circles[n].finalradius+=20;
		}

		circles[n].fillStyle = colors[Math.randomInt(0,colors.length-1)];
		circles[n].dx = circles[n].x;
		circles[n].dy = circles[n].y;
		stage.append(circles[n]);
		n++;
	}

	updateCircles = function() {
		for (let i=1; i<n; i++) {

			if (!circles[i].boundingBox.isIntersect({min_x:-100,min_y:-100,max_x:stage.w+100,max_y:stage.w+100})) {
				continue;
			}

			if (circles[i].finalradius!=undefined){
				circles[i].radius=(circles[i].radius*.7+circles[i].finalradius*.3);
			}

			let curEl = circles[i];

			circles[i].x = circles[i].x + circles[i].vx;
			circles[i].y = circles[i].y + circles[i].vy;

			circles[i].vx = circles[i].vx*0.85;
			circles[i].vy = circles[i].vy*0.85;

			if (Math.abs(circles[i].vx)<0.1) circles[i].vx=0;
			if (Math.abs(circles[i].vy)<0.1) circles[i].vy=0;

			let minCellX = stage.grid.getCellX(curEl.boundingBox.min_x);
			let minCellY = stage.grid.getCellY(curEl.boundingBox.min_y);
			let maxCellX = stage.grid.getCellX(curEl.boundingBox.max_x);
			let maxCellY = stage.grid.getCellY(curEl.boundingBox.max_y);

			let elementsInCell=new Set();
			for (let x=minCellX; x<=maxCellX; x++) {
				for (let y=minCellY; y<=maxCellY; y++) {
					let c = stage.grid.getCellIndexWithCellPosition(x,y);
					//elementsInCell = elementsInCell.concat(stage.grid.cells[c].elements);
					for (let e of stage.grid.cells[c].elements) {
						elementsInCell.add( e );
					}
				}
			}

			for (let e of elementsInCell) {
				if ( e!=curEl && collideCircle(curEl,e) ) {
					let dx=curEl.x-e.x;
					let dy=curEl.y-e.y;

					let d = Math.sqrt(dx*dx + dy*dy);

					let nx = dx / d * 0.5;
					let ny = dy / d * 0.5;

					let m1 = Math.pow(curEl.radius,2);
					let m2 = Math.pow(e.radius,2);


					let p = 2 * (e.vx*nx + e.vy * ny - curEl.vx * nx - curEl.vy * ny) / (m1+m2);

					e.vx += -p*m1*nx*2;
					e.vy += -p*m1*ny*2;
					curEl.vx += p*m2*nx*2;
					curEl.vy += p*m2*ny*2;
					resolveCircle(curEl, e);
				}
			}
		}

	}

	collideCircle = function(circle1, circle2) {

	        /* first we get the x and y distance between the two circles. */
	        let distance_x = circle1.x - circle2.x;
	        let distance_y = circle1.y - circle2.y;
	        /* Then we get the sum of their radii. */
			let l1=0;
			let l2=0;
	        let radii_sum  = circle1.radius+l1 + circle2.radius+l2;

	        /* Then we test to see if the square of their distance is greater than the
	        square of their radii. If it is, then there is no collision. If it isn't,
	        then we have a collision. */
	        if (distance_x * distance_x + distance_y * distance_y <= radii_sum * radii_sum) return true;

	        return false;

	}

	resolveCircle = function(c1, c2) {

	        let distance_x = c1.x - c2.x;
	        let distance_y = c1.y - c2.y;
	        let radii_sum  = c1.radius + c2.radius;
	        let length = Math.sqrt(distance_x * distance_x + distance_y * distance_y) || 1;

			if (length>1) {

	        	let unit_x = distance_x / length;
	        	let unit_y = distance_y / length;

	        	c1.x = c2.x + (radii_sum + 1) * unit_x;
	        	c1.y = c2.y + (radii_sum + 1) * unit_y;

				c1.vx = c1.vx * 1.02;
				c1.vy = c1.vy * 1.02;
				c2.vx = c2.vx * 1.02;
				c2.vy = c2.vy * 1.02;
			}

	}
	let frame=0;
	let oldCircles=[];
	render = function(){

		if(window.mouseIsDown){
			circles[0].radius=circles[0].radius*.9;
			for(i=0;i<50;i++) {
				addonemore();
			}
			document.getElementById("debug").innerHTML = `Total= ${n} particles.`;
		}

		circles[0].radius=circles[0].radius*1.1;
		if (circles[0].radius > 80) circles[0].radius=80;

		let newX = window.mouseX-stage.x/2;
		let newY = window.mouseY-stage.y/2;

		circles[0].vx = newX-circles[0].x;
		circles[0].vy = newY-circles[0].y;
		circles[0].x = newX;
		circles[0].y = newY;

		updateCircles();

		frame++;

		stage.render();;

		window.requestAnimFrame(render);
		tickFPS.update();
	}
	render();

}
window.ready(init);
