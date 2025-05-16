import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { useState } from "react";
import { GAME_EVENTS, STAGE_TEXTS } from "../const.js";
export const LevelDialog = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [level, setLevel] = useState(0);

    console.log("======>>>>>>level dialog, open: ", open);
    console.log(eventManger);
    eventManger.addEventListener(GAME_EVENTS.DIALOG.CHANGE_STATE, (e) => {
        const [open, level] = e.data;
        if (open === true) {
            if (level === 1) {
                setTitle(STAGE_TEXTS.STAGE_1.START.title);
                setText(STAGE_TEXTS.STAGE_1.START.text);
                setLevel(1);
            } else if (level === 2) {
                setTitle(STAGE_TEXTS.STAGE_2.START.title);
                setText(STAGE_TEXTS.STAGE_2.START.text);
                setLevel(2);
            }
            setState(true);
            
        }
        
    });

    eventManger.addEventListener(GAME_EVENTS.LEVEL.WIN_L_1, (e) => {   
        setTitle(STAGE_TEXTS.STAGE_1.WIN.title);
        setText(STAGE_TEXTS.STAGE_1.WIN.text);
        setState(true);
    });

    function startLevel() {
        setState(false);
        eventManger.emit(GAME_EVENTS.LEVEL.START, level);
    }
    return (
        <Dialog.Root lazyMount open={isOpen}>
        <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
            <Dialog.Content>
                <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                <p>
                    {text}
                </p>
                </Dialog.Body>
                <Dialog.Footer>
                <Button onClick={() => startLevel()}>Понятно</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                <CloseButton onClick={() => startLevel()} size="sm"  />
                </Dialog.CloseTrigger>
            </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
        </Dialog.Root>
    )
}