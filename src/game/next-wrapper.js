'use client'

import { useEffect, createElement } from 'react';
import UiApp from "../ui/ui-init.js";
import { createRoot } from 'react-dom/client';

export default function NextJsJSGEWrapper() {
    useEffect(() => {
        // Для корректной загрузки jsge в next.js нужно использовать динамический импорт
        import('./index').then(({default: app, GAME_STAGES}) => {
            
            const domNode = document.getElementById("ui-root");
            const root = createRoot(domNode);
            //const uiApp = UiApp(app.iSystem);
            const uiAppElement = createElement(
                UiApp,                     // компонент
                { eventManger: app.iSystem }, // props
                null                       // дочерние элементы (не нужны)
            );
            root.render(uiAppElement);

            app.preloadAllData().then(() => {
                app.iSystem.startGameStage(GAME_STAGES.START);
            });
        }); 
  }, []);

  // The canvas element that JSGE will attach to
  return <div id="ui-root"></div>;
}