# Classic rts game includes metamask authentication and in game store with ERC1155 fungible tokens
![Alt text](hvsg.gif?raw=true "screen")
License: MIT \
Platform: PC, Browser \
Controls: Keyboard + Mouse(touchpad) \

Hosted: https://rts.reslc.ru

Assets:
    * Pixel Frog: https://pixelfrog-assets.itch.io/tiny-swords
    * Kenney: https://kenney.nl/assets/cursor-pack

Ui:
    * jsx + reactjs + chakra-ui: https://chakra-ui.com/

Render engine: 
    * Jsge: https://github.com/ALapinskas/jsge

Tilemaps: 
    * Tiled: https://www.mapeditor.org/

Ethers v6: https://docs.ethers.org/v6
    * Metamask wallet authentication
    * Buy items

Foundry: https://getfoundry.sh
    * forge build/test/deploy contract
    * anvil as a testnet

IPFS filestorage: 
    Pinata: https://pinata.cloud/

## How build and run
npm start

## Metamask authentication and store
1. Authenticate with ethereum wallet
![Authenticate with ethereum wallet](/dist/assets/screen1.png)
2. Switch the payment type Ethereum/Polygon(Matic)
3. Suggest user to add custom RPC endpoint
4. Store prices are in USDT, converts USDT to user payment type(2)
5. Buy in game items(ERC-1155 token)
![Buy in game items](/dist/assets/screen_buy_1.png)
![Buy in game items](/dist/assets/screen_buy_2.png)
6. Information about transactions will be stored in the blockchain.
