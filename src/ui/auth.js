import { Button, CloseButton, Dialog, Portal, Select } from "@chakra-ui/react";
import { GAME_EVENTS, STAGE_TEXTS, APP_ERRORS } from "../const.js";
import { useEffect, useState } from "react";
import { Toaster, toaster } from "../components/ui/toaster.jsx";
import { ethers } from "ethers";

const ORACLE_ADDRESSES = process.env.MODE === "development" ? JSON.parse(process.env.DEV_ORACLES) : JSON.parse(process.env.PROD_ORACLES);
const OracleKeys = Object.keys(ORACLE_ADDRESSES);

export const Authentication = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [tokenType, setTokenType] = useState(OracleKeys[0]);
    const [provider, setProvider] = useState();
    const [account, setAccount] = useState();
    const [balance, setBalance] = useState();

    useEffect(() => {
        // metamask extension injects objects into window:
        if (!window.ethereum || !window.ethereum.isMetaMask) {
            showAuthenticationError();
        } else {
            const provider = new ethers.BrowserProvider(window.ethereum); 
            setProvider(provider);
        }
    }, []);

    const closeDialog = () => {
        setState(false);
        eventManger.emit(GAME_EVENTS.DIALOG_EVENTS.CLOSED, {});
    }

    const openDialog = () => {
        setState(true);
    }

    const showAuthenticationError = () => {
        console.error("Authentication error. Metamask extension not found.");
        toaster.create({
            description: "Authentication error. Metamask extension not found.",
            type: "error",
            closable: true,
        });
    }

    const connect = async () => {
        closeDialog();
        if (!provider) {
            showAuthenticationError();
            return;
        }
        provider.send("eth_requestAccounts", [])
            .then((accs) => {
                console.log("accounts: ", accs);
                return provider.getSigner();
            })
            .then(signer => {
                console.log("signer: ", signer);
                return signer.getAddress()
            })
            .then(account => {
                if (account) {
                    console.log("account: ", account);
                    setIsConnected(true);
                    setAccount(account);
                    eventManger.emit(GAME_EVENTS.USER_EVENTS.LOGIN, account);
                }
            })
            .catch((err) => {
                console.error(err);

                toaster.create({
                    description: "Authentication error. Probably, metamask extension doesn't installed",
                    type: "error",
                    closable: true,
                });
            });
    };
    
    const terminate = async () => {
        //await MMSDK.terminate();
        setIsConnected(false);
        setBalance(undefined);
        setAccount(undefined);
        eventManger.emit(GAME_EVENTS.USER_EVENTS.LOGOUT, {});
    };

    const getBalance = async () => {
        console.log("get balance pressed");
        if (!account || !provider) {
            console.error("provide or account not set");
            return;
        }
        console.log("provider: ", provider);
        console.log("account: ", account);
        provider.getBalance(account).then((result) => {
            console.log("result: ", result);
            const balance = ethers.formatEther(result);
            console.log("set balance: ", balance);
            setBalance(balance);
        }).catch((err) => {
            console.error("getBalance error: ", err);
        });
    };
    
    const setOracle = (key) => {
        console.log("set oracle, ", key);
        if(OracleKeys.indexOf(key) !== -1) {
            setTokenType(key);
            eventManger.emit(GAME_EVENTS.USER_EVENTS.SET_TOKEN, key);
        }
    }
    
    return (
        <>
        <div className="auth-buttons">
            {isConnected ? <Button onClick={openDialog}>User info</Button> : <Button onClick={connect}>Login</Button>}
        </div>
        <Dialog.Root lazyMount open={isOpen}>
        <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
            <Dialog.Content>
                <div className="metamask-auth">
                    <h1>MetaMask SDK React Quickstart</h1>
                    <div className="metamask-card">
                        {isConnected ? (
                        <>
                            <p>Connected to {account}</p>
                            
                            {balance && <p>Balance: {balance} Sepolia ETH</p>}
                            <Button onClick={getBalance}>Get Balance</Button>
                            {/* <button onClick={batchRequest}>Batch Request</button> */}
                            <Button onClick={terminate}>Disconnect</Button>
                        </>
                        ) : (
                        <>
                            <Button onClick={connect}>Connect</Button>
                        </>
                        )}
                        <Select.Root 
                            positioning={{ strategy: "fixed", hideWhenDetached: true }}
                            value={[tokenType]} 
                            onValueChange={(e) => setOracle(e.value[0])}
                            >
                                <Select.HiddenSelect />
                                <Select.Label>Token type:</Select.Label>
                                <Select.Control>
                                <Select.Trigger>
                                    <Select.ValueText placeholder={tokenType} />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator />
                                </Select.IndicatorGroup>
                                </Select.Control>
                                <Select.Positioner>
                                    <Select.Content>
                                    {OracleKeys.map((key) => (
                                        <Select.Item item={key} key={key}>
                                            {key}
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
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