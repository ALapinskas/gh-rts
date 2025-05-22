import { GameStage, CONST } from "jsge";
import { utils } from "jsge";
import { GAME_STAGES, GAME_EVENTS } from "./const.js";
import UiApp from "./ui/ui-init.js";
import { createRoot } from 'react-dom/client';
import React from "react";
import { OptionsCard } from "./ui/options.js";

const isPointRectIntersect = utils.isPointRectIntersect;
const LEFT_SHIFT = -70;
const MENU_CLICK_AUDIO_NAME = "menu_click";

export class StartStage extends GameStage {
    #menuClickMediaElement;
    uiApp;

    register() {
        this.iLoader.addAudio(MENU_CLICK_AUDIO_NAME, "./assets/audio/select_001.ogg");
        this.iLoader.addEventListener("error", this.#loaderErrorHandler);

        const domNode = document.getElementById("ui-root");
        window.React = React;
        
        const root = createRoot(domNode);

        this.uiApp = UiApp(this.iSystem);
        root.render(this.uiApp);
    }

    init() {
        const [w, h] = this.stageData.canvasDimensions;
        
        this.background = this.draw.rect(0, 0, w, h, "rgba(120, 120, 120, 0.6)");
        
        this.navItemLevel1 = this.draw.text(w/2 + LEFT_SHIFT, h/2, "Start level 1", "20px sans-serif", "black");
        this.navItemLevel2 = this.draw.text(w/2 + LEFT_SHIFT, h/2 + 40, "Start level 2", "20px sans-serif", "black");
        //this.#createOptionsBlock();
        this.audio.registerAudio(MENU_CLICK_AUDIO_NAME);
        this.#menuClickMediaElement = this.audio.getAudio(MENU_CLICK_AUDIO_NAME);
        this.#drawOptions();
    }

    start() {
        console.log("start stage");
        this.registerEventListeners();
    }

    stop() {
        this.unregisterEventListeners();
    }

    registerEventListeners() {
        const canvas = this.canvasHtmlElement; 
        canvas.addEventListener("mousemove", this.#mouseHoverEvent);            
        canvas.addEventListener("click", this.#mouseClickEvent);
        document.addEventListener("keydown", this.#pressKeyAction);
        this.iSystem.addEventListener(GAME_EVENTS.DIALOG.CHANGE_OPTIONS, this.#changeOptions);
        
    }

    #drawOptions = () => {
        const [w, h] = this.stageData.canvasDimensions;
        this.iSystem.emit(GAME_EVENTS.DIALOG.CHANGE_STYLE, w/2 + LEFT_SHIFT + LEFT_SHIFT - 40, this.navItemLevel2.y + 20);
    }

    #changeOptions = (e) => {
        const options = e.data[0];
        //console.log("changed options: ", options);
        //console.log(this.iSystem.systemSettings.gameOptions);
        if (options["showBoundaries"] === true) {
            this.iSystem.systemSettings.gameOptions.debug.boundaries.drawLayerBoundaries = true;
            this.iSystem.systemSettings.gameOptions.debug.boundaries.drawObjectBoundaries = true;
        } else if (options["showBoundaries"] === false) {
            this.iSystem.systemSettings.gameOptions.debug.boundaries.drawLayerBoundaries = false;
            this.iSystem.systemSettings.gameOptions.debug.boundaries.drawObjectBoundaries = false;
        } else if (options["showLifeLines"] === true) {
            this.iSystem.systemSettings.gameOptions.showLifeLines = true;
        } else if (options["showLifeLines"] === false) {
            this.iSystem.systemSettings.gameOptions.showLifeLines = false;
        }
    }

    #mouseHoverEvent = (event) => {
        const canvas = this.canvasHtmlElement,
            isNav1Traversed = isPointRectIntersect(event.offsetX, event.offsetY, this.navItemLevel1.boundariesBox),
            isNav2Trav = isPointRectIntersect(event.offsetX, event.offsetY, this.navItemLevel2.boundariesBox);
            
        if (isNav1Traversed) {
            this.navItemLevel1.strokeStyle = "rgba(0, 0, 0, 0.3)";
        } else if (this.navItemLevel1.strokeStyle) {
            this.navItemLevel1.strokeStyle = undefined;
        }

        if (isNav2Trav) {
            this.navItemLevel2.strokeStyle = "rgba(0, 0, 0, 0.3)";
        } else if (this.navItemLevel2.strokeStyle) {
            this.navItemLevel2.strokeStyle = undefined;
        }

        if (isNav1Traversed || isNav2Trav) {
            canvas.style.cursor = "pointer";
        } else {
            canvas.style.cursor = "default";
        }

        
    };

    #mouseClickEvent = (event) => {

        if (isPointRectIntersect(event.offsetX, event.offsetY, this.navItemLevel1.boundariesBox)) {
            this.#menuClickMediaElement.play();
            this.iSystem.stopGameStage(GAME_STAGES.START);
            this.iSystem.emit(GAME_EVENTS.DIALOG.CHANGE_STATE, true, 1);
            this.iSystem.startGameStage(GAME_STAGES.STAGE_1);
        }
        if (isPointRectIntersect(event.offsetX, event.offsetY, this.navItemLevel2.boundariesBox)) {
            this.#menuClickMediaElement.play();
            this.iSystem.stopGameStage(GAME_STAGES.START);
            this.iSystem.emit(GAME_EVENTS.DIALOG.CHANGE_STATE, true, 2);
            this.iSystem.startGameStage(GAME_STAGES.STAGE_2);
        }
    };

    #loaderErrorHandler = (error) => {
        console.log("--->>>>error");
        console.log(error);
    }

    unregisterEventListeners() {
        const canvas = this.canvasHtmlElement;
        canvas.removeEventListener("mousemove", this.#mouseHoverEvent); 
        canvas.removeEventListener("click", this.#mouseClickEvent);
        document.removeEventListener("keydown", this.#pressKeyAction);
        canvas.style.cursor = "default";
    }

    #pressKeyAction = (event) => {
        console.log("press key, " + event.code);
    };
}