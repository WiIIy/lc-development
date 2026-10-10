import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { DevOverlay } from "client/ui/devoverlay/DevOverlay";
import { DossierMenu } from "client/ui/dossier/DossierMenu";
import { DossierMenuReturnIcons } from "client/ui/gamemenu/DossierMenuReturnIcons";
import { GameRouter } from "../GameRouter";

export = (frame: Frame) => {
	const root = ReactRoblox.createRoot(frame);
	root.render(
		<ReflexProvider producer={GameRouter.gameProducer}>
			<DossierMenuReturnIcons />
		</ReflexProvider>,
	);

	return () => {
		root.unmount();
	};
};
