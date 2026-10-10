import { Element } from "@rbxts/react";
import React from "@rbxts/react";

// eslint-disable-next-line prettier/prettier
const every_bind_ever: string[] = [
	"M   - GameMenu",
	"Tab - Inventory",
	"C   - Commands",
	"Q   - Dash",
	"G   - Grenade",
	"I   - View Actions",
	"N   - Accesory",
	"T   - Get Tracks",
	"~   - Debug Menu",
	"F5  - Third Person",
	"J   - Dossier Menu",
	"L   - Loadout Selector",
];

export function BindsList(): Element {
	return (
		<frame
			BackgroundTransparency={0.1}
			Position={UDim2.fromScale(0.8)}
			Size={UDim2.fromScale(0.15, 0)}
			BackgroundColor3={new Color3(1, 1, 1)}
			AutomaticSize={"Y"}
		>
			<uilistlayout HorizontalAlignment={"Center"} />
			{every_bind_ever.map((bind) => (
				<Label text={bind} />
			))}
		</frame>
	);
}

export function Label(props: { text: string }): Element {
	return (
		<textlabel Text={props.text} Size={new UDim2(1, 0, 0, 10)} TextXAlignment={"Left"} BackgroundTransparency={1} />
	);
}
