import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { Avatar, Card, For, Stack, Spinner } from "@chakra-ui/react"
import { GAME_EVENTS, STORE_ITEMS, ENV } from "../const.js";
import { useEffect, useState } from "react";
import { ethers, BigNumber } from "ethers";
import { Toaster, toaster } from "../components/ui/toaster.jsx"

import ContractArtifact from "../../GameStoreContract/contractArtifacts/Store.sol/Store.json";
const abi = ContractArtifact.abi;
import OracleArtifact from "../../GameStoreContract/contractArtifacts/MockAggregator.sol/MockAggregator.json";

const CONTRACT_ADDRESS = process.env.MODE === "development" ? process.env.DEV_CONTRACT_ADDRESS : process.env.PROD_LOCAL_CONTRACT_ADDRESS;
const ORACLE_ADDRESS = process.env.MODE === "development" ? process.env.DEV_ORACLE_ADDRESS : process.env.PROD_LOCAL_ORACLE_ADDRESS;
export const StoreDialog = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [user, setUser] = useState(null);
    const [provider, setProvider] = useState();
    const [oracleContract, setOracleContract] = useState(null);
    const [contract, setContract] = useState();
    const [items, setItems] = useState(new Set());

    useEffect(() => {
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);

            // in dev mode our oracle mock
            // deployed on separate address in anvil testnet
            if (process.env.MODE === ENV.DEV) {
                const oracleContract = new ethers.Contract(ORACLE_ADDRESS, OracleArtifact.abi, provider);
                setOracleContract(oracleContract);
            } else if (process.env.MODE === ENV.PROD) {
                const oracleContract = new ethers.Contract(ORACLE_ADDRESS, OracleArtifact.abi, provider);
                setOracleContract(oracleContract);
            }
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
            
            contractLocal = new ethers.Contract(CONTRACT_ADDRESS, abi, signerObj);
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

    const buyAction = async(itemKey) => {
        setIsLoading(true);
        const itemPriceUsd = STORE_ITEMS[itemKey].PRICE,
            itemId = STORE_ITEMS[itemKey].ID,
            priceInWei = (await getPriceInWei(itemPriceUsd)).toFixed(0);
        console.log("price in wei: ", priceInWei);
        // console.log("correct price 1: 1305653");
        contract.purchaseItem(itemId, {
            value: ethers.parseUnits(priceInWei, "wei"),   // <-- attach the wei
            gasLimit: 300_000,
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

    async function getPriceInWei(priceUsd) {
        const roundData = await oracleContract.latestRoundData(),
            { 
                roundId,         // uint80: ID раунда
                answer,          // int256: Цена (со всеми знаками после запятой)
                startedAt,       // uint256: Метка времени начала
                updatedAt,       // uint256: Метка времени обновления
                answeredInRound  // uint80: ID раунда, в котором был получен ответ
            } = roundData,
            currentSolUsdPrice = Number(BigInt(answer)),
            solDecimals = Number(BigInt(await oracleContract.decimals())),
            resultDecimals = 9; // 1 SOL = 10⁹ wei
        console.log(solDecimals);
        console.log("currentSolUsdPrice: ", currentSolUsdPrice)
        const itemPriceWithResultDecimalsUsd = priceUsd * (10 ** resultDecimals) * (10 ** solDecimals);
        const itemCostWei = itemPriceWithResultDecimalsUsd / currentSolUsdPrice;
        console.log(itemCostWei);
        return parseInt(itemCostWei);
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
                        {Object.keys(STORE_ITEMS).map((itemKey, idx) => (
                            <Card.Root width="320px" key={idx}>
                                <Card.Body gap="2">
                                <Avatar.Root size="lg" shape="rounded">
                                    <Avatar.Image src="./assets/tool_sword_b.png" />
                                    <Avatar.Fallback name={STORE_ITEMS[itemKey].TITLE} />
                                </Avatar.Root>
                                <Card.Title mb="2">{STORE_ITEMS[itemKey].TITLE}</Card.Title>
                                <Card.Description>{STORE_ITEMS[itemKey].DESCRIPTION}</Card.Description>
                                </Card.Body>
                                <Card.Footer justifyContent="flex-end">
                                    { items.has(STORE_ITEMS[itemKey].ID) ? 
                                    "item bought"
                                    :
                                        <Button onClick={() => buyAction(itemKey)}>Buy ({STORE_ITEMS[itemKey].PRICE} USD)</Button>
                                    }
                                </Card.Footer>
                            </Card.Root>
                        ))}
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