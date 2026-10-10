import React, { Element } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { GameRouter } from "../GameRouter";

export function DevOverlay(): Element {
	const releaseType = useSelector((state: GameRouter.GameState) => state.releaseType);

	return (
		<frame
			Visible={releaseType === "dev"}
			key={"DevOverlay"}
			Size={UDim2.fromScale(1, 1)}
			BackgroundTransparency={1}
		>
			<uilistlayout
				key={"DevOverlayListLayout"}
				FillDirection={"Vertical"}
				HorizontalAlignment={"Center"}
				VerticalAlignment={"Top"}
				VerticalFlex={"SpaceBetween"}
			/>
			<uipadding
				key={"DevOverlayPadding"}
				PaddingBottom={new UDim(0, 14)}
				PaddingLeft={new UDim(0, 14)}
				PaddingRight={new UDim(0, 14)}
				PaddingTop={new UDim(0, 14)}
			/>
			<textlabel
				key={"DevOverlayLabel"}
				Text={`You are running a development build. F4 - debugger. F6 - console\n Covert Ops: Jecs | Version: ${useSelector(
					(state: GameRouter.GameState) => state.version,
				)} | Release Type: "${releaseType}"`}
				AutomaticSize={"XY"}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={1}
				Size={UDim2.fromScale(1, 0)}
				Font={"RobotoMono"}
				FontSize={Enum.FontSize.Size14}
			/>
		</frame>
	);
}
