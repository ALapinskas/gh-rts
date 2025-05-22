import { CheckboxCard, CheckboxGroup, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";
import { GAME_EVENTS } from "../const.js";

export const OptionsCard = ({eventManger}) => {
    const [options, setOptions] = useState({showBoundaries: false, showLifeLines: false});
    const [position, setPosition] = useState({x: 0, y: 0});
    const [isVisible, setVisible] = useState(false);
    
    eventManger.addEventListener(GAME_EVENTS.DIALOG.CHANGE_STYLE, (e) => {
        const [x, y] = e.data;
        console.log(e.data);
        setPosition({x, y});
        setVisible(true);
    });

    eventManger.addEventListener(GAME_EVENTS.DIALOG.CHANGE_STATE, (e) => {
        const [open, level] = e.data;
        
        setVisible(false);
    });

    function onChange(e) {
        const target = e.target;
        let bool = false;
        if (target.checked) {
            bool = true;
        }
        setOptions({...options, [target.value]: bool});
        eventManger.emit(GAME_EVENTS.DIALOG.CHANGE_OPTIONS, {[target.value]: bool});
    }
    return (
        <CheckboxGroup defaultValue={["next"]} style={{display: isVisible ? "block" : "none", position: "absolute", left: position.x, top: position.y}}>
        <Text textStyle="sm" fontWeight="bold">
            Options
        </Text>
        <Flex gap="2">
            {items.map((item) => (
            <CheckboxCard.Root key={item.value} value={item.value} onChange={onChange} checked={options[item.value]}>
                <CheckboxCard.HiddenInput />
                <CheckboxCard.Control>
                <CheckboxCard.Content>
                    <CheckboxCard.Label>{item.title}</CheckboxCard.Label>
                </CheckboxCard.Content>
                <CheckboxCard.Indicator />
                </CheckboxCard.Control>
            </CheckboxCard.Root>
            ))}
        </Flex>
        </CheckboxGroup>
    )
}

const items = [
  { value: "showBoundaries", title: "Show Boundaries"},
  { value: "showLifeLines", title: "Show Health" }
]