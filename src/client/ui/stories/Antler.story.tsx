import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { Antler } from "client/ui/antler/Antler";
import { GameRouter } from "../GameRouter";

export = (frame: Frame) => {
	const root = ReactRoblox.createRoot(frame);
	root.render(
		<ReflexProvider producer={GameRouter.gameProducer}>
			<Antler previewMode={true} />
		</ReflexProvider>,
	);

	return () => {
		root.unmount();
	};
};
