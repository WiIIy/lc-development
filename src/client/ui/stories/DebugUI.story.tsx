import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { DebugUI } from "client/ui/debug/DebugUI";
import { GameRouter } from "../GameRouter";

export = (frame: Frame) => {
	const root = ReactRoblox.createRoot(frame);
	root.render(
		<ReflexProvider producer={GameRouter.gameProducer}>
			<DebugUI />
		</ReflexProvider>,
	);

	return () => {
		root.unmount();
	};
};
