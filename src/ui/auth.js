import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { GAME_EVENTS, STAGE_TEXTS } from "../const.js";
import { useEffect, useState } from "react";
import { Toaster, toaster } from "../components/ui/toaster.jsx"

//import { MetaMaskSDK } from "@metamask/sdk";
import { ethers } from "ethers";

/*
const MMSDK = new MetaMaskSDK({
    dappMetadata: {
        name: "MetaMask SDK Demo",
        url: window.location.href,
        iconUrl: "https://docs.metamask.io/img/metamask-logo.svg",
    },
    infuraAPIKey: process.env.VITE_INFURA_API_KEY || "",
});
*/
export const Authentication = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [provider, setProvider] = useState();
    const [account, setAccount] = useState();
    const [balance, setBalance] = useState();

    useEffect(() => {
        // setProvider(MMSDK.getProvider());
        // metamask extension injects objects into window:
        try {
            const provider = new ethers.BrowserProvider(window.ethereum); 
            setProvider(provider);
        } catch (err) {
            console.error(err);
            toaster.create({
                description: "Authentication error. Probably, metamask extension doesn't installed",
                type: "error",
                closable: true,
            });
        }
    }, []);

    const closeDialog = () => {
        setState(false);
        eventManger.emit(GAME_EVENTS.DIALOG_EVENTS.CLOSED, {});
    }

    const openDialog = () => {
        setState(true);
    }

    const connect = async () => {
        closeDialog();
        try {
            const { address: account } = await provider.getSigner();
            setAccount(account);
            if (account) {
                setIsConnected(true);
                eventManger.emit(GAME_EVENTS.USER_EVENTS.LOGIN, account);
            }
        } catch (err) {
            console.error(err);

            toaster.create({
                description: "Authentication error. Probably, metamask extension doesn't installed",
                type: "error",
                closable: true,
            });
        }
    };
    
    const terminate = async () => {
        //await MMSDK.terminate();
        setIsConnected(false);
        setBalance(undefined);
        setAccount(undefined);
        eventManger.emit(GAME_EVENTS.USER_EVENTS.LOGOUT, {});
    };

    const getBalance = async () => {
        if (!account || !provider) {
            console.error("provide or account not set");
            return;
        }
        /*
        const result = await provider?.request({
            method: "eth_getBalance",
            params: [account, "latest"],
        });
        
        const decimal = BigInt(result);
        const balance = ethers.formatEther(result);
        console.log(balance.toFixed(4));
        */
        const result = await provider.getBalance(account);
        
        const balance = ethers.formatEther(result);
        
        setBalance(balance);
    };

    // const batchRequest = async () => {
    //   if (!account || !provider) {
    //     return;
    //   }
    //   const batchResults = await provider.request({
    //     method: "metamask_batch",
    //     params: [
    //       { method: "eth_accounts" },
    //       { method: "eth_getBalance", params: [account, "latest"] },
    //       { method: "eth_chainId" },
    //     ],
    //   });
    //   console.log(batchResults);
    // };

    return (
        <>
        <div className="auth-buttons">
            {isConnected ? <Button onClick={openDialog}>User info</Button> : <Button onClick={openDialog}>Login</Button>}
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