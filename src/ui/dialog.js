import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { useState } from "react";
import { GAME_EVENTS, STAGE_TEXTS } from "../const.js";
export const LevelDialog = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [level, setLevel] = useState(0);
    const [messageKey, setMessageKey] = useState("");

    console.log("======>>>>>>level dialog, open: ", open);
    console.log(eventManger);
    eventManger.addEventListener(GAME_EVENTS.SYSTEM_EVENTS.OPEN_DIALOG, (e) => {
        const { level, messageKey, title, text } = e.data[0];
        
        setTitle(title);
        setText(text);
        setLevel(level);
        setState(true);
        setMessageKey(messageKey);
    });

    function closeDialog() {
        setState(false);
        eventManger.emit(GAME_EVENTS.DIALOG_EVENTS.CLOSED, {currentLevel: level, currentState: messageKey});
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
                <Button onClick={() => closeDialog()}>Понятно</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                <CloseButton onClick={() => closeDialog()} size="sm"  />
                </Dialog.CloseTrigger>
            </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
        </Dialog.Root>
    )
}