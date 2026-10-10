import React, { Element } from "@rbxts/react";
import { UICONSTS } from "../Uistyle";

interface HotbarSlotProps {
	key: string;
}

export function BackpackSlot(props: HotbarSlotProps): Element {
	return (
		<frame
			key={props.key}
			Size={UDim2.fromScale(0.9, 0.9)}
			BackgroundTransparency={0}
			AnchorPoint={new Vector2(0, 0.5)}
			Position={UDim2.fromScale(0, 0.5)}
			ZIndex={1}
			BackgroundColor3={UICONSTS.color.custom_color_mid_dark}
			BorderSizePixel={0}
		>
			<uiaspectratioconstraint AspectRatio={1}></uiaspectratioconstraint>
		</frame>
	);
}
