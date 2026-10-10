import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { DebugUI } from "client/ui/debug/DebugUI";
import { GameMenu } from "client/ui/gamemenu/GameMenu";
import { GameRouter } from "../GameRouter";

export = (frame: Frame) => {
	const root = ReactRoblox.createRoot(frame);
	root.render(
		<ReflexProvider producer={GameRouter.gameProducer}>
			<GameMenu previewMode={true} />
		</ReflexProvider>,
	);

	return () => {
		root.unmount();
	};
};
