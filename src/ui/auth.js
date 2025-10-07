import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { GAME_EVENTS, STAGE_TEXTS } from "../const.js";
import { useEffect, useState } from "react";

import { MetaMaskSDK } from "@metamask/sdk";

const MMSDK = new MetaMaskSDK({
    dappMetadata: {
        name: "MetaMask SDK Demo",
        url: window.location.href,
        iconUrl: "https://docs.metamask.io/img/metamask-logo.svg",
    },
    infuraAPIKey: process.env.VITE_INFURA_API_KEY || "",
});

export const Authentication = ({eventManger}) => {
    const [isOpen, setState] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [provider, setProvider] = useState();
    const [account, setAccount] = useState();
    const [balance, setBalance] = useState();


    useEffect(() => {
        setProvider(MMSDK.getProvider());
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
        const accounts = await MMSDK.connect();
        setAccount(accounts[0]);
        if (accounts.length > 0) {
            setIsConnected(true);
            eventManger.emit(GAME_EVENTS.USER_EVENTS.LOGIN, accounts[0]);
        }
    };

    
    const terminate = async () => {
        await MMSDK.terminate();
        setIsConnected(false);
        setBalance(undefined);
        setAccount(undefined);
        eventManger.emit(GAME_EVENTS.USER_EVENTS.LOGOUT, {});
    };

    const getBalance = async () => {
        if (!account || !provider) {
            return;
        }
        const result = await provider?.request({
            method: "eth_getBalance",
            params: [account, "latest"],
        });
        const decimal = BigInt(result);
        const balance = (await Number(decimal)) / 10 ** 18;
        console.log(balance.toFixed(4));
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
                            {balance && <p>Balance: {balance?.toFixed(4)} Sepolia ETH</p>}
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
        </>
    )
}