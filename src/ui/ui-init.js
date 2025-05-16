import { LevelDialog } from "./dialog.js";
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig
} from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {},
    },
  },
})

const system = createSystem(defaultConfig, config);

export default function UiApp(eventManger) {
    console.log("=====>>>>>>>>create ui app");
    return (
        <ChakraProvider value={system}>
            <LevelDialog eventManger={eventManger}/>
        </ChakraProvider>
    )
}