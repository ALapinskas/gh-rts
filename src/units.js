import { CONST, DrawImageObject } from "jsge";
import { utils } from "jsge";

const countDistance = utils.countDistance, 
	angle_2points = utils.angle_2points,
	randomFromArray = utils.randomFromArray;

import { PEASANT, GAME_EVENTS, GAME_UNITS, BUILDING_STATE, KNIGHT, GOBLIN_TORCH, ATLAS, GOBLIN_TOWER, GAME_OBJECTS, GAME_AUDIO_TYPES, UNIT_TACTIC, ARCHER } from "./const.js";
import { Vector } from "jsge/src/base/2d/Primitives.js";

class BaseEntity extends DrawImageObject {
	/**
	 * @type {undefined | DrawObjectFactory} 
	 */
	#draw;
	/**
	 * @type {undefined | null | DrawRectObject}
	 */

	#frame;

	/**
	 * @type {boolean}
	 */
	#isSelected = false;
	#isShowHealth = false;
	#healthMax;
	#healthLeft;
	#healthBarMaxWidth;
	#healthBar;
	constructor(mapX, mapY, width, height, imageKey, imageIndex = 0, drawImageFactory, isShowHealth, health, boundaries = null, spacing = 0, margin = 0) {
		super(mapX, mapY, width, height, imageKey, imageIndex, boundaries, null, spacing, margin);
		this.#draw = drawImageFactory;
		this.#healthMax = health;
		this.#healthLeft = health;
		this.#isShowHealth = isShowHealth;
		if (this.#isShowHealth) {
			this.#healthBarMaxWidth =  width / 3;
			this.#healthBar = this.#draw.rect(mapX - width/5, mapY - height/4, width / 3, 4, "rgba(255, 0, 0, 0.77)");
			this.#healthBar.sortIndex = 5;
		}
		console.log("set entity with key: ", imageKey, " health: ", health);
	}

	get health() {
		return this.#healthLeft;
	}

	set health(value) {
		this.#healthLeft = value;
	}
	get isSelected() {
		return this.#isSelected;
	}

	set isSelected(value) {
		this.#isSelected = value;
		if(value === true) {
			if (this.circleBoundaries) {
				this.#frame = this.#draw.circle(this.x, this.y, this.circleBoundaries.r, "rgba(255,255,255,0.2)");
			} else {
				this.#frame = this.#draw.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height, "rgba(255,255,255,0.2)");
			}
		} else if (this.#frame) {
			console.log("remove frame");
			this.#frame.destroy();
		}
	}

	set xPos (newCoordX) {
		this.x = newCoordX;
		if (this.#isShowHealth) {
			this.#healthBar.x = newCoordX - this.width/5;
		}
		if (this.isSelected) {
			if (this.circleBoundaries) {
				this.frame.x = newCoordX;
			} else {
				this.frame.x = newCoordX - this.width/2;
			}
		}
	}

	set yPos (newCoordY) {
		this.y = newCoordY;
		if (this.#isShowHealth) {
			this.#healthBar.y = newCoordY - this.height/4;
		}
		if (this.isSelected) {
			if (this.circleBoundaries) {
				this.frame.y = newCoordY;
			} else {
				this.frame.y = newCoordY - this.height/2;
			}
		}
	}

	get frame() {
		return this.#frame;
	}

	get healthBar() {
		return this.#healthBar;
	}

	get draw() {
		return this.#draw;
	}

	reduceHealth(damage) {
		const healthLeft = this.health - damage,
			healthLeftPers = healthLeft > 0 ? healthLeft / this.#healthMax : 0;
		this.health = healthLeft;
		if (this.#isShowHealth) {
			this.#healthBar.width = healthLeftPers * this.#healthBarMaxWidth;
		}
		console.log("opponent health: ", this.health);
	}
}

class BaseBuilding extends BaseEntity {
	#PROGRESS_STEP = 50;
	#unitBuildProgress = 0;
	#unitBuildDuration = 0;
	#selfBuildingDuration = 0;
	/**
	 * 0 - 1
	 */
	#selfBuildingProgress;
	#eventsAggregator;
	#unitProgressTimer;
	#selfProgressTimer;

	#progressLine;

    #state = BUILDING_STATE.BUILDING_SELF;
	constructor(mapX, mapY, width, height, entityKey, imageIndex = 0, drawFactory, isShowHealth, eventsAggregator, isBuildDone = true) {
		const imageKey = GAME_UNITS[entityKey].atlasKey ? GAME_UNITS[entityKey].atlasKey : GAME_UNITS[entityKey].name;
		console.log("base building set health: ", GAME_UNITS[entityKey].health);
		super(mapX, mapY, width, height, imageKey, imageIndex, drawFactory, isShowHealth, GAME_UNITS[entityKey].health);
		this.#eventsAggregator = eventsAggregator;
		this.#selfBuildingDuration = GAME_UNITS[entityKey].duration;
		
		if (isBuildDone === false) {
			this.#startSelfBuilding();
			this.#selfBuildingProgress = 0;
		} else {
			this.#selfBuildingProgress = 100;
		}
	}

	get isBuildingUnit() {
		return !!this.#unitProgressTimer;
	}

    get state() {
        return this.#state;
    }

	buildUnit = (unitType) => {
		console.log("build unit: ", unitType);
        this.#state = BUILDING_STATE.BUILDING_UNIT;
		switch (unitType) {
			case GAME_UNITS.PEASANT.name:
					this.#unitBuildDuration = GAME_UNITS.PEASANT.duration;
					this.#createProgressLine();
					this.#startBuildUnitProgress();
				break;
		}
	}

	#createProgressLine = () => {
		
		this.#progressLine = document.createElement("div"),
		console.log("create progress line");
		this.#progressLine.style.width = 0 + "px";
		this.#progressLine.style.height = "2px";
		this.#progressLine.style.backgroundColor = "#666";
		this.#progressLine.style.position = "fixed";
		this.#progressLine.style.top = 28 + "px";
		this.#progressLine.style.left = 0 + "px";
		document.body.appendChild(this.#progressLine);
	}

	#startBuildUnitProgress = () => {
		console.log("start build progress")
		if (this.#unitProgressTimer) {
			console.log("already building");
			return;
		}

		const duration = this.#selfBuildingDuration,
			windowWidth = document.body.offsetWidth,
			step = this.#PROGRESS_STEP,
			stepWidth = windowWidth / duration * 100;

		let currentWidth = stepWidth;

		this.#unitProgressTimer = setInterval(() => {
			if (this.#unitBuildProgress < duration) {
				this.#unitBuildProgress += step;
				currentWidth += stepWidth;
				this.#progressLine.style.width = currentWidth + "px";
				console.log("progress build");
			} else {
				console.log("progress done");
				clearInterval(this.#unitProgressTimer);
				this.#unitProgressTimer = null;
				this.#unitBuildProgress = 0;
				this.#progressLine.style.width = 0 + "px";
				this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.PEASANT_BUILT, {detail: this}));
                this.#state = BUILDING_STATE.READY;
			}
		}, this.#PROGRESS_STEP);
	}

	#startSelfBuilding = () => {
		console.log("start self building");
		const duration = this.#selfBuildingDuration,
			windowWidth = document.body.offsetWidth,
			step = this.#PROGRESS_STEP,
			stepWidth = windowWidth / duration * 100;

		let currentWidth = stepWidth;

		this.#selfProgressTimer = setInterval(() => {
			if (this.#selfBuildingProgress < duration) {
				this.#selfBuildingProgress += step;
				currentWidth += stepWidth;
				//this.#progressLine.style.width = currentWidth + "px";
				console.log("progress build");
			} else {
				console.log("progress done");
				clearInterval(this.#selfProgressTimer);
				this.#selfProgressTimer = null;
				this.#selfBuildingProgress = 0;
				//this.#progressLine.style.width = 0 + "px";
				this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.BUILDING_DONE, 
					{
						detail: this
					}
				));
                this.#state = BUILDING_STATE.READY;
			}
		}, this.#PROGRESS_STEP);
	}

	die() {
		if (this.frame) {
			this.frame.destroy();
		}
		if (this.healthBar) {
			this.healthBar.destroy();
		}
		this.destroy();
	}
}

class UnitGoblinHouse extends BaseBuilding {
	constructor(mapX, mapY, drawImageFactory, isShowHealth) {
		console.log("set g house, with key: ", GAME_UNITS.GOBLIN_HOUSE.name);
		super(mapX, mapY, 192, 192, GAME_UNITS.GOBLIN_HOUSE.name, 20, drawImageFactory, isShowHealth);
	}
	die = () => {
		const grave = this.draw.image(this.x, this.y, 192, 192, "192x192", 21, "rgba(0, 0, 0, 1)");
		grave.sortIndex = 1;
		this.imageIndex = 22;
		super.die();
	}
}

class UnitGoblinTower extends BaseBuilding {
	constructor(mapX, mapY, drawImageFactory, isShowHealth) {
		console.log("set g house, with key: ", GAME_UNITS.GOBLIN_TOWER.name);
		super(mapX, mapY, 192, 192, GAME_UNITS.GOBLIN_TOWER.name, 24, drawImageFactory, isShowHealth);
		this.addAnimation(GOBLIN_TOWER.ANIMATIONS.IDLE, [{ duration:200, id:24 }, { duration:200, id:25 }, { duration:200, id:26 }, { duration:200, id:27 }], true);
	}
	activateIdle = () => {;
		this.emit(GOBLIN_TOWER.ANIMATIONS.IDLE);
	}

	die = () => {
		const grave = this.draw.image(this.x, this.y, 192, 192, "192x192", 22, "rgba(0, 0, 0, 1)");
		grave.sortIndex = 1;
		this.imageIndex = 22;
		super.die();
	}
}

class BaseUnit extends BaseEntity {

	#targetPoint;
	#unitTactic = UNIT_TACTIC.AGGRESSIVE;
	constructor(x, y, w, h, entityKey, imageIndex, drawFactory, isShowHealth, boundaries, spacing, margin){
		const imageKey = GAME_UNITS[entityKey].atlasKey ? GAME_UNITS[entityKey].atlasKey : GAME_UNITS[entityKey].name;
		super(x, y, w, h, imageKey, imageIndex, drawFactory, isShowHealth, GAME_UNITS[entityKey].health, boundaries, spacing, margin);
	}

	die() {
		const grave = this.draw.image(this.x, this.y, 192, 192, GAME_OBJECTS.SKILL.atlasKey, 160, "rgba(0, 0, 0, 1)");
		grave.sortIndex = 1;
		grave.addAnimation("graveAppear", [160, 161, 162, 163, 164, 165, 168, 169, 170, 171, 172, 173, 174]);
		grave.emit("graveAppear");
		
		if (this.frame) {
			this.frame.destroy();
		}
		if (this.healthBar) {
			this.healthBar.destroy();
		}
		this.destroy();
	}

	get unitTactic() {
		return this.#unitTactic;
	}

	set unitTactic(value) {
		this.#unitTactic = value;
	}

	set targetPoint(tp) {
		this.#targetPoint = tp;
	}

	get targetPoint() {
		return this.#targetPoint;
	}

	countNextStep = () => {
		const x = this.x,
			y = this.y,
			tX = this.#targetPoint[0],
			tY = this.#targetPoint[1],
			forceToUse = 0.4,//this.#moveSpeed,
            direction = angle_2points(x, y, tX, tY),
            newCoordX = x + forceToUse * Math.cos(direction),
            newCoordY = y + forceToUse * Math.sin(direction);
		
		return {x:newCoordX, y:newCoordY};
	}
}

class UnitPeasant extends BaseUnit {
	/**
	 * @type {string}
	 */
	#activeAction;
	#targetTree;
	#grabGoldmine;
	#closestTownCenter;
	#hasGold;
	#hasWood;
	#woodAmount = 0;
	#buildingType;
	#eventsAggregator;

	#goldBag = null;
	#woodBunch = null;
	#audio;
	constructor(mapX, mapY, closestTownCenter, drawFactory, isShowHealth, eventsAggregator, audio) {
		super(mapX, mapY, 192, 192, GAME_UNITS.PEASANT.name, 272, drawFactory, isShowHealth, { r:30 });
		this.addAnimation(PEASANT.ANIMATIONS.IDLE_RIGHT, [272, 273, 274, 275, 276, 277], true);
		this.addAnimation(PEASANT.ANIMATIONS.IDLE_LEFT, [285, 284, 283, 282, 281, 280], true);
		this.addAnimation(PEASANT.ANIMATIONS.MOVE_RIGHT, [288, 289, 290, 291, 292, 293], true);
		this.addAnimation(PEASANT.ANIMATIONS.MOVE_LEFT, [301, 300, 299, 298, 297, 296], true);

		this.addAnimation(PEASANT.ANIMATIONS.BUILD_RIGHT, [304, 305, 306, 307, 308, 309], true);
		this.addAnimation(PEASANT.ANIMATIONS.BUILD_LEFT, [317, 316, 315, 314, 313, 312], true);

		this.addAnimation(PEASANT.ANIMATIONS.CHOP_RIGHT, [320, 321, 322, 323, 324, 325], true);
		this.addAnimation(PEASANT.ANIMATIONS.CHOP_LEFT, [333, 332, 331, 330, 329, 328], true);
		
		this.addAnimation(PEASANT.ANIMATIONS.CARRY_IDLE_RIGHT, [336, 337, 338, 339, 340, 341], true);
		this.addAnimation(PEASANT.ANIMATIONS.CARRY_IDLE_LEFT, [349, 348, 347, 346, 345, 344], true);
		this.addAnimation(PEASANT.ANIMATIONS.CARRY_RIGHT, [352, 353, 354, 355, 356, 357], true);
		this.addAnimation(PEASANT.ANIMATIONS.CARRY_LEFT, [365, 364, 363, 362, 361, 360], true);


		this.#closestTownCenter = closestTownCenter;
		this.#eventsAggregator = eventsAggregator;
		this.#audio = audio;
		this.sortIndex = 2;

		this.unitTactic = UNIT_TACTIC.RUN_AWAY;
	}

	get activeAction() {
		return this.#activeAction;
	}

	get targetTree() {
		return this.#targetTree;
	}

	get buildingType() {
		return this.#buildingType;
	}

	activateGrabGold = (mine) => {
		console.log("start collecting gold");
		this.#grabGoldmine = mine;
		this.#activeAction = PEASANT.ACTIONS.DRAG_GOLD;
	}

	activateIdle = (isClicked = false) => {
		this.#activeAction = PEASANT.ACTIONS.IDLE;
		const activeAnimation = this.activeAnimation;
		if (activeAnimation) {
			this.stopRepeatedAnimation(activeAnimation);
		}
		
		if (this.#hasGold || this.#hasWood) {
			this.emit(PEASANT.ANIMATIONS.CARRY_IDLE_RIGHT);
		} else {
			this.emit(PEASANT.ANIMATIONS.IDLE_RIGHT);
		}
		if (isClicked) {
			randomFromArray(this.#audio.get(GAME_AUDIO_TYPES.WHAT)).play();
		}
	}

	activateDragTree = (tree) => {
		this.#activeAction = PEASANT.ACTIONS.DRAG_WOOD;
		if (tree) {
			this.#targetTree = tree;
		}
	}

	activateChopTree = () => {
		this.#activeAction = PEASANT.ACTIONS.CHOP_WOOD;
	}

	askForClosestTree = () => {
		this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.REQUEST_FOR_CLOSEST_TREE, {
			detail: {peasant: this, tree: this.#targetTree}}));
	}

	dragWood = () => {
		if (this.#hasWood) {
			// move to the TownCenter
			const tX = this.#closestTownCenter.x,
				tY = this.#closestTownCenter.y;
			if (countDistance(this, {x:tX, y: tY}) < 25) {
				// reached
				this.#removeWoodBunch();
			} else {
				this.targetPoint = [tX, tY];
				this.stepMoveWith();
			}
		} else {
			// move to the Gold mine
			const tX = this.#targetTree.x,
				tY = this.#targetTree.y;

			if (this.#targetTree.health <= 0) {
				console.log("stop drag tree");
				this.activateIdle();
				this.askForClosestTree();
			} else if (countDistance(this, {x:tX, y: tY}) < 8) {
				// reached
				this.activateChopTree();
			} else {
				this.targetPoint = [tX, tY];
				this.stepMoveWith();
			}
		}
	}
 
	grabGold = () => {
		if (this.#hasGold) {
			// move to the TownCenter
			const tX = this.#closestTownCenter.x,
				tY = this.#closestTownCenter.y;
			if (countDistance(this, {x:tX, y: tY}) < 25) {
				this.#removeGoldBunch();
			} else {
				this.targetPoint = [tX, tY];
				this.stepMoveWith();
			}
		} else {
			// move to the Gold mine
			const tX = this.#grabGoldmine.x,
				tY = this.#grabGoldmine.y;
			if (this.#grabGoldmine.goldAmount <= 0) {
				console.log("gold mine is empty");
				this.activateIdle();
			} else if (countDistance(this, {x:tX, y: tY}) < 8) {
				this.#createGoldBunch();
			} else {
				this.targetPoint = [tX, tY];
				this.stepMoveWith();
			}
		}
	}

	chopTree = () => {
		if (this.#woodAmount < 10) {
			this.#woodAmount = Math.round((this.#woodAmount + .05) * 100) / 100;
			this.#targetTree.health = Math.round((this.#targetTree.health - .05) * 100) / 100;

			const direction = angle_2points(this.x, this.y, this.#targetTree.x, this.#targetTree.y);

			if (direction >= -Math.PI/2 && direction <= Math.PI/2) {
				//console.log("chop right");
				if (this.activeAnimation !== PEASANT.ANIMATIONS.CHOP_RIGHT) {
					this.emit(PEASANT.ANIMATIONS.CHOP_RIGHT);
				}
			} else if (direction > Math.PI/2 || direction < -Math.PI/2) {
				//console.log("chop left");
				if (this.activeAnimation !== PEASANT.ANIMATIONS.CHOP_LEFT) {
					this.emit(PEASANT.ANIMATIONS.CHOP_LEFT);
				}
			}
		} else {
			console.log(this.#woodAmount);
			this.#createWoodBunch();
		}
	}

	stepMoveWith = () => {
		const x = this.x,
			y = this.y,
			tX = this.targetPoint[0],
			tY = this.targetPoint[1],
			hasGold = this.#hasGold || this.#hasWood;

		const forceToUse = 0.4,//this.#moveSpeed,
            direction = angle_2points(x, y, tX, tY),
            newCoordX = x + forceToUse * Math.cos(direction),
            newCoordY = y + forceToUse * Math.sin(direction);
            
		if (direction >= -Math.PI/2 && direction <= Math.PI/2) {
			//console.log("move right");
			if (hasGold && this.activeAnimation !== PEASANT.ANIMATIONS.CARRY_RIGHT) {
				this.emit(PEASANT.ANIMATIONS.CARRY_RIGHT);
			} else if (!hasGold && this.activeAnimation !== PEASANT.ANIMATIONS.MOVE_RIGHT)
				this.emit(PEASANT.ANIMATIONS.MOVE_RIGHT);
		} else if (direction > Math.PI/2 || direction < -Math.PI/2) {
			//console.log("move left");
			if (hasGold && this.activeAnimation !== PEASANT.ANIMATIONS.CARRY_LEFT) {
				this.emit(PEASANT.ANIMATIONS.CARRY_LEFT);
			} else if (!hasGold && this.activeAnimation !== PEASANT.ANIMATIONS.MOVE_LEFT)
				this.emit(PEASANT.ANIMATIONS.MOVE_LEFT);
		} else {
			console.log("unrecognized move to ", direction);
		}
		this.xPos = newCoordX;
		this.yPos = newCoordY;
		
		if (this.#hasGold) {
			this.#goldBag.x = newCoordX;
			this.#goldBag.y = newCoordY - this.height/4;
		}
		if (this.#hasWood) {
			this.#woodBunch.x = newCoordX;
			this.#woodBunch.y = newCoordY - this.height/4;
		}
	}

	stepMove = () => {
		const x = this.x,
			y = this.y,
			tX = this.targetPoint[0],
			tY = this.targetPoint[1];
		if (countDistance(this, {x:tX, y: tY}) < 5) {
			console.log("reached");
			this.activateIdle();
		} else {
			const forceToUse = 0.4,//this.#moveSpeed,
            direction = angle_2points(x, y, tX, tY),
            newCoordX = x + forceToUse * Math.cos(direction),
            newCoordY = y + forceToUse * Math.sin(direction);
            
			if (direction >= -Math.PI/2 && direction <= Math.PI/2) {
				//console.log("move right");
				if (this.activeAnimation !== PEASANT.ANIMATIONS.MOVE_RIGHT)
					this.emit(PEASANT.ANIMATIONS.MOVE_RIGHT);
			} else if (direction > Math.PI/2 || direction < -Math.PI/2) {
				//console.log("move left");
				if (this.activeAnimation !== PEASANT.ANIMATIONS.MOVE_LEFT)
					this.emit(PEASANT.ANIMATIONS.MOVE_LEFT);
			} else {
				console.log("unrecognized move to ", direction);
			}
        	this.xPos = newCoordX;
        	this.yPos = newCoordY;
		}
	}

	#createGoldBunch = () => {
		// reached
		this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.GOLD_GRAB, { detail: {peasantId: this.id} }));
	}

	#removeGoldBunch = () => {
		// reached
		this.#hasGold = false;
		this.#goldBag.destroy();
		//console.log("+ 10 gold milord!!");
		this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.GOLD_MINED, {
			detail: {peasantId: this.id, amount:10}
		 }));
	}

	#createWoodBunch = () => {
		this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.WOOD_GRAB, {
			detail: {peasantId: this.id }
		}));
	}

	#removeWoodBunch = () => {
		this.#hasWood = false;
		this.#woodAmount = 0;
		this.#woodBunch.destroy();
		//console.log("+ 10 gold milord!!");
		this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.WOOD_MINED, {
			detail: {peasantId: this.id, amount:10}
		 }));
	}

	activateStartBuilding = (targetX, targetY, type) => {
		this.#activeAction = PEASANT.ACTIONS.BUILD;
		this.targetPoint = [targetX, targetY];
		this.#buildingType = type;
	}

	activateMoveToTargetPoint = (targetX, targetY, saySomething = false) => {
		this.#activeAction = PEASANT.ACTIONS.MOVE;
		this.targetPoint = [targetX, targetY];
		if (saySomething && this.#audio.has(GAME_AUDIO_TYPES.YES)) {
			randomFromArray(this.#audio.get(GAME_AUDIO_TYPES.YES)).play();
		}
	}

	addGoldBag = (goldBag) => {
		this.#hasGold = true;
		this.#goldBag = goldBag;
		this.#grabGoldmine.goldAmount -= 10;
		if (this.#grabGoldmine.goldAmount <= 0) {
			this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.GOLD_MINE_EMPTY, {
				detail: this.#grabGoldmine}));
		}
	}

	addWoodBunch = (woodBunch) => {
		this.#hasWood = true;
		this.#woodBunch = woodBunch;
		this.activateDragTree();
		if (this.#targetTree.health <= 0) {
			this.#eventsAggregator.dispatchEvent(new CustomEvent(GAME_EVENTS.TREE_EMPTY, {
				detail: this.#targetTree }));
		}
	}

	die() {
		this.activateIdle();
		super.die();
	} 
}

class UnitKnight extends BaseUnit {
	/**
	 * @type {string}
	 */
	#activeAction;
	#buildingType;
	#eventsAggregator;
	#attackInterval;
	#audio;
	#audioInProgress;
	constructor(mapX, mapY, drawFactory, isShowHealth, eventsAggregator, audio) {
		super(mapX, mapY, 192, 192, GAME_UNITS.KNIGHT.name, 0, drawFactory, isShowHealth, { r: 30 });
		this.addAnimation(KNIGHT.ANIMATIONS.IDLE_RIGHT, [0, 1, 2, 3, 4, 5], true);
		this.addAnimation(KNIGHT.ANIMATIONS.MOVE_RIGHT, [8, 9, 10, 11, 12, 13], true);
		this.addAnimation(KNIGHT.ANIMATIONS.FIGHT_RIGHT_1, [16, 17, 18, 19, 20, 21], true);
		this.addAnimation(KNIGHT.ANIMATIONS.FIGHT_RIGHT_2, [24, 25, 26, 27, 28, 29], true);
		this.addAnimation(KNIGHT.ANIMATIONS.IDLE_LEFT, [37, 36, 35, 34, 33, 32], true);
		this.addAnimation(KNIGHT.ANIMATIONS.MOVE_LEFT, [45, 44, 43, 42, 41, 40], true);
		this.addAnimation(KNIGHT.ANIMATIONS.FIGHT_LEFT_1, [53, 52, 51, 50, 49, 48], true);
		this.addAnimation(KNIGHT.ANIMATIONS.FIGHT_LEFT_2, [61, 60, 59, 58, 57, 56], true);
		this.addAnimation(KNIGHT.ANIMATIONS.FIGHT_DOWN_1, [64, 65, 66, 67, 68, 69], true);
		this.addAnimation(KNIGHT.ANIMATIONS.FIGHT_DOWN_2, [72, 73, 74, 75, 76, 77], true);
		this.addAnimation(KNIGHT.ANIMATIONS.FIGHT_UP_1, [80, 81, 82, 83, 84, 85], true);
		this.addAnimation(KNIGHT.ANIMATIONS.FIGHT_UP_2, [88, 89, 90, 91, 92, 93], true);

		this.#eventsAggregator = eventsAggregator;
		this.#audio = audio;
		this.sortIndex = 2;
	}

	get activeAction() {
		return this.#activeAction;
	}

	get buildingType() {
		return this.#buildingType;
	}

	activateIdle = (isClicked = false) => {
		this.#activeAction = KNIGHT.ACTIONS.IDLE;
		const activeAnimation = this.activeAnimation;
		console.log("idle++++>>>>");
		console.log(activeAnimation);
		if (activeAnimation === KNIGHT.ANIMATIONS.MOVE_LEFT || activeAnimation === KNIGHT.ANIMATIONS.IDLE_LEFT) {
			this.emit(KNIGHT.ANIMATIONS.IDLE_LEFT);
		} else {
			this.emit(KNIGHT.ANIMATIONS.IDLE_RIGHT);
		}
		this.#stopActiveAudio();
		if (isClicked) {
			randomFromArray(this.#audio.get(GAME_AUDIO_TYPES.WHAT)).play();
		}
		if (this.#attackInterval) {
			clearInterval(this.#attackInterval);
			this.#attackInterval = null;
		}
	}

	activateAttack = (unit) => {
		if (this.#activeAction !== KNIGHT.ACTIONS.FIGHT) {
			clearInterval(this.#attackInterval);
			this.#activeAction = KNIGHT.ACTIONS.FIGHT;

			this.#attackAction(unit);
			this.#attackInterval = setInterval(() => this.#attackAction(unit), GAME_UNITS.KNIGHT.attackSpeed);
		}
	}

	#attackAction = (unit) => {

		if (unit.health > 0) {
			const x = this.x,
				y = this.y,
				tX = unit.x,
				tY = unit.y,
				direction = angle_2points(x, y, tX, tY);
			
			this.#stopActiveAudio();
			this.#playAudio(GAME_AUDIO_TYPES.FIGHT);
			
			console.log("enemy direction: ", direction);
			if (direction >= -Math.PI/4 && direction <= Math.PI/4) {
				//console.log("move right");
				this.emit(utils.randomFromArray([KNIGHT.ANIMATIONS.FIGHT_RIGHT_1, KNIGHT.ANIMATIONS.FIGHT_RIGHT_2]));
			} else if (direction >= Math.PI/4 && direction < 3*Math.PI/4) {
			//	//console.log("move down");
				this.emit(utils.randomFromArray([KNIGHT.ANIMATIONS.FIGHT_DOWN_1, KNIGHT.ANIMATIONS.FIGHT_DOWN_2]));
			} else if (direction >= 3*Math.PI/4 || direction <= -3*Math.PI/4) {
				//console.log("move left");
				this.emit(utils.randomFromArray([KNIGHT.ANIMATIONS.FIGHT_LEFT_1, KNIGHT.ANIMATIONS.FIGHT_LEFT_2]));
			} else if (direction > -3*Math.PI/4 && direction < Math.PI/4) {
				//console.log("move up");
				this.emit(utils.randomFromArray([KNIGHT.ANIMATIONS.FIGHT_UP_1, KNIGHT.ANIMATIONS.FIGHT_UP_2]));
			} else {
				console.log("unrecognized move to ", direction);
			}
			unit.reduceHealth(GAME_UNITS.KNIGHT.attackDamage);
		} else {
			console.log("die!");
			if (unit.isRemoved === false) {
				unit.die();
			}
			this.activateIdle();
		}
	}

	stepMove = (newCoordX, newCoordY) => {
		const x = this.x,
			y = this.y,
			tX = this.targetPoint[0],
			tY = this.targetPoint[1];
		if (countDistance(this, {x:tX, y: tY}) < 5) {
			console.log("reached");
			this.activateIdle();
		} else {
            const direction = angle_2points(x, y, tX, tY);
            
			if (direction > -Math.PI/4 && direction < Math.PI/4) {
				//console.log("move right");
				//this.emit(KNIGHT.ANIMATIONS.MOVE);
			} else if (direction >= Math.PI/4 && direction < 3*Math.PI/4) {
				//console.log("move down");
				//this.emit(KNIGHT.ANIMATIONS.MOVE);
			} else if (direction > 3*Math.PI/4 || direction < -3*Math.PI/4) {
				//console.log("move left");
				//this.emit(KNIGHT.ANIMATIONS.MOVE);
			} else if (direction > -3*Math.PI/4 && direction < Math.PI/4) {
				//console.log("move up");
				//this.emit(KNIGHT.ANIMATIONS.MOVE);
			} else {
				console.log("unrecognized move to ", direction);
			}
        	this.xPos = newCoordX;
        	this.yPos = newCoordY;
		}
	}

	activateMoveToTargetPoint = (targetX, targetY, saySomething = false) => {
           
		this.#activeAction = KNIGHT.ACTIONS.MOVE;
		this.targetPoint = [targetX, targetY];
		//this.emit(KNIGHT.ANIMATIONS.MOVE);
		const direction = angle_2points(this.x, this.y, targetX, targetY);
		if (direction >= -Math.PI/2 && direction <= Math.PI/2) {
			//console.log("move right");
			this.emit(KNIGHT.ANIMATIONS.MOVE_RIGHT);
		} else if (direction > Math.PI/2 || direction < -Math.PI/2) {
			//console.log("move left");
			this.emit(KNIGHT.ANIMATIONS.MOVE_LEFT);
		} else {
			console.log("unrecognized move to ", direction);
		}
		if (this.#attackInterval) {
			clearInterval(this.#attackInterval);
			this.#attackInterval = null;
		}
		if (saySomething) {
			randomFromArray(this.#audio.get(GAME_AUDIO_TYPES.YES)).play();
		}
	}

	#stopActiveAudio = () => {
		if (this.#audioInProgress) {
			//this.#audioInProgress.pause();
		}
	}

	#playAudio = (audioType, loop = false) => {
		if (this.#audioInProgress) {
			//this.#audioInProgress.pause();
		}
		const audioEl = this.#audio.get(audioType);
		if (audioEl) {
			this.#audioInProgress = randomFromArray(this.#audio.get(audioType));
			//console.log(audio);
			this.#audioInProgress.loop = loop;
			this.#audioInProgress.play();
		} else {
			throw new Error("audio " + audioType + " is not defined");
		}
	}

	die = () => {
		this.activateIdle();
		this.#playAudio(GAME_AUDIO_TYPES.DEATH);
		super.die();
	} 
}


class UnitArcher extends BaseUnit {
	/**
	 * @type {string}
	 */
	#activeAction;
	#buildingType;
	#eventsAggregator;
	#attackInterval;
	#audio;
	#audioInProgress;
	constructor(mapX, mapY, drawFactory, isShowHealth, eventsAggregator, audio) {
		super(mapX, mapY, 192, 192, GAME_UNITS.ARCHER.name, 176, drawFactory, isShowHealth, { r: 30 });
		this.addAnimation(ARCHER.ANIMATIONS.IDLE_RIGHT, [176, 177, 178, 179, 180, 181], true);
		this.addAnimation(ARCHER.ANIMATIONS.MOVE_RIGHT, [184, 185, 186, 187, 188, 189], true);
		this.addAnimation(ARCHER.ANIMATIONS.IDLE_LEFT, [199, 198, 197, 196, 195, 194], true);
		this.addAnimation(ARCHER.ANIMATIONS.MOVE_LEFT, [207, 206, 205, 204, 203, 202], true);

		this.addAnimation(ARCHER.ANIMATIONS.FIGHT_UP, [208, 209, 210, 211, 212, 213, 214, 215], true);
		this.addAnimation(ARCHER.ANIMATIONS.FIGHT_UP_RIGHT, [216, 217, 218, 219, 220, 221, 222, 223], true);
		this.addAnimation(ARCHER.ANIMATIONS.FIGHT_RIGHT, [224, 225, 226, 227, 228, 229, 230, 231], true);
		this.addAnimation(ARCHER.ANIMATIONS.FIGHT_DOWN_RIGHT, [232, 233, 234, 235, 236, 237, 238, 239], true);
		this.addAnimation(ARCHER.ANIMATIONS.FIGHT_DOWN, [240, 241, 242, 243, 244, 245, 246, 247], true);
		this.addAnimation(ARCHER.ANIMATIONS.FIGHT_UP_LEFT, [255, 254, 253, 252, 251, 250, 249, 248], true);
		this.addAnimation(ARCHER.ANIMATIONS.FIGHT_LEFT, [263, 262, 261, 260, 259, 258, 257, 256], true);
		this.addAnimation(ARCHER.ANIMATIONS.FIGHT_DOWN_LEFT, [271, 270, 269, 268, 267, 266, 265, 264], true);

		this.#eventsAggregator = eventsAggregator;
		this.#audio = audio;
		this.sortIndex = 2;
	}

	get activeAction() {
		return this.#activeAction;
	}

	get buildingType() {
		return this.#buildingType;
	}

	activateIdle = (isClicked = false) => {
		this.#activeAction = ARCHER.ACTIONS.IDLE;
		const activeAnimation = this.activeAnimation;
		console.log("idle++++>>>>");
		console.log(activeAnimation);
		if (activeAnimation === ARCHER.ANIMATIONS.MOVE_LEFT || activeAnimation === ARCHER.ANIMATIONS.IDLE_LEFT) {
			this.emit(ARCHER.ANIMATIONS.IDLE_LEFT);
		} else {
			this.emit(ARCHER.ANIMATIONS.IDLE_RIGHT);
		}
		this.#stopActiveAudio();
		if (isClicked) {
			randomFromArray(this.#audio.get(GAME_AUDIO_TYPES.WHAT)).play();
		}
		if (this.#attackInterval) {
			clearInterval(this.#attackInterval);
			this.#attackInterval = null;
		}
	}

	activateAttack = (unit) => {
		if (this.#activeAction !== ARCHER.ACTIONS.FIGHT) {
			clearInterval(this.#attackInterval);
			this.#activeAction = ARCHER.ACTIONS.FIGHT;

			this.#attackAction(unit);
			this.#attackInterval = setInterval(() => this.#attackAction(unit), GAME_UNITS.ARCHER.attackSpeed);
		}
	}

	#attackAction = (unit) => {

		if (unit.health > 0) {
			const x = this.x,
				y = this.y,
				tX = unit.x,
				tY = unit.y,
				direction = angle_2points(x, y, tX, tY);
			
			this.#stopActiveAudio();
			this.#playAudio(GAME_AUDIO_TYPES.FIGHT);
			
			console.log("enemy direction: ", direction);
			if (direction >= -Math.PI/4 && direction <= Math.PI/4) {
				//console.log("move right");
				this.emit(ARCHER.ANIMATIONS.FIGHT_RIGHT);
			} else if (direction >= Math.PI/4 && direction < 3*Math.PI/4) {
			//	//console.log("move down");
				this.emit(ARCHER.ANIMATIONS.FIGHT_DOWN);
			} else if (direction >= 3*Math.PI/4 || direction <= -3*Math.PI/4) {
				//console.log("move left");
				this.emit(ARCHER.ANIMATIONS.FIGHT_LEFT);
			} else if (direction > -3*Math.PI/4 && direction < Math.PI/4) {
				//console.log("move up");
				this.emit(ARCHER.ANIMATIONS.FIGHT_UP);
			} else {
				console.log("unrecognized move to ", direction);
			}
		} else {
			this.activateIdle();
		}
	}

	stepMove = (newCoordX, newCoordY) => {
		const x = this.x,
			y = this.y,
			tX = this.targetPoint[0],
			tY = this.targetPoint[1];
		if (countDistance(this, {x:tX, y: tY}) < 5) {
			console.log("reached");
			this.activateIdle();
		} else {
            const direction = angle_2points(x, y, tX, tY);
            
			if (direction > -Math.PI/4 && direction < Math.PI/4) {
				//console.log("move right");
				//this.emit(ARCHER.ANIMATIONS.MOVE);
			} else if (direction >= Math.PI/4 && direction < 3*Math.PI/4) {
				//console.log("move down");
				//this.emit(ARCHER.ANIMATIONS.MOVE);
			} else if (direction > 3*Math.PI/4 || direction < -3*Math.PI/4) {
				//console.log("move left");
				//this.emit(ARCHER.ANIMATIONS.MOVE);
			} else if (direction > -3*Math.PI/4 && direction < Math.PI/4) {
				//console.log("move up");
				//this.emit(ARCHER.ANIMATIONS.MOVE);
			} else {
				console.log("unrecognized move to ", direction);
			}
        	this.xPos = newCoordX;
        	this.yPos = newCoordY;
		}
	}

	activateMoveToTargetPoint = (targetX, targetY, saySomething = false) => {
           
		this.#activeAction = ARCHER.ACTIONS.MOVE;
		this.targetPoint = [targetX, targetY];
		//this.emit(ARCHER.ANIMATIONS.MOVE);
		const direction = angle_2points(this.x, this.y, targetX, targetY);
		if (direction >= -Math.PI/2 && direction <= Math.PI/2) {
			//console.log("move right");
			this.emit(ARCHER.ANIMATIONS.MOVE_RIGHT);
		} else if (direction > Math.PI/2 || direction < -Math.PI/2) {
			//console.log("move left");
			this.emit(ARCHER.ANIMATIONS.MOVE_LEFT);
		} else {
			console.log("unrecognized move to ", direction);
		}
		if (this.#attackInterval) {
			clearInterval(this.#attackInterval);
			this.#attackInterval = null;
		}
		if (saySomething) {
			randomFromArray(this.#audio.get(GAME_AUDIO_TYPES.YES)).play();
		}
	}

	activateMoveToTargetPointInRange = (targetX, targetY) => {
		// not sure this is correct formula CHAT GPT make this ---->>>>
		const len = Math.sqrt(Math.pow(targetX - this.x, 2) + Math.pow(targetY - this.y, 2)),
			x = this.x + (GAME_UNITS.ARCHER.attackRange * ((targetX - this.x) / len)),
			y = this.y + (GAME_UNITS.ARCHER.attackRange * ((targetY - this.y) / len));
		this.activateMoveToTargetPoint(x, y);
	}

	#stopActiveAudio = () => {
		if (this.#audioInProgress) {
			//this.#audioInProgress.pause();
		}
	}

	#playAudio = (audioType, loop = false) => {
		if (this.#audioInProgress) {
			//this.#audioInProgress.pause();
		}
		const audioEl = this.#audio.get(audioType);
		if (audioEl) {
			this.#audioInProgress = randomFromArray(this.#audio.get(audioType));
			//console.log(audio);
			this.#audioInProgress.loop = loop;
			this.#audioInProgress.play();
		} else {
			throw new Error("audio " + audioType + " is not defined");
		}
	}

	die = () => {
		this.activateIdle();
		this.#playAudio(GAME_AUDIO_TYPES.DEATH);
		super.die();
	} 
}

class UnitGoblinTorch extends BaseUnit {
	/**
	 * @type {string}
	 */
	#activeAction;
	#targetPoint;
	#buildingType;
	#eventsAggregator;
	#audioInProgress;

	#audio;
	#attackInterval

	constructor(mapX, mapY, drawFactory, isShowHealth, eventsAggregator, audio) {
		super(mapX, mapY, 192, 192, GAME_UNITS.GOBLIN_TORCH.name, 96, drawFactory, isShowHealth, { r:30 });
		this.addAnimation(GOBLIN_TORCH.ANIMATIONS.IDLE_RIGHT, [96, 97, 98, 99, 100, 101, 102], true);
		this.addAnimation(GOBLIN_TORCH.ANIMATIONS.MOVE_RIGHT, [104, 105, 106, 107, 108, 109], true);
		this.addAnimation(GOBLIN_TORCH.ANIMATIONS.FIGHT_RIGHT_1, [112, 113, 114, 115, 116, 117], true);
		this.addAnimation(GOBLIN_TORCH.ANIMATIONS.FIGHT_DOWN_1, [120, 121, 122, 123, 124, 125], true);
		this.addAnimation(GOBLIN_TORCH.ANIMATIONS.FIGHT_UP_1, [128, 129, 130, 131, 132, 133], true);
		this.addAnimation(GOBLIN_TORCH.ANIMATIONS.IDLE_LEFT, [142, 141, 140, 139, 138, 137, 136], true);
		this.addAnimation(GOBLIN_TORCH.ANIMATIONS.MOVE_LEFT, [150, 149, 148, 147, 146, 145], true);
		this.addAnimation(GOBLIN_TORCH.ANIMATIONS.FIGHT_LEFT_1, [158, 157, 156, 155, 154, 153], true);
		this.#eventsAggregator = eventsAggregator;
		this.#audio = audio;
		this.sortIndex = 2;
	}

	get activeAction() {
		return this.#activeAction;
	}

	get buildingType() {
		return this.#buildingType;
	}


	activateIdle = () => {
		this.#activeAction = GOBLIN_TORCH.ACTIONS.IDLE;
		this.emit(GOBLIN_TORCH.ANIMATIONS.IDLE_LEFT);
		if (this.#attackInterval) {
			clearInterval(this.#attackInterval);
			this.#attackInterval = null;
		}
	}

	activateAttack = (unit) => {
		if (this.#activeAction !== GOBLIN_TORCH.ACTIONS.FIGHT) {
			clearInterval(this.#attackInterval);
			this.#activeAction = GOBLIN_TORCH.ACTIONS.FIGHT;

			this.#attackAction(unit);
			this.#attackInterval = setInterval(() => this.#attackAction(unit), GAME_UNITS.GOBLIN_TORCH.attackSpeed);
		}
	}

	#attackAction = (unit) => {
		if (unit.health > 0) {
			const x = this.x,
				y = this.y,
				tX = unit.x,
				tY = unit.y,
				direction = angle_2points(x, y, tX, tY);

			if (direction >= -Math.PI/4 && direction <= Math.PI/4) {
				//console.log("move right");
				this.emit(GOBLIN_TORCH.ANIMATIONS.FIGHT_RIGHT_1);
			} else if (direction >= Math.PI/4 && direction < 3*Math.PI/4) {
			//	//console.log("move down");
				this.emit(GOBLIN_TORCH.ANIMATIONS.FIGHT_DOWN_1);
			} else if (direction >= 3*Math.PI/4 || direction <= -3*Math.PI/4) {
				//console.log("move left");
				this.emit(GOBLIN_TORCH.ANIMATIONS.FIGHT_LEFT_1);
			} else if (direction > -3*Math.PI/4 && direction < Math.PI/4) {
				//console.log("move up");
				this.emit(GOBLIN_TORCH.ANIMATIONS.FIGHT_UP_1);
			} else {
				console.log("unrecognized move to ", direction);
			}
			unit.reduceHealth(GAME_UNITS.GOBLIN_TORCH.attackDamage);
		} else {
			console.log("die!");
			if (unit.isRemoved === false) {
				unit.die();
			}
			this.activateIdle();
		}
	}

	stepMove = (newCoordX, newCoordY) => {
		const x = this.x,
			y = this.y,
			tX = this.targetPoint[0],
			tY = this.targetPoint[1];
		if (countDistance(this, {x:tX, y: tY}) < 5) {
			console.log("reached");
			this.activateIdle();
		} else {
        	this.xPos = newCoordX;
        	this.yPos = newCoordY;
		}
	}

	activateMoveToTargetPoint = (targetX, targetY, saySomething = false) => {
		this.#activeAction = GOBLIN_TORCH.ACTIONS.MOVE;
		this.targetPoint = [targetX, targetY];
		
		const direction = angle_2points(this.x, this.y, targetX, targetY);
		if (direction >= -Math.PI/2 && direction <= Math.PI/2) {
			//console.log("move right");
			this.emit(GOBLIN_TORCH.ANIMATIONS.MOVE_RIGHT);
		} else if (direction > Math.PI/2 || direction < -Math.PI/2) {
			//console.log("move left");
			this.emit(GOBLIN_TORCH.ANIMATIONS.MOVE_LEFT);
		} else {
			console.log("unrecognized move to ", direction);
		}

		if (this.#attackInterval) {
			clearInterval(this.#attackInterval);
			this.#attackInterval = null;
		}
		if (saySomething) {
			randomFromArray(this.knightYesAudioArr.get(GAME_AUDIO_TYPES.ATTACK)).play();
		}
		
	}

	#playAudio = (audioType, loop = false) => {
		if (this.#audioInProgress) {
			console.log(this.#audioInProgress);
			//this.#audioInProgress.pause();
		}
		this.#audioInProgress = randomFromArray(this.#audio.get(audioType));
		console.log(this.#audioInProgress);
		this.#audioInProgress.loop = loop;
		this.#audioInProgress.play();
	}

	die() {
		this.activateIdle();
		this.#playAudio(GAME_AUDIO_TYPES.DEATH);
		super.die();
	} 
}

export { UnitPeasant, UnitKnight, UnitGoblinTorch, UnitArcher, UnitGoblinHouse, UnitGoblinTower, BaseBuilding as UnitBuilding };