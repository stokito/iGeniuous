var speed = 40; // min=1 max=40
var next = 0; // min=0 max=9
var moving = false;
var touch = false;
var started = false;
var startTime;
var box_dx, box_dy;

var enemies;
var box;
var field, arena;
var enemies_pos = [
	{left: 270, top: 60},
	{left: 300, top: 330},
	{left: 70, top: 320},
	{left: 70, top: 70}
];

$(document).ready(function() {
	field = $("#field");
	arena = $("#arena");
	box = $("#box");
	enemies = $(".enemy");
//    enemies = $("#enemy0");
	newGame();

//        var lidersBox = document.getElementById("liders");
//        VK.api('getHighScores', function(data) {
//            if (data.response) {
//                // data.response is object
//                for (var usk in data.response) {
//                    var userScore = data.response[usk];
//                    lidersBox.innerHTML += userScore.user_name + " " + userScore.score + "<br />";
//                }
//            }
//        });
});


function newGame() {
	window.console.log("new game");
	speed = 1;
	next = 0;
	moving = false;
	touch = false;
	started = false;

	enemies.each(function(index) {
		var enemy = $(this);
		enemy.data({step_x: randomStep(), step_y: randomStep(), dir_x: randomDir(), dir_y: randomDir()});
		setEnemyPos(enemy, enemies_pos[index]);
	});

	setBoxToArenaCenter();
	box.mousedown(mouseDownOnBox);
}

function setBoxToArenaCenter() {
	var center = {
		left: (arena.width() - box.width()) / 2,
		top: (arena.height() - box.height()) / 2
	};
	setEnemyPos(box, center);
}

/**
 * @returns max = 17 min = 3
 */
function randomStep() {
	return Math.round(Math.random() * 14) + 3;
}

/**
 * @returns 1 or -1
 */
function randomDir() {
	return Math.random() < 0.5 ? -1 : 1;
}

function startClock() {
	startTime = $.now();
}

function calcTime() {
	return Math.round($.now() - startTime);
}

function setEnemyPos(enemy, enemyPos) {
	enemy.css(enemyPos);
}

/**
 * Check to see if box is touching enemy
 */
function checkTouching() {
	if (!this)
		return;
	var enemy = $(this);
	var difX = box.position().left - enemy.position().left;
	if (difX > -40 && difX < enemy.width()) {
		var difY = box.position().top - enemy.position().top;
		if (difY > -40 && difY < enemy.height()) {
			window.console.log("fail");
			touch = true;
			reset();
		}
	}
}

function moveEnemy(enemyElement) {
	if (!enemyElement)
		enemyElement = this;
	var enemy = $(enemyElement);
	window.console.log("moveEnemy enemy=" + enemyElement.id);
	var dir_x = enemy.data("dir_x");
	var dir_y = enemy.data("dir_y");

	var step_x = enemy.data("step_x");
	var step_y = enemy.data("step_y");

	var distance_x = (dir_x == -1) ? enemy.position().left : (arena.width() - (enemy.position().left + enemy.width()));
	var distance_y = (dir_y == -1) ? enemy.position().top : (arena.height() - (enemy.position().top + enemy.height()));

	var time_x = distance_x / step_x;
	var time_y = distance_y / step_y;

	var targetPos = {};
	var duration_time;
	if (time_x <= time_y) {  // Куда ближе?
		duration_time = time_x;
		targetPos.left = (dir_x == -1) ? 0 : (arena.width() - enemy.width());
		targetPos.top = enemy.position().top + dir_y * (step_y * time_x);
		enemy.data("dir_x", -dir_x);
	} else {
		duration_time = time_y;
		targetPos.top = (dir_y == -1) ? 0 : (arena.height() - enemy.height());
		targetPos.left = enemy.position().left + dir_x * (step_x * time_y);
		enemy.data("dir_y", -dir_y);
	}

	enemy.animate(targetPos,
		{
			duration: duration_time * 100,
			complete: moveEnemy,
			step: checkTouching
		}
	);
}

function moveEnemies() {
	next++;
	// after each 10 moving increase speed
//    speed = 40;
	if (speed < 40 && (next % 5 == 0)) {
		speed += 10;
	}
	window.console.log("moveEnemies: time=" + calcTime() + " speed=" + speed + " next=" + next);

	enemies.each(function(index) {
		moveEnemy(this);
	});
}

function mouseDownOnBox(e) {
	if (!moving) {
		window.console.log("set moving");
		$(arena).mousemove(mouseMoveOnBox);
		$(arena).mouseup(function (e) {
			stop();
			return false;
		});
		moving = true;
	}
	if (!started) {
		startClock();
		started = true;
		moveEnemies();
	}
	return false;
}

function stop() {
	moving = false;
	box_dx = undefined;
	box_dy = undefined;
	$(arena).unbind();
}

function reset() {
	var finalTime = calcTime();
	stop();
	$(box).unbind();
	enemies.stop();

	$("#message").text('Your score: ' + (finalTime / 1000) + ' sec');
//    VK.api('setUserScore', { score: finalTime });
}

function getBoxPos(mouseEvent) {
	var curX = mouseEvent.pageX - arena.position().left;
	var curY = mouseEvent.pageY - arena.position().top;
	if (box_dx == undefined || box_dy == undefined) {
		box_dx = curX - box.position().left;
		box_dy = curY - box.position().top;
	}
	return {left: curX - box_dx, top: curY - box_dy};
}

/**
 * Mouse move on arena event handler.
 */
function mouseMoveOnBox(mouseEvent) {
	var boxPos = getBoxPos(mouseEvent);
	setEnemyPos(box, boxPos);
	var boxBounds = boxPos;
	boxBounds.right =  boxPos.left + box.width();
	boxBounds.bottom = boxPos.top + box.height();
	if (isBoxTouchedBorders(boxBounds)) {
		reset();
	}
	return false;
}

function isBoxTouchedBorders(boxBounds) {
	return !(boxBounds.left > 0 && boxBounds.top > 0 && boxBounds.right < arena.width() && boxBounds.bottom < arena.height());
}
