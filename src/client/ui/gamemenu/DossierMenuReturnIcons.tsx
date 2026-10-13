import React, { Element, useEffect, useRef, useState } from "@rbxts/react";

import { clientPing, hideServerInfo, isThirdPerson, regionAtom } from "client/clientAtoms";
import { useAtom } from "@rbxts/react-charm";
import { server } from "@rbxts/yetanothernet";

import { DossierBuilding } from "../dossier/DossierBuilding";
import { DossierEditing } from "../dossier/DossierEditing";

import { GameMenu, mountDossierMenu } from "./GameMenu";
import { UICONSTS } from "../Uistyle";
import { dossierEditingOpen, dossierMenuOpen, dossierBuildingOpen, gameMenuOpen } from "shared/sharedAtoms";

const FADE_DURATION = 0.2;

interface GameMenuProps {
	previewMode?: boolean;
}

export function DossierMenuReturnIcons({ previewMode = false }: GameMenuProps): Element {
	const dossierEditingOpenAtom = useAtom(dossierEditingOpen);
	const dossierMenuOpenAtom = useAtom(dossierMenuOpen);
	const dossierBuildingOpenAtom = useAtom(dossierBuildingOpen);
	const gameMenuOpenAtom = useAtom(gameMenuOpen);

	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1} Visible={dossierMenuOpenAtom}>
			{/*game menu button */}
			<DossierEditing visible={dossierEditingOpenAtom} />
			<DossierBuilding visible={dossierBuildingOpenAtom} />
			<GameMenu />

			<imagebutton
				Size={UDim2.fromScale(0.07, 0.04)}
				Position={UDim2.fromScale(0.99, 0.91)}
				AnchorPoint={new Vector2(1, 1)}
				ZIndex={2}
				ImageColor3={UICONSTS.color.custom_color_mid_dark}
				Image={"rbxassetid://117210345736894"}
				BackgroundTransparency={1}
				BackgroundColor3={new Color3(0, 0, 0)}
				Event={{
					MouseButton1Click: () => {
						mountDossierMenu();
						gameMenuOpen(!gameMenuOpenAtom);
					},
				}}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagebutton>

			{/*dossier Building button*/}
			<imagebutton
				Size={UDim2.fromScale(0.07, 0.04)}
				Position={UDim2.fromScale(0.99, 0.95)}
				AnchorPoint={new Vector2(1, 1)}
				ZIndex={2}
				Image={"rbxassetid://91534766570623"}
				BackgroundTransparency={1}
				ImageColor3={UICONSTS.color.custom_color_mid_dark}
				BackgroundColor3={new Color3(0, 0, 0)}
				Event={{
					MouseButton1Click: () => {
						dossierBuildingOpen(!dossierBuildingOpenAtom);
					},
				}}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagebutton>

			{/*dossier Editing button*/}
			<imagebutton
				Size={UDim2.fromScale(0.07, 0.04)}
				Position={UDim2.fromScale(0.99, 0.99)}
				AnchorPoint={new Vector2(1, 1)}
				ZIndex={2}
				Image={"rbxassetid://118146129317443"}
				ImageColor3={UICONSTS.color.custom_color_mid_dark}
				BackgroundTransparency={1}
				BackgroundColor3={new Color3(0, 0, 0)}
				Event={{
					MouseButton1Click: () => {
						dossierEditingOpen(!dossierEditingOpenAtom);
						// print("d", dossierEditingOpenAtom);
					},
				}}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagebutton>
		</frame>
	);
}
