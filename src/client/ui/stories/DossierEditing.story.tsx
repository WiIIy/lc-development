import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { DossierEditing } from "client/ui/dossier/DossierEditing";
import { GameRouter } from "../GameRouter";

export = (frame: Frame) => {
	const root = ReactRoblox.createRoot(frame);
	root.render(
		<ReflexProvider producer={GameRouter.gameProducer}>
			<DossierEditing previewMode={true} />
		</ReflexProvider>,
	);

	return () => {
		root.unmount();
	};
};
