import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { Avatar, Card, For, Stack, Spinner } from "@chakra-ui/react"
import { GAME_EVENTS, STORE_ITEMS, ENV, APP_ERRORS } from "../const.js";
import { useEffect, useState } from "react";
import { ethers, BigNumber } from "ethers";
import { Toaster, toaster } from "../components/ui/toaster.jsx"

import ContractArtifact from "../../GameStoreContract/contractArtifacts/Store.sol/Store.json";
const abi = ContractArtifact.abi;
import OracleArtifact from "../../GameStoreContract/contractArtifacts/MockAggregator.sol/MockAggregator.json";

console.log("process.env: ", process.env);
const CONTRACT_ADDRESS = process.env.MODE === "development" ? JSON.parse(process.env.DEV_CONTRACT_ADDRESS) : JSON.parse(process.env.PROD_CONTRACT_ADDRESS);
const ORACLE_ADDRESSES = process.env.MODE === "development" ? JSON.parse(process.env.DEV_ORACLES) : JSON.parse(process.env.PROD_ORACLES);
const OracleKeys = Object.keys(ORACLE_ADDRESSES);

export const StoreDialog = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [user, setUser] = useState(null);
    const [provider, setProvider] = useState();
    const [isContractAvailable, setIsContractAvailable] = useState(false);
    const [oracleContract, setOracleContract] = useState(null);
    const [tokenType, setTokenType] = useState(OracleKeys[0]);
    const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESS[tokenType]);
    const [contract, setContract] = useState();
    const [items, setItems] = useState(new Set());

    useEffect(() => {
        if (window.ethereum && tokenType) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
        }
    }, [window.ethereum]);

    useEffect(() => {
        if(user && contract) {
            retrieveBoughtItems();
        }
    }, [user, contract])

    useEffect(() => {
        if (provider && tokenType) {
            // in dev mode our oracle mock
            // deployed on separate address in anvil testnet
            const oracleAddress = ORACLE_ADDRESSES[tokenType];
            const oracleContract = new ethers.Contract(oracleAddress, OracleArtifact.abi, provider);
            setOracleContract(oracleContract);
        }

    }, [provider])

    eventManger.addEventListener(GAME_EVENTS.USER_EVENTS.SET_TOKEN, e => {
        const tokenSelected = e.data;
        console.log("===>>>>>>>>>>>>>>>set tokenType: ", tokenSelected);
        setTokenType(tokenSelected);
        setContractAddress(CONTRACT_ADDRESS[tokenSelected]);
    })

    eventManger.addEventListener(GAME_EVENTS.USER_EVENTS.LOGIN, async(e) => {
        const accountArray = e.data;
        const userPublic = accountArray[0];
        setUser(userPublic);

        if (provider) {
            const signerObj = await provider.getSigner();
            
            /**
             * @type {ethers.Contract}
             */
            const contractLocal = new ethers.Contract(contractAddress, abi, signerObj);
            //contractLocal.setNumber(0);
            setContract(contractLocal);
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
        if (isContractAvailable) {
            setState(true);
        } else {
            retrieveBoughtItems();
        }
    }

    const buyAction = async(itemKey) => {
        setIsLoading(true);
        const itemPriceUsd = STORE_ITEMS[itemKey].PRICE,
            itemId = STORE_ITEMS[itemKey].ID,
            priceInWei = (await getPriceInWei(itemPriceUsd)).toFixed(0);
        console.log("price in wei: ", priceInWei);
        console.log("itemId: ", itemId);
        console.log("contract address: ", contractAddress);
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

     const addRpcLocalhost = async () => {
        const { ethereum } = window;

        toaster.create({
            description: "Contract method issue. Consider to add localhost RPC to your wallet",
            type: "waring",
            closable: true,
        });
        
        const target = {
            chainId: '0x7A69',                     // 31337 in hex
            chainName: 'AnvilTestnet',
            rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: { name: 'Testnet', symbol: 'ETH', decimals: 18 }
        };

        try {
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [target]
            });
            // If the network already exists, MetaMask will simply update the RPC list.
            eventManger.emit(GAME_EVENTS.USER_EVENTS.RPC_ADDED);
        } catch (err) {
            // User rejected or wallet doesn’t support the call.
            console.warn('Could not update RPC automatically:', err);
        }
    }
    
    const addRpcPolygon = async () => {
        const { ethereum } = window;

        toaster.create({
            description: "Contract method issue. Consider to add polygon RPC to your wallet",
            type: "waring",
            closable: true,
        });

        const target = {
            chainId: '0x89',                     // 137 in hex
            chainName: 'Polygon (GetBlock)',
            rpcUrls: ['https://go.getblock.io/149789a985534855a03e4de8bb8edd50'],
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            blockExplorerUrls: ['https://polygonscan.com']
        };

        try {
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [target]
            });
            // If the network already exists, MetaMask will simply update the RPC list.
            eventManger.emit(GAME_EVENTS.USER_EVENTS.RPC_ADDED);
        } catch (err) {
            // User rejected or wallet doesn’t support the call.
            console.warn('Could not update RPC automatically:', err);
        }
    }

    async function addRpcEthereum() {
        const target = {
            chainId: '0x1',                     // Ethereum Mainnet
            chainName: 'Ethereum (GetBlock)',
            rpcUrls: ['https://go.getblock.io/1988e6dfb69744e3bca040d1f38e3c33'],
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://etherscan.io']
        };

        toaster.create({
            description: "Contract method issue. Consider to add ethereum RPC to your wallet",
            type: "waring",
            closable: true,
        });

        try {
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [target]
            });

            eventManger.emit(GAME_EVENTS.USER_EVENTS.RPC_ADDED);
            // MetaMask will either add a new entry or update the existing Mainnet RPC.
        } catch (err) {
            // User rejected or wallet doesn’t support the call.
            console.warn('RPC update failed:', err);
        }
    }
    
    /**
     * This method also checks if contract is available
     * If not, consider to add contract RPC url to the wallet and try again
     * @returns 
     */
    function retrieveBoughtItems() {
        setIsLoading(true);
        contract.getBoughtItems(user).then((userItems) => {
            let itemsIds = new Set();
            for(const item of userItems) {
                itemsIds.add("0x" + item.toString(16).toUpperCase());
            }
            console.log("items bought: ", itemsIds);
            setItems(itemsIds);
            setIsContractAvailable(true);
            setIsLoading(false);
        }).catch((err) => {
            console.error(APP_ERRORS.CONTRACT_METHOD_ISSUE);
            console.log("contract address: ", contractAddress);
            console.error(err);
            setIsLoading(false);
            setIsContractAvailable(false);
            switch(tokenType) {
                case "DEV_TOKEN":
                case "DEV_TOKEN_2":
                    addRpcLocalhost();
                    break;
                case "ETHEREUM":
                    addRpcEthereum();
                    break;
                case "POLYGON(MATIC)":
                    addRpcPolygon();
                    break;
                default:
                    console.error("unknown token type");
            }
        });
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
                    <p>Token type: {tokenType}</p>
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