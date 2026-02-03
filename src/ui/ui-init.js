'use client'

import {
    ChakraProvider,
    createSystem,
    defaultConfig,
    defineConfig
} from "@chakra-ui/react"
import { OptionsCard } from "./options.js";
import { LevelDialog } from "./dialog.js";
import { Authentication } from "./auth.js"
import { StoreDialog } from "./store.js";

const config = defineConfig({
    theme: {
        tokens: {
            colors: {},
        },
    },
})

const system = createSystem(defaultConfig, config);

export default function UiApp({eventManger}) {
    console.log("event manager: ", eventManger);
    return (
        <ChakraProvider value={system}>
            <Authentication eventManger={eventManger}/>
            <OptionsCard eventManger={eventManger}/>
            <LevelDialog eventManger={eventManger}/>
            <StoreDialog eventManger={eventManger}/>
        </ChakraProvider>
    )
}