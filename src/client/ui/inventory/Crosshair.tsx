import React, { useState, useRef, Element } from "@rbxts/react";

export function Crosshair(): Element {
	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
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
