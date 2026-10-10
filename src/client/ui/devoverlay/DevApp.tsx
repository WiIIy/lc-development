import React, { Element } from "@rbxts/react";
import { BindsList } from "./BindsList";
import { CmdList } from "./Commands";
import { DevOverlay } from "./DevOverlay";
import { DebugUI } from "../debug/DebugUI";
// import { LoadoutSelector } from "../loadoutselector/LoadoutSelector";

export function DevApp(): Element {
	return (
		<frame key="DevRoot" Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<BindsList />
			<DevOverlay />
			<CmdList />
			<DebugUI />
			{/* <LoadoutSelector /> */}
		</frame>
	);
}
