import { GameStage, CONST } from "jsge";
import { utils } from "jsge";
import { GAME_UNITS, GAME_EVENTS, GOLD_MINE_GOLD_AMOUNT, TREE_STUB_INDEX, TREE_FULL_HEALTH, PEASANT, KNIGHT, GOBLIN_TORCH, GAME_AUDIO_TYPES, UNIT_TACTIC, UNIT_VIEW_RANGE, ARCHER, STAGE_TEXTS, ATLAS } from "./const.js";
import { UnitPeasant, UnitBuilding, UnitKnight, UnitGoblinTorch, UnitArcher } from "./units.js";
import { pointToCircleDistance } from "jsge/src/utils.js";
import { lazy } from "react";

const isPointInsidePolygon = utils.isPointInsidePolygon,
	countDistance = utils.countDistance, 
	randomFromArray = utils.randomFromArray;

export class Stage2 extends GameStage {

	#SLOW_SCROLL_POINT = 100;
	#QUICK_SCROLL_POINT = 50;

	#imageConverter = document.createElement("canvas");
	#playerGold = 0;
	#playerGoldCounter;
	#playerWood = 0;
	#playerWoodCounter;
	#playerPeopleLimit = 5; // lets say town center increase limit to 5 and house to 3
	#playerPeopleLimitCounter;
	#playerUnits = [];
	#playerArrows = [];
	#playerBuildings = [];
	#neutralBuildings = [];
	#enemyUnits = [];
	#enemyBuildings = [];

	#treesLayer;
	#treesCutHealth = new Map();
	
	#selectedItemText;
	#buildItems;

	#buildTemplate;
	#isBuildPlaceClear;
	#buildTemplateOverlap;

	#mouseX;
	#mouseY;

	#unitsCount = 0;

	#addUnitPosX = 0;

	#isGamePaused = true;
	#firstBattleOrcsLeft = 15;
	#showWinFirstBattle = false;
	#crossArr = [];
	register() {
    	this.iLoader.addTileMap("s_map", "./assets/level2.tmx");
		this.iLoader.addImage(GAME_UNITS.GOLD_MINE.name, "./assets/Tiny Swords (Update 010)/Resources/Gold Mine/GoldMine_Inactive.png");
		this.iLoader.addImage(GAME_UNITS.TOWN_CENTER.name, "./assets/Tiny Swords (Update 010)/Factions/Knights/Buildings/Castle/Castle_Blue.png");
		this.iLoader.addImage(GAME_UNITS.HOUSE.name, "./assets/house128x192.png");

		this.iLoader.addAudio(PEASANT.AUDIO.WHAT1, "./assets/audio/peasantwhat1.mp3");
		this.iLoader.addAudio(PEASANT.AUDIO.WHAT2, "./assets/audio/peasantwhat2.mp3");
		this.iLoader.addAudio(PEASANT.AUDIO.WHAT3, "./assets/audio/peasantwhat3.mp3");
		this.iLoader.addAudio(KNIGHT.AUDIO.WHAT1, "./assets/audio/capitan/CaptainWhat1.wav");
		this.iLoader.addAudio(KNIGHT.AUDIO.WHAT2, "./assets/audio/capitan/CaptainWhat2.wav");
		this.iLoader.addAudio(KNIGHT.AUDIO.WHAT3, "./assets/audio/capitan/CaptainWhat3.wav");

		this.iLoader.addAudio(KNIGHT.AUDIO.YES1, "./assets/audio/capitan/CaptainYes1.wav");
		this.iLoader.addAudio(KNIGHT.AUDIO.YES2, "./assets/audio/capitan/CaptainYes2.wav");
		this.iLoader.addAudio(KNIGHT.AUDIO.YES3, "./assets/audio/capitan/CaptainYes3.wav");

		this.iLoader.addAudio(KNIGHT.AUDIO.ATTACK1, "./assets/audio/capitan/CaptainWarcry1.wav");
		this.iLoader.addAudio(KNIGHT.AUDIO.ATTACK2, "./assets/audio/capitan/CaptainYesAttack1.wav");

		this.iLoader.addAudio(KNIGHT.AUDIO.FIGHT1, "./assets/audio/AxeMissile1.wav");
		this.iLoader.addAudio(KNIGHT.AUDIO.FIGHT2, "./assets/audio/AxeMissile2.wav");

		this.iLoader.addAudio(KNIGHT.AUDIO.DEATH1, "./assets/audio/FootmanDeath.wav");
		this.iLoader.addAudio(GOBLIN_TORCH.AUDIO.DEATH1, "./assets/audio/GruntDeath.wav");

		this.iLoader.addAudio("needMoreGold", "./assets/audio/gruntnogold1.mp3");
		this.iLoader.addAudio("needFood", "./assets/audio/upkeepring.mp3")
		this.iLoader.addAudio("chopTree", "./assets/audio/axemediumchopwood2.mp3");
		this.iLoader.addAudio("cantBuildHere" , "./assets/audio/peasantcannotbuildthere1.mp3");
		this.timer = null;
		this.eventsAggregator = new EventTarget();
		document.body.style.margin = 0;
	}
    init() {
		const [w, h] = this.stageData.canvasDimensions;
    	// x, y, width, height, imageKey
       	//const water = this.draw.tiledLayer("water", "s_map", true),
		//	water_anim = this.draw.tiledLayer("water_a", "s_map"),
		const sand = this.draw.tiledLayer("sand", "s_map"),
			ground = this.draw.tiledLayer("ground", "s_map"),
			ground_stuff = this.draw.tiledLayer("ground_stuff", "s_map");
		//	cliff = this.draw.tiledLayer("cliff", "s_map", true),
		//	bridge = this.draw.tiledLayer("bridge", "s_map");

		this.#treesLayer = this.draw.tiledLayer("trees", "s_map", true);

		this.goldMine1 = this.draw.image(1100, 360, 192, 128, GAME_UNITS.GOLD_MINE.name, 0);
		this.goldMine1.goldAmount = GOLD_MINE_GOLD_AMOUNT;

		this.#neutralBuildings.push(this.goldMine1);

		this.#attachAudio();

		// this.shadowRect = this.draw.rect(0, 0, w, h, "rgba(0, 0, 0, 0.5)");  
     	// this.shadowRect.blendFunc = [WebGLRenderingContext.ONE, WebGLRenderingContext.DST_COLOR];
		// this.shadowRect.turnOffOffset();

		// units

		const townCenter = new UnitBuilding(850, 600, 320, 256, GAME_UNITS.TOWN_CENTER.name, 0, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator);
		townCenter.sortIndex = 4;
		this.#playerBuildings.push(townCenter);

		const peasant1 = new UnitPeasant(1050, 580, townCenter, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.peasantAudio),
			peasant2 = new UnitPeasant(1050, 640, townCenter, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.peasantAudio),
			peasant3 = new UnitPeasant(1050, 700, townCenter, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.peasantAudio);

		this.addRenderObject(townCenter);
		this.addRenderObject(peasant1);
		this.addRenderObject(peasant2);
		this.addRenderObject(peasant3);

		this.#playerUnits.push(peasant1);
		this.#playerUnits.push(peasant2);
		this.#playerUnits.push(peasant3);

		this.chopTreeSound = this.iLoader.getAudio("chopTree");
		// this.personSightView = this.draw.conus(55, 250, 200, "rgba(0,0,0,1)", Math.PI/3);
		// this.personSightView.rotation = -Math.PI/6;
		// this.personSightView._isMask = true;
		this.#createBattle();
		this.iSystem.addEventListener(GAME_EVENTS.DIALOG_EVENTS.CLOSED, this.#onDialogClosed);
    }
    start() {
		this.#createUserInterface();
		setTimeout(() => {
			const [w, h] = this.stageData.canvasDimensions;
			this.stageData.centerCameraPosition(720, 1400);
		},100);

		this.#unitsCount = this.#playerUnits.length;
		console.log("strategy started x:" + 2000);
    }

	stop() {
        this.unregisterListeners();
		document.getElementById("sidebar").remove();
    }
	
	registerListeners() {
		this.#registerMouseListeners();
        this.#registerKeyboardListeners();
		this.#registerSystemEventsListeners();
	}

	unregisterListeners() {
		this.#unregisterMouseListeners();
        this.#unregisterKeyboardListeners();
		this.#unregisterSystemEventsListeners();
	}

	#registerKeyboardListeners() {
        document.addEventListener("keydown", this.#pressKeyAction);
        document.addEventListener("keyup", this.#removeKeyAction);
    }

    #unregisterKeyboardListeners() {
        document.removeEventListener("keydown", this.#pressKeyAction);
        document.removeEventListener("keyup", this.#removeKeyAction);
    }

    #registerMouseListeners() {
        document.addEventListener("mousemove", this.#mouseMoveAction);
        document.addEventListener("click", this.#mouseClickAction);
    }

    #unregisterMouseListeners() {
		this.iSystem.removeEventListener(GAME_EVENTS.SYSTEM_EVENTS.START_LEVEL, this.#onDialogClosed);
        document.removeEventListener("mousemove", this.#mouseMoveAction);
        document.removeEventListener("click", this.#mouseClickAction);
    }

	#onDialogClosed = (e) => {
		const {currentLevel, currentState} = e.data[0];
		console.log("start level", currentLevel);
		if (currentLevel === 2) {
			if (currentState === STAGE_TEXTS.STAGE_2.START.key) {
				this.#isGamePaused = false;
				this.registerListeners();
			} else if (currentState === STAGE_TEXTS.STAGE_2.WIN_1_BATTLE.key) {
				this.#isGamePaused = false;
				this.stageData.centerCameraPosition(850, 600);
			}
		}
	}

	#createUserInterface = () => {
		const windowWidth = document.body.offsetWidth,
			sidebar = document.createElement("div");
		sidebar.id = "sidebar";
		sidebar.style.width = windowWidth + "px";
		sidebar.style.height = "48px";
		sidebar.style.padding = "6px";
		sidebar.style.backgroundColor = "#ccc";
		sidebar.style.position = "fixed";
		sidebar.style.top = 0 + "px";
		sidebar.style.left = 0 + "px";
		sidebar.style.display = "flex";
		sidebar.style.fontSize = "1.4rem";
		sidebar.style.fontWeight = "bold";
		document.body.appendChild(sidebar);

		const resourcesInfo = document.createElement("div");
		resourcesInfo.style.display = "flex";
		resourcesInfo.style.flexFlow = "column";
		sidebar.appendChild(resourcesInfo);

		const resourceWrap = document.createElement("div");
		resourceWrap.style.display = "flex";

		const playerGoldCounterText = document.createElement("div");
		playerGoldCounterText.innerText = "Gold: ";
		resourceWrap.appendChild(playerGoldCounterText);

		this.#playerGoldCounter = document.createElement("div");
		this.#playerGoldCounter.innerText = this.#playerGold.toString();
		this.#playerGoldCounter.style.marginRight = "6px";
		resourceWrap.appendChild(this.#playerGoldCounter);

		const playerWoodCounterText = document.createElement("div");
		playerWoodCounterText.innerText = "Wood: ";
		resourceWrap.appendChild(playerWoodCounterText);

		this.#playerWoodCounter = document.createElement("div");
		this.#playerWoodCounter.innerText = this.#playerWood.toString();
		this.#playerWoodCounter.style.marginRight = "6px";
		resourceWrap.appendChild(this.#playerWoodCounter);

		resourcesInfo.appendChild(resourceWrap);

		const playerInfoWrap = document.createElement("div");
		playerInfoWrap.style.display = "flex";
		const playerPeopleCounterText = document.createElement("div");
		playerPeopleCounterText.innerText = "People limits: ";
		playerInfoWrap.appendChild(playerPeopleCounterText);
		
		
		this.#playerPeopleLimitCounter = document.createElement("div");
		this.#playerPeopleLimitCounter.innerText = this.#playerUnits.length + "/" + this.#playerPeopleLimit.toString();
		playerInfoWrap.appendChild(this.#playerPeopleLimitCounter);
		resourcesInfo.appendChild(playerInfoWrap);

		const buildMenuContainer = document.createElement("div");
		buildMenuContainer.style.display = "flex";
		buildMenuContainer.style.marginLeft = "30px";
		sidebar.appendChild(buildMenuContainer);

		this.#selectedItemText = document.createElement("div");
		this.#selectedItemText.innerText = "Nothing is selected";
		buildMenuContainer.appendChild(this.#selectedItemText);

		this.#buildItems = document.createElement("div");
		buildMenuContainer.appendChild(this.#buildItems);

	}
	
	#pressKeyAction = (event) => {
        const code = event.code;
		
		console.log("pressed: ", code);
		if (code === "Space") {
			
			const townCenter = this.#playerBuildings.find((building) => building.key === GAME_UNITS.TOWN_CENTER.name);
			const newPeasant = new UnitPeasant(0, 0, townCenter, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator);
			const newPeasant2 = new UnitPeasant(0, 0, townCenter, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator);

			newPeasant.x = townCenter.x - this.#addUnitPosX;
			newPeasant.y = townCenter.y;
			newPeasant2.x = townCenter.x - this.#addUnitPosX;
			newPeasant2.y = townCenter.y - 16;
			this.addRenderObject(newPeasant);
			this.addRenderObject(newPeasant2);
			this.#playerUnits.push(newPeasant);
			this.#playerUnits.push(newPeasant2);
			this.#unitsCount++;
			this.#unitsCount++;
			newPeasant.activateMoveToTargetPoint(1500, 1500);
			newPeasant2.activateMoveToTargetPoint(1500, 1500);
			console.log("units: ", this.#unitsCount);
			this.#addUnitPosX -= 20;
		}
    };

    #removeKeyAction = (event) => {
        const code = event.code;
		if (code === "Space") {
			this.#addUnitPosX = 0;
		}
    };

    #mouseMoveAction = (e) => {
		if (!this.#isGamePaused) {
			const [xOffset, yOffset] = this.stageData.worldOffset,
				x = e.offsetX,
				y = e.offsetY,
				cursorPosX = x + xOffset,
				cursorPosY = y + yOffset,
				[ viewWidth, viewHeight ] = this.stageData.canvasDimensions,
				xShiftRight = viewWidth - x,
				yShiftBottom = viewHeight - y,
				xShift = viewWidth/2 + xOffset,
				yShift = viewHeight/2 + yOffset;
				
			let newPosX = xShift,
				newPosY = yShift;
			document.getElementsByTagName("canvas")[0].style.cursor = "default";
			if (x < this.#QUICK_SCROLL_POINT) {
				//console.log("quick scroll left");
				newPosX = xShift-20;
				document.getElementsByTagName("canvas")[0].style.cursor = "url('assets/cursor-pack-kenney/Outline/Default/navigation_w.png'), auto";
			} else if (x < this.#SLOW_SCROLL_POINT) {
				//console.log("slow scroll left");
				newPosX = xShift-5;
				document.getElementsByTagName("canvas")[0].style.cursor = "url('assets/cursor-pack-kenney/Outline/Default/navigation_w.png'), auto";
				console.log("sss");
			}
			if (xShiftRight < this.#QUICK_SCROLL_POINT) {
				//console.log("quick scroll right");
				newPosX = xShift+20;
				document.getElementsByTagName("canvas")[0].style.cursor = "url('assets/cursor-pack-kenney/Outline/Default/navigation_e.png'), auto";
			} else if (xShiftRight < this.#SLOW_SCROLL_POINT) {
				//console.log("slow scroll right");
				newPosX = xShift+20;
				document.getElementsByTagName("canvas")[0].style.cursor = "url('assets/cursor-pack-kenney/Outline/Default/navigation_e.png'), auto";
			}

			if (y < this.#QUICK_SCROLL_POINT) {
				//console.log("quick scroll up");
				newPosY = yShift-20;
				document.getElementsByTagName("canvas")[0].style.cursor = "url('assets/cursor-pack-kenney/Outline/Default/navigation_n.png'), auto";
			} else if (y < this.#SLOW_SCROLL_POINT) {
				//console.log("slow scroll up");
				newPosY = yShift-5;
				document.getElementsByTagName("canvas")[0].style.cursor = "url('assets/cursor-pack-kenney/Outline/Default/navigation_n.png'), auto";
			}
			if (yShiftBottom < this.#QUICK_SCROLL_POINT) {
				//console.log("quick scroll down");
				newPosY = yShift+20;
				document.getElementsByTagName("canvas")[0].style.cursor = "url('assets/cursor-pack-kenney/Outline/Default/navigation_s.png'), auto";
			} else if (yShiftBottom < this.#SLOW_SCROLL_POINT) {
				//console.log("slow scroll down");
				newPosY = yShift+5;
				document.getElementsByTagName("canvas")[0].style.cursor = "url('assets/cursor-pack-kenney/Outline/Default/navigation_s.png'), auto";
			}
			this.stageData.centerCameraPosition(newPosX, newPosY);
			this.#mouseX = cursorPosX;
			this.#mouseY = cursorPosY;
			
			if (this.#buildTemplate) {
				this.#buildTemplate.x = cursorPosX;
				this.#buildTemplate.y = cursorPosY;
				this.#buildTemplateOverlap.x = cursorPosX - this.#buildTemplateOverlap.width/2;
				this.#buildTemplateOverlap.y = cursorPosY - this.#buildTemplateOverlap.height/2;
				if (this.isBoundariesCollision(cursorPosX, cursorPosY, this.#buildTemplateOverlap) 
					|| this.isObjectsCollision(cursorPosX, cursorPosY, this.#buildTemplateOverlap, this.#playerBuildings)
					|| this.isObjectsCollision(cursorPosX, cursorPosY, this.#buildTemplateOverlap, this.#neutralBuildings)) {
					this.#buildTemplateOverlap.bgColor = "rgba(224, 12, 21, 0.6)";
					this.#isBuildPlaceClear = false;
				} else {
					this.#buildTemplateOverlap.bgColor = "rgba(0, 0, 0, 0.3";
					this.#isBuildPlaceClear = true;
				}
			}
		}
    };

    #mouseClickAction = (e) => {
		if (!this.#isGamePaused) {
			const target = e.target;
			
			if (target instanceof Image) {
				this.#processImageClick(e);
			} else if (this.#buildTemplate) {
				this.#processNewBuild(this.#buildTemplate._building_key);
			} else {
				this.#processMapClick(e);
			}
		}
    }

	#processNewBuild = (key) => {
		const cantBuildAudio = this.iLoader.getAudio("cantBuildHere");

		if (this.#isBuildPlaceClear) {
			this.#playerUnits.forEach((unit) => {
				if (unit.isSelected) {
					unit.activateStartBuilding(this.#buildTemplateOverlap.x, this.#buildTemplateOverlap.y, key);
					if (unit.isSelected) {
						unit.isSelected = false;
					}
					// cleanup build menu
					this.#selectedItemText.innerText = "";
					while (this.#buildItems.lastChild) {
						this.#buildItems.removeChild(this.#buildItems.lastChild);
					}
					// remove build helpers
					this.#buildTemplate.destroy();
					this.#buildTemplateOverlap.destroy();
					this.#buildTemplate = null;
					this.#buildTemplateOverlap = null;
				}
			});
		} else {
			cantBuildAudio.play();
		}

	}

	#processImageClick = (e) => {
		const target = e.target,
			type = target.id;
			
		
		switch (type) {
			case GAME_UNITS.PEASANT.name:
				this.#orderToBuildUnit(GAME_UNITS.PEASANT.name);
				break;
			case GAME_UNITS.HOUSE.name:
				this.#orderToBuildBuilding(GAME_UNITS.HOUSE.name);
				break;
			case GAME_UNITS.BARRACKS.name:
				this.#orderToBuildBuilding(GAME_UNITS.BARRACKS.name);
				break;
		}
	}

	#orderToBuildUnit = (type) => {
		console.log("order build ", type);
		const costWood = GAME_UNITS[type].cost.w,
			costGold = GAME_UNITS[type].cost.g;
		if (!this.#isEnoughGold(costGold)) {
			console.log("not enough gold");
			this.iLoader.getAudio("needMoreGold").play();
		} else if (!this.#isEnoughWood(costWood)) {
			console.log("not enough wood");
		} else if (!this.#isEnoughHouses()) {
			this.iLoader.getAudio("needFood").play();
			console.log("not enough houses");
			
		} else {
			const townCenter = this.#playerBuildings.find((building) => building.key === GAME_UNITS.TOWN_CENTER.name);
			if (!townCenter.isBuildingUnit) {
				this.#playerGold -= costGold;
				this.#playerWood -= costWood;
				
				townCenter.buildUnit(type);
			} else {
				console.log("already building");
			}
			
		}
	}

	#orderToBuildBuilding = (type) => {
		console.log("order build ", type);
		const costWood = GAME_UNITS[type].cost.w,
			costGold = GAME_UNITS[type].cost.g;
		if (!this.#isEnoughGold(costGold)) {
			console.log("not enough gold");
			this.iLoader.getAudio("needMoreGold").play();
		} else if (!this.#isEnoughWood(costWood)) {
			console.log("not enough wood");
		} else {
			this.#playerGold -= costGold;
			this.#playerWood -= costWood;
			let imageType = GAME_UNITS.HOUSE.name;
			// a small workaround to use image atlas, instead of separate images
			switch (type) {
				case GAME_UNITS.BARRACKS.name:
					imageType = GAME_UNITS.HOUSE.name;
					break;
			}
			this.#buildTemplate = this.draw.image(this.#mouseX, this.#mouseY, 128, 192, imageType, 9);
			this.#buildTemplate._building_key = type;
			this.#buildTemplateOverlap = this.draw.rect(this.#mouseX - 8, this.#mouseY - 8, 128, 192, "rgba(0, 0, 0, 0.3");
			this.#isBuildPlaceClear = false;
		}
	}
	#isEnoughGold(costGold) {
		const gold = this.#playerGold;
		return costGold <= gold;
	}

	#isEnoughWood(costWood) {
		const wood = this.#playerWood;

		return costWood <= wood;
	}

	#isEnoughHouses() {
		const units = this.#playerUnits.length,
			maxUnits = this.#playerPeopleLimit;
		console.log("u: ", units);
		console.log("l: ", maxUnits);
		return maxUnits > units;
	}
	#processMapClick = (e) => {
		let selectPlayerUnit = null,
			isTreeSelected = false,
			selectedNeutralBuilding = null,
			[ offsetX, offsetY ] = this.stageData.worldOffset,
			clickXWithOffset = e.offsetX + offsetX,
			clickYWithOffset = e.offsetY + offsetY;

		this.#playerUnits.forEach((unit) => {
			if (isPointInsidePolygon(clickXWithOffset - unit.x, clickYWithOffset - unit.y, unit.boundaries)) {
				this.#playerUnits.forEach((unit) => {
					console.log(unit.isSelected);
					if (unit.isSelected) {
						console.log("deselect");
						unit.isSelected = false;
					}
				});
				this.#playerBuildings.forEach((unit) => {
					if (unit.isSelected) {
						unit.isSelected = false;
					}
				});

				selectPlayerUnit = unit;
				selectPlayerUnit.isSelected = true;
				this.#configureUnitUI(unit);
				
				unit.activateIdle(true);
			}
		});
		if (selectPlayerUnit && selectPlayerUnit.isSelected === true) {
			return;
		}
		this.#playerBuildings.forEach((building) => {
			if (isPointInsidePolygon(clickXWithOffset - building.x, clickYWithOffset - building.y, building.boundaries)) {
				this.#playerUnits.forEach((unit) => {
					if (unit.isSelected) {
						unit.isSelected = false;
					}
				});
				this.#playerBuildings.forEach((unit) => {
					if (unit.isSelected) {
						unit.isSelected = false;
					}
				});
				selectPlayerUnit = building;
				selectPlayerUnit.isSelected = true;
				this.#configureBuildingUI(building);
			}
		});

		this.#neutralBuildings.forEach((unit) => {
			if (isPointInsidePolygon(clickXWithOffset - unit.x, clickYWithOffset - unit.y, unit.boundaries)) {
				console.log("clicked gold mine: ", unit);
				console.log("gold amount: ", unit.goldAmount)
				selectedNeutralBuilding = unit;
			}
		});
		
		const xCell = Math.floor(clickXWithOffset / this.#treesLayer.tilemap.tilewidth),
			yCell = Math.floor(clickYWithOffset / this.#treesLayer.tilemap.tileheight),
			clickedCellIndex = this.#treesLayer.layerData.height * yCell + xCell,
			clickedCellTile = this.#treesLayer.layerData.data[clickedCellIndex];
		console.log("x cell: ", xCell);
		console.log("y cell: ", yCell);
		if (clickedCellTile !== 0 && clickedCellTile !== TREE_STUB_INDEX) {
			console.log(clickedCellIndex);
			console.log("tree cell clicked");
			isTreeSelected = true;
		}

		// if no new units selected, move selected units to click point
		if (!selectPlayerUnit) {
			this.#playerUnits.forEach((unit) => {
				if (unit.isSelected) {
					if (unit instanceof UnitPeasant) {
						if (selectedNeutralBuilding) {
							console.log("do something with building: ", selectedNeutralBuilding);
							if (selectedNeutralBuilding.key === GAME_UNITS.GOLD_MINE.name && unit instanceof UnitPeasant) {
								unit.activateGrabGold(selectedNeutralBuilding);
							}
						} else if (isTreeSelected) {
							console.log("go, and cut tree");
							let tree = this.#treesCutHealth.get(clickedCellIndex);
							if (!tree) {
								tree = new Tree(clickXWithOffset, clickYWithOffset, TREE_FULL_HEALTH, clickedCellIndex);
								this.#treesCutHealth.set(clickedCellIndex, tree);
							}
							unit.activateDragTree(tree);
						} else {
							unit.activateMoveToTargetPoint(clickXWithOffset, clickYWithOffset, true);
							this.#drawCross(clickXWithOffset, clickYWithOffset);
						}
					} else if (unit instanceof UnitKnight || unit instanceof UnitArcher) {
						unit.activateMoveToTargetPoint(clickXWithOffset, clickYWithOffset, true);
						this.#drawCross(clickXWithOffset, clickYWithOffset);
					}
				}
			});
		}
	}
	#drawCross = (x, y) => {
		const cross = this.draw.image(x, y, 64, 64, ATLAS["64x64"], 42);
		cross.addAnimation("markMoveT", [42, 43, 44, 45], false);
		cross.emit("markMoveT");
		this.#crossArr.push(cross);
	}

	#configureUnitUI = (unit) => {
		while (this.#buildItems.lastChild) {
			this.#buildItems.removeChild(this.#buildItems.lastChild);
		}
		if (unit instanceof UnitPeasant) {
			this.#selectedItemText.innerText = "Peasant: ";

			const peasantFrameHouse = this.iLoader.getImage(GAME_UNITS.HOUSE.name);//this.draw.image(startX, startY, 16, 16, "houses", randomFromArray([9, 10, 11]));
			const helper = this.#imageConverter.getContext("2d");	
			this.#imageConverter.width = 32;
			this.#imageConverter.height = 48;
			helper.clearRect(0, 0, window.innerWidth, window.innerHeight);
			helper.drawImage(peasantFrameHouse, 0, 0, 128, 192, 0, 0, 32, 48);
			const imageDataHouse = this.#imageConverter.toDataURL();
			const houseImage = new Image(32, 48);
			houseImage.src = imageDataHouse;
			houseImage.id = GAME_UNITS.HOUSE.name;

			const peasantFrameBarracks = this.iLoader.getImage(GAME_UNITS.HOUSE.name);//this.draw.image(startX + 18, startY, 16, 16, "barracks", 1);
			helper.clearRect(0, 0, window.innerWidth, window.innerHeight);
			helper.drawImage(peasantFrameBarracks, 0, 192, 128, 192, 0, 0, 32, 48);
			const imageDataBarracks = this.#imageConverter.toDataURL();
			const barracksImage = new Image(32, 48);
			barracksImage.src = imageDataBarracks;
			barracksImage.id = GAME_UNITS.BARRACKS.name;

			this.#buildItems.appendChild(houseImage);
			this.#buildItems.appendChild(barracksImage);
		} else if (unit instanceof UnitKnight) {
			this.#selectedItemText.innerText = "Knight";
		}
	}

	#configureBuildingUI = (building) => {
		while (this.#buildItems.lastChild) {
			this.#buildItems.removeChild(this.#buildItems.lastChild);
		}
		if (building.key === GAME_UNITS.TOWN_CENTER.name) {
			this.#selectedItemText.innerText = "TownCenter: ";
			const peasantImage = this.iLoader.getImage(GAME_UNITS.PEASANT.name);
			const helper = this.#imageConverter.getContext("2d");	
			this.#imageConverter.width = 32;
			this.#imageConverter.height = 32;
			helper.clearRect(0, 0, window.innerWidth, window.innerHeight);
			helper.drawImage(peasantImage, 66, 66, 60, 60, 0, 0, 32, 32);
			const peasantData = this.#imageConverter.toDataURL();
			const peasantImageHTML = new Image(32, 32);
			peasantImageHTML.src = peasantData;
			peasantImageHTML.id = GAME_UNITS.PEASANT.name;
				
			this.#buildItems.appendChild(peasantImageHTML);
		}
	}

	#clickedBuildPeasant = (e) => {
		console.log("clicked build peasant");
		console.log(e);
	}

	#createBattle = () => {
		const pUnits = this.#playerUnits,
			eUnits = this.#enemyUnits;

		let startX = 550,
			startY = 1250;

		for (let i = 0; i < 4; ++i) {
			const unitArcher = new UnitArcher(startX, startY, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.knightAudio);
			unitArcher.activateIdle();
			this.addRenderObject(unitArcher);
			pUnits.push(unitArcher);
			startX += 60;
		}
		startX = 550,
		startY = 1400;
		for (let i = 0; i < 5; ++i) {
			const unitKnight = new UnitKnight(startX, startY, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.knightAudio),
				unitGoblinTorch = new UnitGoblinTorch(startX, startY + 100, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.goblinAudio);

				unitKnight.activateIdle();
				unitGoblinTorch.activateIdle();
				this.addRenderObject(unitKnight);
				this.addRenderObject(unitGoblinTorch);
				pUnits.push(unitKnight);
				eUnits.push(unitGoblinTorch);
				startX += 60;
		}
		for (let i = 0; i < 2; ++i) {
			const unitGoblinTorch = new UnitGoblinTorch(startX, startY + 100, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.goblinAudio);

				unitGoblinTorch.activateIdle();
				this.addRenderObject(unitGoblinTorch);
				eUnits.push(unitGoblinTorch);
				startX += 60;
		}
		startX = 550;
		startY += 60;
		for (let i = 0; i < 8; ++i) {
			const unitGoblinTorch = new UnitGoblinTorch(startX, startY + 100, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.goblinAudio);

			unitGoblinTorch.activateIdle();
			this.addRenderObject(unitGoblinTorch);
			eUnits.push(unitGoblinTorch);
			startX += 60;
		}
	}

	#attachAudio = () => {
		this.chopTreeSound = this.iLoader.getAudio("chopTree");
		this.knightAudio = new Map();
		this.knightAudio.set(GAME_AUDIO_TYPES.YES, [this.iLoader.getAudio(KNIGHT.AUDIO.YES1), this.iLoader.getAudio(KNIGHT.AUDIO.YES2), this.iLoader.getAudio(KNIGHT.AUDIO.YES3)]);
		this.knightAudio.set(GAME_AUDIO_TYPES.WHAT, [this.iLoader.getAudio(KNIGHT.AUDIO.WHAT1), this.iLoader.getAudio(KNIGHT.AUDIO.WHAT2), this.iLoader.getAudio(KNIGHT.AUDIO.WHAT3)]);
		this.knightAudio.set(GAME_AUDIO_TYPES.ATTACK, [this.iLoader.getAudio(KNIGHT.AUDIO.ATTACK1), this.iLoader.getAudio(KNIGHT.AUDIO.ATTACK2)]);
		this.knightAudio.set(GAME_AUDIO_TYPES.FIGHT, [this.iLoader.getAudio(KNIGHT.AUDIO.FIGHT1), this.iLoader.getAudio(KNIGHT.AUDIO.FIGHT2)]);
		this.knightAudio.set(GAME_AUDIO_TYPES.DEATH, [this.iLoader.getAudio(KNIGHT.AUDIO.DEATH1)]);

 		this.peasantAudio = new Map();

		this.peasantAudio.set(GAME_AUDIO_TYPES.WHAT,  [this.iLoader.getAudio(PEASANT.AUDIO.WHAT1), this.iLoader.getAudio(PEASANT.AUDIO.WHAT2), this.iLoader.getAudio(PEASANT.AUDIO.WHAT3) ]);

		this.goblinAudio = new Map();
		this.goblinAudio.set(GAME_AUDIO_TYPES.DEATH, [this.iLoader.getAudio(GOBLIN_TORCH.AUDIO.DEATH1)]);
	}

	#render = () => {
		let crossLen = this.#crossArr.length;
		for (let index = 0; index < crossLen; index++) {
			const cross = this.#crossArr[index];
			if (cross.imageIndex === 45) {
				this.#crossArr.splice(index, 1);
            	index--;
                crossLen--;
			}
		}
		let pArrows = this.#playerArrows,
			paLen = pArrows.length;
		for (let index = 0; index < paLen; index++) {
			const arrow = this.#playerArrows[index];

			const forceToUse = 1.5,//this.#moveSpeed,
				newCoordX = arrow.x + forceToUse * Math.cos(arrow.rotation),
				newCoordY = arrow.y + forceToUse * Math.sin(arrow.rotation);

			const collisionUnits = this.isObjectsCollision(arrow.x, arrow.y, arrow, this.#enemyUnits),
				collisionBuildings = this.isObjectsCollision(arrow.x, arrow.y, arrow, this.#enemyBuildings);
			if (collisionUnits) {
				let minDist, closeEnemy;
				if (collisionUnits.length > 1) {
					const len = collisionUnits.length;
					for (let index = 0; index < len; index++) {
						const enemy = collisionUnits[index],
							dist = countDistance(arrow, enemy);
						if (!minDist || minDist > dist) {
							minDist = dist;
							closeEnemy = enemy;
						}
					}
				} else {
					closeEnemy = collisionUnits[0];
				}
				
				closeEnemy.reduceHealth(GAME_UNITS.ARCHER.attackDamage);
				if (closeEnemy.health <= 0 && closeEnemy.isRemoved === false) {
					closeEnemy.die();
				}
				arrow.destroy();
				this.#playerArrows.splice(index, 1);
				index--;
				paLen--;
				continue;
			} else if (countDistance({x: newCoordX, y: newCoordY}, {x: arrow.tX, y: arrow.tY}) <= 10) {
				arrow.destroy();
				this.#playerArrows.splice(index, 1);
				index--;
				paLen--;
				continue;
			}
			arrow.x = newCoordX;
			arrow.y = newCoordY;
		}
		let pUnitsLen = this.#playerUnits.length;
		for (let index = 0; index < pUnitsLen; index++) {
			const unit = this.#playerUnits[index];
			if (unit.isRemoved) {
				this.#playerUnits.splice(index, 1);
				index--;
				pUnitsLen--;
				this.#recalculatePeopleLimits();
				continue;
			}
			if (unit instanceof UnitPeasant) {
				const action = unit.activeAction;
				switch (action) {
					case PEASANT.ACTIONS.MOVE:
						// check for obstacles
						unit.stepMove();
						break;
					case PEASANT.ACTIONS.DRAG_GOLD:
						unit.grabGold();
						break;
					case PEASANT.ACTIONS.DRAG_WOOD:
						unit.dragWood();
						break;	
					case PEASANT.ACTIONS.CHOP_WOOD:
						this.chopTreeSound.play();
						unit.chopTree();
						break;
					case PEASANT.ACTIONS.BUILD:
						if (countDistance(unit, {x:unit.targetPoint[0], y: unit.targetPoint[1]}) < 5) {
							console.log('start building here');
							// to avoid duplicate call, check isSelected prop
							// remove peasant
							unit.stopRepeatedAnimation(unit.activeAnimation);
							unit.destroy();
							// remove from array
							this.#playerUnits.splice(index, 1);

							const type = unit.buildingType;
							let startIndex = 1,
								imageType = GAME_UNITS.HOUSE.name;
								
							switch (type) {
								case GAME_UNITS.HOUSE.name:
									startIndex = 1;
									break;
								case GAME_UNITS.BARRACKS.name:
									startIndex = 4;
									imageType = GAME_UNITS.HOUSE.name;
									break;
							}
							
							const [x, y] = unit.targetPoint;
							const newBuilding = new UnitBuilding(x + 60, y + 96, 128, 192, imageType, startIndex, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator);
							
							this.#playerBuildings.push(newBuilding);
							this.addRenderObject(newBuilding);
						} else {
							unit.stepMove();
						}
						break;
					case PEASANT.ACTIONS.IDLE:
						break;
				}
			}

			if (unit instanceof UnitKnight) {
				const action = unit.activeAction;
				switch (action) {
					case KNIGHT.ACTIONS.MOVE:
						// check for obstacles
						const collisionUnits = this.isObjectsCollision(unit.x, unit.y, unit, this.#enemyUnits),
							collisionBuildings = this.isObjectsCollision(unit.x, unit.y, unit, this.#enemyBuildings);
						if (collisionUnits) {
							let minDist, closeEnemy;
							if (collisionUnits.length > 1) {
								const len = collisionUnits.length;
								for (let index = 0; index < len; index++) {
									const enemy = collisionUnits[index],
										dist = countDistance(unit, enemy);
									if (!minDist || minDist > dist) {
										minDist = dist;
										closeEnemy = enemy;
									}
								}
							} else {
								closeEnemy = collisionUnits[0];
							}
							//console.log("closest enemy:", closeEnemy);
							unit.activateAttack(closeEnemy);
						} else if (collisionBuildings) {
							let minDist, closeEnemy;
							if (collisionBuildings.length > 1) {
								const len = collisionBuildings.length;
								for (let index = 0; index < len; index++) {
									const enemy = collisionBuildings[index],
										dist = countDistance(unit, enemy);
									if (!minDist || minDist > dist) {
										minDist = dist;
										closeEnemy = enemy;
									}
								}
							} else {
								closeEnemy = collisionBuildings[0];
							}
							//console.log("closest enemy:", closeEnemy);
							unit.activateAttack(closeEnemy);
					
						} else {
							const {x, y} = unit.countNextStep();
							if (this.isBoundariesCollision(x, y, unit)) {
								unit.activateIdle();
							} else {
								unit.stepMove(x, y);
							}	
						}
						break;
					case KNIGHT.ACTIONS.IDLE:
						if (!this.#isGamePaused && unit.unitTactic === UNIT_TACTIC.AGGRESSIVE) {
							const enemyObjects = this.#enemyUnits,
								len = enemyObjects.length;

							let closestDistance,
								closesUnit;
							for (let i = 0; i < len; ++i) {
								const object = enemyObjects[i],
									distance = pointToCircleDistance(unit.x, unit.y, {x: object.x, y: object.y, r: object.width/2});
								if (distance < UNIT_VIEW_RANGE) {
									if (!closestDistance || distance < closestDistance) {
										closestDistance = distance;
										closesUnit = object;
									}
								}
							}
							if (closestDistance) {
								unit.activateMoveToTargetPoint(closesUnit.x, closesUnit.y);
							}
						}
						break;
				}
			}

			if (unit instanceof UnitArcher) {
				const action = unit.activeAction;
				switch (action) {
					case ARCHER.ACTIONS.MOVE:
						const {x, y} = unit.countNextStep();
						// check for obstacles
						if (this.isBoundariesCollision(x, y, unit)) {
							unit.activateIdle();
						} else {
							unit.stepMove(x, y);
						}	
						break;
					case ARCHER.ACTIONS.IDLE:
						if (!this.#isGamePaused && unit.unitTactic === UNIT_TACTIC.AGGRESSIVE) {
							const enemyObjects = this.#enemyUnits,
								len = enemyObjects.length;

							let closestDistance,
								closesUnit;
							for (let i = 0; i < len; ++i) {
								const object = enemyObjects[i],
									distance = pointToCircleDistance(unit.x, unit.y, {x: object.x, y: object.y, r: object.width/2});
								if (distance < UNIT_VIEW_RANGE) {
									if (!closestDistance || distance < closestDistance) {
										closestDistance = distance;
										closesUnit = object;
									}
								}
							}
							if (closestDistance && (closestDistance > GAME_UNITS.ARCHER.attackRange)) {
								unit.activateMoveToTargetPointInRange(closesUnit.x, closesUnit.y);
							} else if (closestDistance) {
								unit.activateAttack(closesUnit);
							}
						}
						break;
				}
			}
		}

		let eUnitsLen = this.#enemyUnits.length;
		for (let index = 0; index < eUnitsLen; index++) {
			const unit = this.#enemyUnits[index];
			if (unit.isRemoved) {
				this.#enemyUnits.splice(index, 1);
				index--;
				eUnitsLen--;
				this.#firstBattleOrcsLeft--;
				if (this.#firstBattleOrcsLeft === 0 && this.#showWinFirstBattle === false) {// WIN_1_BATTLE
					this.iSystem.emit(GAME_EVENTS.SYSTEM_EVENTS.OPEN_DIALOG, {level: 2, messageKey: STAGE_TEXTS.STAGE_2.WIN_1_BATTLE.key, title: STAGE_TEXTS.STAGE_2.WIN_1_BATTLE.title, text: STAGE_TEXTS.STAGE_2.WIN_1_BATTLE.text});
					this.#showWinFirstBattle = true;
					this.#isGamePaused = true;
				}
				continue;
			}
			if (unit instanceof UnitGoblinTorch) {
				const action = unit.activeAction;
				switch (action) {
					case GOBLIN_TORCH.ACTIONS.MOVE:
					
						const isCollisionUnit = this.isObjectsCollision(unit.x, unit.y, unit, this.#playerUnits),
							isCollisionBuilding = this.isObjectsCollision(unit.x, unit.y, unit, this.#playerBuildings);
						if (isCollisionUnit) {
							const len = this.#playerUnits.length;

							let minDist, closeEnemy;
							for (let index = 0; index < len; index++) {
								const enemy = this.#playerUnits[index],
									dist = countDistance(unit, enemy);
								if (!minDist || minDist > dist) {
									minDist = dist;
									closeEnemy = enemy;
								}
							}
							//console.log("closest enemy:", closeEnemy);
							unit.activateAttack(closeEnemy);
						} else if (isCollisionBuilding) {

						} else {
							const {x, y} = unit.countNextStep();
							if (this.isBoundariesCollision(x, y, unit)) {
								unit.activateIdle();
							} else {
								unit.stepMove(x, y);
							}	
						}
						break;
					case GOBLIN_TORCH.ACTIONS.IDLE:
						if (!this.#isGamePaused && unit.unitTactic === UNIT_TACTIC.AGGRESSIVE) {
							const enemyObjects = this.#playerUnits,
								len = enemyObjects.length;

							let closestDistance,
								closesUnit;
							for (let i = 0; i < len; ++i) {
								const object = enemyObjects[i],
									distance = pointToCircleDistance(unit.x, unit.y, {x: object.x, y: object.y, r: object.width/2});
								if (distance < UNIT_VIEW_RANGE) {
									if (!closestDistance || distance < closestDistance) {
										closestDistance = distance;
										closesUnit = object;
									}
								}
							}
							if (closestDistance) {
								unit.activateMoveToTargetPoint(closesUnit.x, closesUnit.y);
							}
						}
						break;
				}
			}
		}

		let eBuildingsLen = this.#enemyBuildings.length;
		for (let index = 0; index < eBuildingsLen; index++) {
			const unit = this.#enemyBuildings[index];
			if (unit.isRemoved) {
				this.#enemyBuildings.splice(index, 1);
				index--;
				eBuildingsLen--;
				continue;
			}
		}
	}
	#registerSystemEventsListeners() {
		this.iSystem.addEventListener(CONST.EVENTS.SYSTEM.RENDER.START, this.#render);
		this.eventsAggregator.addEventListener(GAME_EVENTS.GOLD_GRAB, this.#createGoldBag);
		this.eventsAggregator.addEventListener(GAME_EVENTS.GOLD_MINED, this.#goldMined);
		this.eventsAggregator.addEventListener(GAME_EVENTS.WOOD_GRAB, this.#createWoodBunch);
		this.eventsAggregator.addEventListener(GAME_EVENTS.WOOD_MINED, this.#woodMined);
		this.eventsAggregator.addEventListener(GAME_EVENTS.GOLD_MINE_EMPTY, this.#goldMineEmpty);
		this.eventsAggregator.addEventListener(GAME_EVENTS.TREE_EMPTY, this.#treeEmpty);
		this.eventsAggregator.addEventListener(GAME_EVENTS.REQUEST_FOR_CLOSEST_TREE, this.#requestForClosestTree);
		this.eventsAggregator.addEventListener(GAME_EVENTS.PEASANT_BUILT, this.#peasantBuilt);
		this.eventsAggregator.addEventListener(GAME_EVENTS.BUILDING_DONE, this.#buildingDone);

		this.eventsAggregator.addEventListener(GAME_EVENTS.CREATE_ARROW, this.#createArrow);
	}

	#unregisterSystemEventsListeners() {
		this.iSystem.removeEventListener(CONST.EVENTS.SYSTEM.RENDER.START, this.#render);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.GOLD_GRAB, this.#createGoldBag);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.GOLD_MINED, this.#goldMined);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.WOOD_GRAB, this.#createWoodBunch);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.WOOD_MINED, this.#woodMined);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.GOLD_MINE_EMPTY, this.#goldMineEmpty);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.TREE_EMPTY, this.#treeEmpty);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.REQUEST_FOR_CLOSEST_TREE, this.#requestForClosestTree);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.PEASANT_BUILT, this.#peasantBuilt);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.BUILDING_DONE, this.#buildingDone);
		this.eventsAggregator.removeEventListener(GAME_EVENTS.CREATE_ARROW, this.#createArrow);
	}

	#createArrow = (e) => {
		const [player, x, y, tX, tY, direction] = e.detail;
		const arrow = this.draw.image(x, y, 192, 192, "192Units", 182, [{x: -30, y: 0}, {x: 30, y: 0}]);
		arrow.rotation = direction;
		arrow.x = x;
		arrow.y = y;
		arrow.tX = tX;
		arrow.tY = tY;
		arrow.sortIndex = 3;
		this.#playerArrows.push(arrow);
	}

	#createGoldBag = (e) => {
		const peasantId = e.detail.peasantId,
			peasant = this.#playerUnits.find((unit) => unit.id === peasantId);

		
		const goldBag = this.draw.gold(peasant.x, peasant.y - peasant.height/4);
		goldBag.sortIndex = 3;
		peasant.addGoldBag(goldBag);
	}

	#createWoodBunch = (e) => {
		console.log("create wood");
		const peasantId = e.detail.peasantId,
			peasant = this.#playerUnits.find((unit) => unit.id === peasantId);

		
		const woodBunch = this.draw.wood(peasant.x, peasant.y + peasant.height / 4);
		woodBunch.sortIndex = 3;
		peasant.addWoodBunch(woodBunch);
	}

	#goldMined = (e) => {
		const amount = e.detail;
		this.#playerGold += 10;

		this.#playerGoldCounter.innerText = this.#playerGold;
	}

	#woodMined = (e) => {
		const amount = e.detail.amount;
		this.#playerWood += amount;

		this.#playerWoodCounter.innerText = this.#playerWood;
	}

	#goldMineEmpty = (e) => {
		this.goldMine1.imageIndex = 10;
	}

	#requestForClosestTree = (e) => {
		const peasant = e.detail.peasant,
			oldTreeIndex = e.detail.tree.index,
			tressLayer = this.#treesLayer.layerData.data,
			layerWidth = this.#treesLayer.layerData.width,
			layerHeight = this.#treesLayer.layerData.height,
			layerSize = layerWidth * layerHeight,
			nearestCellsIndexes = [],
			tilewidth = this.#treesLayer.tilemap.tilewidth,
			tileheight = this.#treesLayer.tilemap.tileheight;// -5; +5 on width and height

		for (let i = -5; i <= 5; i++) {
			let startItemIndex = oldTreeIndex + (i * this.#treesLayer.layerData.height); // *100

			const rowIndex = Math.floor(startItemIndex/this.#treesLayer.layerData.height);
			if (startItemIndex >= 0 && startItemIndex <= layerSize) { // remove top and bottom indexes overflow
				for (let k = -5; k <= 5; k++) {
					const itemIndex = startItemIndex + k,
						colIndex = itemIndex - rowIndex * this.#treesLayer.layerData.height;
						
					if (itemIndex >= 0 && colIndex >= 0 && colIndex <= layerWidth) { // remove left and right indexes overflow
						nearestCellsIndexes.push([rowIndex, colIndex, itemIndex]);
					}
				}
			}
		}
		
		let closestTree, closestDistance;

		nearestCellsIndexes.forEach((indexes) => {
				const rowIndex = indexes[0],
					colIndex = indexes[1],
					itemIndex = indexes[2],
					cellItem = tressLayer[itemIndex];
			if (cellItem !== 0 && cellItem !== TREE_STUB_INDEX) {
				console.log("item x: ", colIndex);
				console.log("item y: ", rowIndex);
				const cellItemPosX = colIndex * tilewidth + tilewidth / 2,
					cellItemPosY = rowIndex * tileheight + tileheight / 2,
					distance = countDistance({x: peasant.x, y: peasant.y}, {x: cellItemPosX, y: cellItemPosY});
				
					
					//console.log("distance: ", distance);
					//console.log("closest distance: ", closestDistance);
				if (!closestDistance || closestDistance > distance) {
					closestTree = this.#treesCutHealth.get(itemIndex);
					if (!closestTree) {
						closestTree = new Tree(cellItemPosX, cellItemPosY, TREE_FULL_HEALTH, itemIndex);
						this.#treesCutHealth.set(itemIndex, closestTree);
					}
					//console.log("set closest distance: ", distance);
					//console.log("tree: ", closestTree);
					closestDistance = distance;
				}
			}
		});
		//console.log("old tree is ", oldTreeIndex);
		//console.log("closest tree is ", closestTree.index);
		if (closestDistance) {
			this.#treesCutHealth.set(closestTree.index, closestTree);
			const playerUnit = this.#playerUnits.find((unit) => unit.id === peasant.id);
			playerUnit.activateDragTree(closestTree);
		}
	}

	recursiveSearchForClosestTree = () => {

	}
	#treeEmpty = (e) => {
		const treeIndex = e.detail.index;
		this.#treesCutHealth.delete(treeIndex);
		this.#treesLayer.layerData.data[treeIndex] = TREE_STUB_INDEX;
	}

	#peasantBuilt = (e) => {
		const townCenter = e.detail,
			newPeasant = new UnitPeasant(0, 0, townCenter, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.peasantAudio);

		let posX = 80,
			posY = 120;
		while (this.isObjectsCollision(townCenter.x + posX, townCenter.y + posY, newPeasant, this.#playerUnits)) {
			posX -= 18;
			console.log("collision shift left");
		}
		//console.log("no collision adding unit");
		newPeasant.x = townCenter.x + posX;
		newPeasant.y = townCenter.y + posY;
		this.addRenderObject(newPeasant);
		this.#playerUnits.push(newPeasant);

		this.#recalculatePeopleLimits();
		
	}

	#recalculatePeopleLimits = () => {
		this.#playerPeopleLimitCounter.innerText = this.#playerUnits.length + "/" + this.#playerPeopleLimit.toString();
	}

	#buildingDone = (e) => {
		const house = e.detail,
			newPeasant = new UnitPeasant(0, 0, house, this.draw, this.iSystem.systemSettings.gameOptions.showLifeLines, this.eventsAggregator, this.peasantAudio);
		console.log(e.detail);
		let posX = 20,
			posY = 20;
		while (this.isObjectsCollision(house.x + posX, house.y + posY, newPeasant, this.#playerUnits)) {
			posX -= 18;
			console.log("collision shift left");
		}

		newPeasant.x = house.x + posX;
		newPeasant.y = house.y + posY;
		this.addRenderObject(newPeasant);
		this.#playerUnits.push(newPeasant);
		
		let doneIndex = 0;
		switch (house.imageIndex) {
			case 1: // house
				break;
			case 4: // barracks
				doneIndex = 3;
				break;
		}
		house.imageIndex = doneIndex;
		this.#playerPeopleLimit += 3;
		this.#playerPeopleLimitCounter.innerText = this.#playerUnits.length + "/" + this.#playerPeopleLimit.toString();
	}

	move(dir) {
		let newX = this.tank.x, 
			newY = this.tank.y;
		switch(dir) {
			case "left":
				newX = newX - 1;
				break;
			case "right":
				newX = newX + 1;
				break;
			case "top":
				newY = newY - 1;
				break;
			case "bottom":
				newY = newY + 1;
				break;
		}
		if (!this.isBoundariesCollision(newX, newY, this.tank)) {
			this.tank.x = newX;
			this.tank.y = newY;
			this.gun.x = newX;
			this.gun.y = newY;
			this.stageData.centerCameraPosition(newX, newY);
		}
	}
	
	stopAction = () => {
		clearInterval(this.timer);
		this.timer = null;
	}
	
	fireAction = () => {
		this.person.emit("fire");
	}
}

class EvensAggregator extends EventTarget {
}

class Tree {
	#x;
	#y;
	#health;
	#index;
	constructor(x, y, treeHealth, index) {
		this.#x = x;
		this.#y = y;
		this.#index = index;
		this.#health = treeHealth;
	}

	get index() {
		return this.#index;
	}

	get x() {
		return this.#x;
	}

	get y() {
		return this.#y;
	}

	get health() {
		return this.#health;
	}

	set health (value) {
		this.#health = value;
	}
}