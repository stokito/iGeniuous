var speed = 100; // min=1 max=40
var next = 0; // min=0 max=9
var moving = false;
var touch = false;
var started = false;
var startTime;
var box_dx, box_dy;

var box_position;

var curentStepEnemy;
var curentStepEnemyPos = {};

var arenaPosition;

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
	speed = 100;
	next = 0;
	moving = false;
	touch = false;
	started = false;

	enemies.each(function(index) {
		var enemy = $(this);
		enemy.data({step_x: randomStep(), step_y: randomStep(), dir_x: randomDir(), dir_y: randomDir()});
		setEnemyPos(enemy, enemies_pos[index]);
	});

	arenaPosition = arena.position();

	setBoxToArenaCenter();
	box.mousedown(mouseDownOnBox);
}

function setBoxToArenaCenter() {
	var center = {
		left: (400 - 40) / 2,
		top: (400 - 40) / 2
	};
	setEnemyPos(box, center);
	box_position = center;
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
function checkTouching(now, fx) {
//	window.console.log(fx.prop + " " + fx.now + " " + this.id);
	if (!curentStepEnemy)
		curentStepEnemy = fx.element;
	if (fx.prop == "left") {
		curentStepEnemyPos.left = fx.now;
	} else if (fx.prop == "top") {
		curentStepEnemyPos.top = fx.now;
	}
	if ((curentStepEnemyPos.left != undefined) && (curentStepEnemyPos.top != undefined)) {
		var enemy = $(this);
		var difX = box_position.left - curentStepEnemyPos.left;
		if (difX > -40 && difX < enemy.width()) {
			var difY = box_position.top - curentStepEnemyPos.top;
			if (difY > -40 && difY < enemy.height()) {
				window.console.log("fail");
				touch = true;
				reset();
			}
		}
		curentStepEnemyPos = {};	
	}
}

function moveEnemy(enemyElement) {
	if (!enemyElement)
		enemyElement = this;
	var enemy = $(enemyElement);
	var dir_x = enemy.data("dir_x");
	var dir_y = enemy.data("dir_y");

	var step_x = randomStep();
	var step_y = randomStep();
	
	var enemyPosition = enemy.position();
	var enemyWidth = enemy.width();
	var enemyHeight = enemy.height();

	var distance_x = (dir_x == -1) ? enemyPosition.left : (400 - (enemyPosition.left + enemyWidth));
	var distance_y = (dir_y == -1) ? enemyPosition.top : (400 - (enemyPosition.top + enemyHeight));

	var time_x = distance_x / step_x;
	var time_y = distance_y / step_y;

	var targetPos = {};
	var duration_time;
	if (time_x <= time_y) {  // Куда ближе?
		duration_time = time_x;
		targetPos.left = (dir_x == -1) ? 0 : (400 - enemyWidth);
		targetPos.top = enemyPosition.top + dir_y * (step_y * time_x);
		enemy.data("dir_x", -dir_x);
	} else {
		duration_time = time_y;
		targetPos.top = (dir_y == -1) ? 0 : (400 - enemyHeight);
		targetPos.left = enemyPosition.left + dir_x * (step_x * time_y);
		enemy.data("dir_y", -dir_y);
	}

	enemy.animate(targetPos,
		{
			duration: duration_time * speed,
			complete: moveEnemy,
			step: checkTouching
		}
	);

	if (speed > 20) {
		speed -= 5;
	}
}


function mouseDownOnBox(e) {
	if (!moving) {
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
		enemies.each(function(index) {
			moveEnemy(this);
		});
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
	var curX = mouseEvent.pageX - arenaPosition.left;
	var curY = mouseEvent.pageY - arenaPosition.top;
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
	box_position = boxPos;
	var boxBounds = boxPos;
	boxBounds.right =  boxPos.left + 40;
	boxBounds.bottom = boxPos.top + 40;
	if (isBoxTouchedBorders(boxBounds)) {
		reset();
	}
	return false;
}

function isBoxTouchedBorders(boxBounds) {
	return !(boxBounds.left > 0 && boxBounds.top > 0 && boxBounds.right < 400 && boxBounds.bottom < 400);
}
