import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { DebugUI } from "client/ui/debug/DebugUI";
import { DialogueOverlay } from "client/ui/dialogue/DialogueOverlay";
import { GameApp } from "client/ui/GameApp";
import { GameRouter } from "../GameRouter";

export = (frame: Frame) => {
	const root = ReactRoblox.createRoot(frame);
	root.render(
		<ReflexProvider producer={GameRouter.gameProducer}>
			<GameApp previewMode={true} />
		</ReflexProvider>,
	);

	return () => {
		root.unmount();
	};
};
