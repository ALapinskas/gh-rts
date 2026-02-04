# Classic rts game includes metamask authentication and in game store
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

## How build and run
npm start

## Metamask authentication and store
1. Authenticate with ethereum wallet
![Authenticate with ethereum wallet](/dist/assets/screen1.png)
2. Buy in game items
![Buy in game items](/dist/assets/screen_buy_1.png)
![Buy in game items](/dist/assets/screen_buy_2.png)
3. Information about transactions will be stored in the blockchain. 
   As the mappings user_id[] -> items_id[]
