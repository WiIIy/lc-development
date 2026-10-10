import React, { useState, useRef, Element } from "@rbxts/react";
import { useAtom } from "@rbxts/react-charm";
import { atom } from "@rbxts/charm";

export function Crosshair(): Element {
	const a = useAtom(atom<string>("hi")); //without this there is no error

	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<textlabel Text={a}></textlabel>
			<imagelabel
				Image={"rbxassetid://70898648913548"}
				Size={UDim2.fromOffset(20, 20)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={UDim2.fromScale(0.5, 0.5)}
				BackgroundTransparency={1}
				ZIndex={-4}
			/>
		</frame>
	);
}
