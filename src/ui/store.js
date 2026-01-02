import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { Avatar, Card, For, Stack, Spinner } from "@chakra-ui/react"
import { GAME_EVENTS, STORE_ITEMS } from "../const.js";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Toaster, toaster } from "../components/ui/toaster.jsx"

import ContractArtifact from "../../GameStoreContract/contractArtifacts/Store.sol/Store.json";
const abi = ContractArtifact.abi;
export const StoreDialog = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [user, setUser] = useState(false);
    const [provider, setProvider] = useState();
    const [contract, setContract] = useState();
    const [items, setItems] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (window.ethereum) {
            setProvider(new ethers.BrowserProvider(window.ethereum));
        }
        
    }, []);

    eventManger.addEventListener(GAME_EVENTS.USER_EVENTS.LOGIN, async(e) => {
        const accountArray = e.data;
        const userPublic = accountArray[0];
        setUser(userPublic);

        if (provider) {
            setIsLoading(true);
            const signerObj = await provider.getSigner();
            
            /**
             * @type {ethers.Contract}
             */
            let contractLocal;
            
            contractLocal = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, signerObj);
            //contractLocal.setNumber(0);
            setContract(contractLocal);
            /**
             * @type {ethers}
             */
            const userItems = await contractLocal.getBoughtItems(userPublic);
            
            let itemsIds = new Set();
            for(const item of userItems) {
                itemsIds.add(Number(item));
            }
            setItems(itemsIds);
            setIsLoading(false);
        }
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

    const buyAction = async(itemId) => {
        setIsLoading(true);
        contract.purchaseItem(itemId, {
            value: ethers.parseUnits("2", "gwei"),   // <-- attach the wei
            gasLimit: 100000,
        }).then((tx) => {
            return tx.wait();
        }).then((receipt) => {
            const newItems = items.add(itemId);
            setItems(newItems);
            toaster.create({
                description: "Transaction succeeded",
                type: "success",
                closable: true,
            });
        })
        .catch((err) => {
            console.error(err);
            toaster.create({
                description: "Transaction failed",
                type: "error",
                closable: true,
            });
        })
        .finally(() => {
            setIsLoading(false);
        });
    }

    const viewAction = async(itemId) => {
        const itemsBought = await contract.getBoughtItems(user);
        console.log("items bought: ", itemsBought);
        for(const item of itemsBought) {
            console.log("item id: ", Number(item));
        }
    }

    return (
        <>
        <div className="store-button">
            {user ? <Button onClick={openDialog}>Demo store</Button> : "Store will be available after login"}
        </div>
        <Dialog.Root lazyMount open={isOpen}  size={"xl"}>
        <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
            <Dialog.Content>
                <div className="store">
                    <h1>Game Store</h1>
                    <p>This is a demo store, to demonstrate smart contract work.</p>
                    <div className="store-card">
                        { isLoading ? 
                        <Spinner size="lg" /> :
                        <Stack gap="4" direction="row" wrap="wrap">
                        <Card.Root width="320px" key={1}>
                            <Card.Body gap="2">
                            <Avatar.Root size="lg" shape="rounded">
                                <Avatar.Image src="./assets/tool_sword_b.png" />
                                <Avatar.Fallback name={STORE_ITEMS.KNIGHT_TRAINING.TITLE} />
                            </Avatar.Root>
                            <Card.Title mb="2">{STORE_ITEMS.KNIGHT_TRAINING.TITLE}</Card.Title>
                            <Card.Description>{STORE_ITEMS.KNIGHT_TRAINING.DESCRIPTION}</Card.Description>
                            </Card.Body>
                            <Card.Footer justifyContent="flex-end">
                                { items.has(STORE_ITEMS.KNIGHT_TRAINING.ID) ? 
                                  "item bought"
                                  :
                                    <Button onClick={() => buyAction(STORE_ITEMS.KNIGHT_TRAINING.ID)}>Buy (2 gwei)</Button>
                                }
                            </Card.Footer>
                        </Card.Root>
                        <Card.Root width="320px" key={2}>
                            <Card.Body gap="2">
                            <Avatar.Root size="lg" shape="rounded">
                                <Avatar.Image src="./assets/tool_sword_b.png" />
                                <Avatar.Fallback name={STORE_ITEMS.KNIGHT_SWORD_SHARPENING.TITLE} />
                            </Avatar.Root>
                            <Card.Title mb="2">{STORE_ITEMS.KNIGHT_SWORD_SHARPENING.TITLE}</Card.Title>
                            <Card.Description>{STORE_ITEMS.KNIGHT_SWORD_SHARPENING.DESCRIPTION}</Card.Description>
                            </Card.Body>
                            <Card.Footer justifyContent="flex-end">
                                { items.has(STORE_ITEMS.KNIGHT_SWORD_SHARPENING.ID) ? 
                                  "item bought"
                                  :
                                    <Button onClick={() => buyAction(STORE_ITEMS.KNIGHT_SWORD_SHARPENING.ID)}>Buy (2 gwei)</Button>
                                }
                            </Card.Footer>
                        </Card.Root>
                        <Card.Root width="320px" key={3}>
                            <Card.Body gap="2">
                            <Avatar.Root size="lg" shape="rounded">
                                <Avatar.Image src="./assets/tool_sword_b.png" />
                                <Avatar.Fallback name={STORE_ITEMS.ARCHER_FLAMING_ARROWS.TITLE} />
                            </Avatar.Root>
                            <Card.Title mb="2">{STORE_ITEMS.ARCHER_FLAMING_ARROWS.TITLE}</Card.Title>
                            <Card.Description>{STORE_ITEMS.ARCHER_FLAMING_ARROWS.DESCRIPTION}</Card.Description>
                            </Card.Body>
                            <Card.Footer justifyContent="flex-end">
                                { items.has(STORE_ITEMS.ARCHER_FLAMING_ARROWS.ID) ? 
                                  "item bought"
                                  :
                                    <Button onClick={() => buyAction(STORE_ITEMS.ARCHER_FLAMING_ARROWS.ID)}>Buy (2 gwei)</Button>
                                }
                            </Card.Footer>
                        </Card.Root>
                        </Stack>}
                    </div>
                </div>
                <Dialog.CloseTrigger asChild>
                <CloseButton onClick={() => closeDialog()} size="sm"  />
                </Dialog.CloseTrigger>
            </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
        </Dialog.Root>
        <Toaster />
        </>
    )
}