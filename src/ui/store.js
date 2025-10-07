import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { Avatar, Card, For, Stack } from "@chakra-ui/react"
import { GAME_EVENTS, STORE_ITEMS } from "../const.js";
import { useEffect, useState } from "react";

export const StoreDialog = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [user, setUser] = useState(false);

    eventManger.addEventListener(GAME_EVENTS.USER_EVENTS.LOGIN, (e) => {
        const account = e.data;
        setUser(account);
    });

    eventManger.addEventListener(GAME_EVENTS.USER_EVENTS.LOGOUT, () => {
        setUser(false);
    });

    const closeDialog = () => {
        setState(false);
        eventManger.emit(GAME_EVENTS.DIALOG_EVENTS.CLOSED, {});
    }

    const openDialog = () => {
        setState(true);
    }

    const buyAction = (item) => {
        console.log("buy item: ", item);
    }

    return (
        <>
        <div className="store-button">
            {user ? <Button onClick={openDialog}>Store</Button> : "Store will be available after login"}
        </div>
        <Dialog.Root lazyMount open={isOpen}  size={"xl"}>
        <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
            <Dialog.Content>
                <div className="store">
                    <h1>Game Store</h1>
                    <div className="store-card">
                        <Stack gap="4" direction="row" wrap="wrap">
                        <Card.Root width="320px" key={1}>
                            <Card.Body gap="2">
                            <Avatar.Root size="lg" shape="rounded">
                                <Avatar.Image src="./assets/tool_sword_b.png" />
                                <Avatar.Fallback name={STORE_ITEMS.KNIGHT_HIT_1} />
                            </Avatar.Root>
                            <Card.Title mb="2">Knight training</Card.Title>
                            <Card.Description>
                                Additional melee hit for knight. <br />
                                + 3 damage on every 3rd hit.
                            </Card.Description>
                            </Card.Body>
                            <Card.Footer justifyContent="flex-end">
                            <Button variant="outline">View</Button>
                            <Button onClick={() => buyAction(STORE_ITEMS.KNIGHT_HIT_1)}>Buy (0.1eth)</Button>
                            </Card.Footer>
                        </Card.Root>
                        <Card.Root width="320px" key={2}>
                            <Card.Body gap="2">
                            <Avatar.Root size="lg" shape="rounded">
                                <Avatar.Image src="./assets/tool_sword_b.png" />
                                <Avatar.Fallback name="Knight sword sharpening" />
                            </Avatar.Root>
                            <Card.Title mb="2">Knight sword sharpening</Card.Title>
                            <Card.Description>
                                Additional melee damage for knight.<br />
                                 + 1 damage on every hit.
                            </Card.Description>
                            </Card.Body>
                            <Card.Footer justifyContent="flex-end">
                            <Button variant="outline">View</Button>
                            <Button onClick={() => buyAction(STORE_ITEMS.KNIGHT_SWORD_SHARPENING)}>Buy (0.1eth)</Button>
                            </Card.Footer>
                        </Card.Root>
                        <Card.Root width="320px" key={3}>
                            <Card.Body gap="2">
                            <Avatar.Root size="lg" shape="rounded">
                                <Avatar.Image src="./assets/tool_sword_b.png" />
                                <Avatar.Fallback name="" />
                            </Avatar.Root>
                            <Card.Title mb="2">Archer burning arrows</Card.Title>
                            <Card.Description>
                                Archer burning arrows. <br />
                                +5 damage for buildings.
                            </Card.Description>
                            </Card.Body>
                            <Card.Footer justifyContent="flex-end">
                            <Button variant="outline">View</Button>
                            <Button onClick={() => buyAction(STORE_ITEMS.ARCHER_FLAMING_ARROWS)}>Buy (0.1eth)</Button>
                            </Card.Footer>
                        </Card.Root>
                        </Stack>
                    </div>
                </div>
                <Dialog.CloseTrigger asChild>
                <CloseButton onClick={() => closeDialog()} size="sm"  />
                </Dialog.CloseTrigger>
            </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
        </Dialog.Root>
        </>
    )
}