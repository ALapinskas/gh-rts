'use client'

import { System, SystemSettings, DrawImageObject } from "jsge";
import { Stage1 } from "./stage1.js";
import { Stage2 } from "./stage2.js";
import { GAME_STAGES } from "../const.js";
import { StartStage } from "./start.js";

const app = new System(SystemSettings);

const createGoldBag = (x, y) => {
    return new DrawImageObject(x, y, 64, 64, "tinyswords64x64", 50);
}

const createWoodBunch = (x, y) => {
    return new DrawImageObject(x, y, 64, 64, "tinyswords64x64", 51);
}

app.registerStage(GAME_STAGES.START, StartStage);
app.registerStage(GAME_STAGES.STAGE_1, Stage1);
app.registerStage(GAME_STAGES.STAGE_2, Stage2);
app.iSystem.iExtension.registerDrawObject("gold", createGoldBag);
app.iSystem.iExtension.registerDrawObject("wood", createWoodBunch);
export { GAME_STAGES };
export default app;