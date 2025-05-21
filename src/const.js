
const BUILDING_STATE = {
    READY: "READY",
    BUILDING_SELF: "BUILDING_SELF",
    BUILDING_UNIT: "BUILDING_UNIT"
};

const TREE_FULL_HEALTH = 100;
const GOLD_MINE_GOLD_AMOUNT = 10000;
const treesIndexes = [61, 62, 63];
const TREE_STUB_INDEX = 69;

const UNIT_VIEW_RANGE = 300;

const GAME_EVENTS = {
	GOLD_GRAB: "GOLD_GRAB",
	GOLD_MINED: "GOLD_MINED",
	WOOD_GRAB: "WOOD_GRAB",
	WOOD_MINED: "WOOD_MINED",
	GOLD_MINE_EMPTY: "GOLD_MINE_EMPTY",
	TREE_EMPTY: "TREE_EMPTY",
	REQUEST_FOR_CLOSEST_TREE: "REQUEST_FOR_CLOSEST_TREE",
	PEASANT_BUILT: "PEASANT_BUILT",
	BUILDING_DONE: "BUILDING_DONE",
	LEVEL: {
		START: "startLevel",
		WIN_L_1: "victoryLevel1",
		WIN_L_2: "victoryLevel2"
	},
	DIALOG: {
		CHANGE_STATE: "changeState"	
	}
}

const UNIT_DIRECTION = {
	LEFT: "LEFT",
	RIGHT: "RIGHT"
}

const GAME_AUDIO_TYPES = {
	WHAT: "WHAT",
	YES: "YES",
	ATTACK: "ATTACK",
	FIGHT: "FIGHT",
	DEATH: "DEATH"
}

const PEASANT = {
	ACTIONS: {
		IDLE: "IDLE",
		MOVE: "MOVE",
		FIGHT: "FIGHT",
		BUILD: "BUILD",
		DRAG_GOLD: "DRAG_GOLD",
		CHOP_WOOD: "CHOP_WOOD",
		DRAG_WOOD: "DRAG_WOOD",
	},
	ANIMATIONS: {
		MOVE_RIGHT: "MOVE_RIGHT",
		MOVE_LEFT: "MOVE_LEFT",
		MOVE_UP: "MOVE_UP",
		MOVE_DOWN: "MOVE_DOWN",
		CARRY_RIGHT: "CARRY_RIGHT",
		CARRY_LEFT: "CARRY_LEFT",
		CARRY_UP: "CARRY_UP",
		CARRY_DOWN: "CARRY_DOWN",
		FIGHT_RIGHT: "FIGHT_RIGHT",
		FIGHT_LEFT: "FIGHT_LEFT",
		FIGHT_UP: "FIGHT_UP",
		FIGHT_DOWN: "FIGHT_DOWN"
	},
	AUDIO: {
		WHAT1: "WHAT1",
		WHAT2: "WHAT2",
		WHAT3: "WHAT3",
		YES1: "YES1",
		YES2: "YES2",
		YES3: "YES3",
		DEATH1: "DEATH1"
	}
}

const KNIGHT = {
	ACTIONS: {
		IDLE: "IDLE",
		MOVE: "MOVE",
		FIGHT: "FIGHT"
	},
	
	ANIMATIONS: {
		IDLE_RIGHT: "IDLE_RIGHT",
		MOVE_RIGHT: "MOVE_RIGHT",
		FIGHT_RIGHT_1: "FIGHT_RIGHT_1",
		FIGHT_RIGHT_2: "FIGHT_RIGHT_2",
		IDLE_LEFT: "IDLE_LEFT",
		MOVE_LEFT: "MOVE_LEFT",
		FIGHT_LEFT_1: "FIGHT_LEFT_1",
		FIGHT_LEFT_2: "FIGHT_LEFT_2",
		FIGHT_UP_1: "FIGHT_UP_1",
		FIGHT_UP_2: "FIGHT_UP_2",
		FIGHT_DOWN_1: "FIGHT_DOWN_1",
		FIGHT_DOWN_2: "FIGHT_DOWN_2"
	},

	AUDIO: {
		WHAT1: "K_WHAT1",
		WHAT2: "K_WHAT2",
		WHAT3: "K_WHAT3",
		YES1: "K_YES1",
		YES2: "K_YES2",
		YES3: "K_YES3",
		ATTACK1: "K_ATTACK1",
		ATTACK2: "K_ATTACK2",
		FIGHT1: "K_FIGHT1",
		FIGHT2: "K_FIGHT2",
		DEATH1: "K_DEATH1"
	}
}

const GOBLIN_TORCH = {
	ACTIONS: {
		IDLE: "IDLE",
		MOVE: "MOVE",
		FIGHT: "FIGHT"
	},
	
	ANIMATIONS: {
		IDLE_RIGHT: "IDLE_RIGHT",
		IDLE_LEFT: "IDLE_LEFT",
		MOVE_RIGHT: "MOVE_RIGHT",
		MOVE_LEFT: "MOVE_LEFT", 
		FIGHT_RIGHT_1: "FIGHT_RIGHT",
		FIGHT_LEFT_1: "FIGHT_LEFT",
		FIGHT_UP_1: "FIGHT_UP",
		FIGHT_DOWN_1: "FIGHT_DOWN"
	},
	
	AUDIO: {
		WHAT1: "G_WHAT1",
		WHAT2: "G_WHAT2",
		WHAT3: "G_WHAT3",
		YES1: "G_YES1",
		YES2: "G_YES2",
		YES3: "G_YES3",
		DEATH1: "G_DEATH1"
	}
}

const GOBLIN_TOWER = {
	ANIMATIONS: {
		IDLE: "IDLE"
	}
}

const ATLAS = {
	"192x192": "192x192",
	"192Units": "192Units"
};


const GAME_UNITS = {
	PEASANT: { 
		name: "PEASANT", 
		cost: { g: 100, w: 0 }, 
		duration: 1000,
		attackSpeed: 800,
		attackDamage: 10, 
		health: 100 },
	KNIGHT: { 
		name: "KNIGHT", 
		atlasKey: ATLAS["192Units"],
		cost: {g: 400, w: 0 }, 
		duration: 2000,
		attackSpeed: 800,
		attackDamage: 30,
		health: 150
	},
	ARCHER: { name: "ARCHER", cost: {g: 300, w: 100 }, duration: 2000 },
	GOBLIN_TORCH: { 
		name: "GOBLIN_TORCH", 
		atlasKey: ATLAS["192Units"], 
		cost: {g: 200, w: 100 }, 
		duration: 2000,
		attackSpeed: 800,
		attackDamage: 20, 
		health: 100 },
	BARRACKS: { name: "BARRACKS", cost: { g: 800, w: 500 }, duration: 5000, health: 1000 },
	HOUSE: { name: "HOUSE", cost: { g: 300, w: 300 }, duration: 3000, health: 500 },
	TOWN_CENTER: { name: "TOWN_CENTER", cost: {g: 1000, w: 1000}, duration: 10000, health: 5000 },
	GOBLIN_HOUSE: { name: "GOBLIN_HOUSE", atlasKey: ATLAS["192x192"], duration: 3000, health: 500 },
	GOBLIN_TOWER: { name: "GOBLIN_TOWER", atlasKey: ATLAS["192x192"], duration: 3000, health: 1000 },
	GOLD_MINE: { name: "GOLD_MINE" }
}

const GAME_OBJECTS = {
	SKILL: {name: "SKILL", atlasKey: ATLAS["192Units"] }
}

const GAME_STAGES = {
	START: "START",
	STAGE_1: "STAGE_1",
	STAGE_2: "STAGE_2"
}

const STAGE_TEXTS = {
	STAGE_1: {
		START: {
			title:"Глава 1.",
			text: "Эти леса кишат гоблинами. Найдите их базу и уничтожьте!"
		},
		WIN: {
			title:"Победа!",
			text: "Лес зачищен, поздравляю!"
		}
	},
	STAGE_2: {
		START: {
			title:"Глава 2.",
			text: "Тут должен быть текст - описание главы 2"
		},
		WIN: {
			title:"Победа!",
			text: "Текст - победы главы 2"
		}
	}
}

const UNIT_TACTIC = {
	AGGRESSIVE: "aggressive",
	DEFENSE: "defense",
	RUN_AWAY: "run_away"
}

export { UNIT_DIRECTION, UNIT_VIEW_RANGE, UNIT_TACTIC, GAME_EVENTS, GAME_UNITS, GAME_OBJECTS, GAME_AUDIO_TYPES, ATLAS, PEASANT, KNIGHT, GOBLIN_TORCH, GOBLIN_TOWER, TREE_FULL_HEALTH, GOLD_MINE_GOLD_AMOUNT, TREE_STUB_INDEX, BUILDING_STATE, GAME_STAGES, STAGE_TEXTS }