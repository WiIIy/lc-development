import React, { Element } from "@rbxts/react";
import { UICONSTS } from "../Uistyle";
import { useCurrentSlot } from "../hooks/useCurrentSlot";

interface HotbarSlotProps {
	key: string;
	slotNumber: string;
}

export function HotbarSlot(props: HotbarSlotProps): Element {
	const currentSlot = useCurrentSlot();
	// print("currslot", currentSlot);
	// print(props.slotNumber);

	const isEquipped = currentSlot === props.slotNumber;

	return (
		<frame
			key={props.key}
			Size={UDim2.fromScale(0.9, 0.9)}
			BackgroundTransparency={0}
			AnchorPoint={new Vector2(0, 0.5)}
			Position={UDim2.fromScale(0, 0.5)}
			ZIndex={0}
			BackgroundColor3={UICONSTS.color.darkgray}
			BorderSizePixel={isEquipped ? 2 : 0}
			BorderColor3={new Color3(1, 1, 1)}
		>
			<uiaspectratioconstraint AspectRatio={1}></uiaspectratioconstraint>
		</frame>
	);
}
