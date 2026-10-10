import React, { Element } from "@rbxts/react";

export function Blindness(props: { eye: "Left" | "Right" | "Both" }): Element {
	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			{props.eye === "Left" && (
				<imagelabel
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					Image={"rbxassetid://109975298562076"}
				></imagelabel>
			)}
			{props.eye === "Right" && (
				<imagelabel
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					Image={"rbxassetid://127905506152272"}
				></imagelabel>
			)}
			{props.eye === "Both" && (
				<>
					<imagelabel
						Size={UDim2.fromScale(1, 1)}
						BackgroundTransparency={1}
						Image={"rbxassetid://109975298562076"}
					></imagelabel>
					<imagelabel
						Size={UDim2.fromScale(1, 1)}
						BackgroundTransparency={1}
						Image={"rbxassetid://127905506152272"}
					></imagelabel>
				</>
			)}
		</frame>
	);
}
