import React, { Element } from "@rbxts/react";
import { Inventory } from "./inventory/Inventory";
import { ItemStatDisplay } from "./inventory/ItemStatDisplay";
import { DialogueOverlay } from "./dialogue/DialogueOverlay";
import { PlayerStats } from "./playerstats/PlayerStats";
import { Monologue } from "./monologue/Monologue";
import { Crosshair } from "./inventory/Crosshair";
import { Antler } from "./antler/Antler";

interface GameAppProps {
	previewMode?: boolean;
}

export function GameApp({ previewMode = false }: GameAppProps): Element {
	return (
		<frame
			key="GameApp"
			Size={UDim2.fromScale(1, 1)}
			BackgroundTransparency={1}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
		>
			{/* <Inventory previewMode={previewMode} /> */}
			{/* <ItemStatDisplay /> */}
			{/* <DialogueOverlay /> */}
			{/* <Antler /> */}
			<PlayerStats previewMode={previewMode} />
			<Monologue />
			<Crosshair />
		</frame>
	);
}
