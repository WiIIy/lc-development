/* eslint-disable roblox-ts/lua-truthiness */
import React, { Element, useEffect, useState } from "@rbxts/react";
import { useDossier } from "../hooks/useDossier";
import { useAtom } from "@rbxts/react-charm";
import { dossierMenuOpen, gameMenuOpen, selectedPreviewDossier } from "client/clientAtoms";
import { Players, UserInputService } from "@rbxts/services";
import ReactRoblox from "@rbxts/react-roblox";
import { UICONSTS } from "../Uistyle";
import { ASSET_ID_PREFIX } from "shared/data/paths";
import { DossierStore } from "../stores/DossierStore";

export function DossierMenu(): Element {
	// 1. Grab the data using the hook
	const dossierData = useDossier();
	const [currentDossierData, setCurrentDossierData] = useState<DossierData>(DossierStore.getSelected());
	const dossierMenuVisible = useAtom(dossierMenuOpen);
	// const selectedDossierActivePageAtom = useAtom(selectedDossierActivePage)
	const dossierRoot = Players.LocalPlayer.WaitForChild("PlayerGui").WaitForChild("DossierRoot") as SurfaceGui;

	useEffect(() => {
		const connection = DossierStore.onChange(() => {
			setCurrentDossierData(DossierStore.getSelected());
		});
		return () => connection.Disconnect();
	}, []);

	// Find the specific dossier object based on the atom string, or default to the first one
	const activeDossier =
		dossierData.find((d) => d.build.buildName === currentDossierData.build.buildName) || DossierStore.getSelected();

	useEffect(() => {
		// print("dossierData", dossierData);
	}, [activeDossier, currentDossierData, dossierMenuVisible, dossierData]);

	return ReactRoblox.createPortal(
		<frame
			key={"Dossier Menu"}
			Size={UDim2.fromScale(1, 1)}
			BackgroundTransparency={1}
			Visible={dossierMenuVisible}
		>
			{activeDossier ? (
				<DossierPaperView dossier={activeDossier} currentPage={activeDossier.currentPage} />
			) : (
				<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
					<textlabel
						Text="NO DOSSIER SELECTED"
						Size={UDim2.fromScale(1, 0.1)}
						Position={UDim2.fromScale(0, 0.45)}
						TextColor3={new Color3(1, 1, 1)}
						TextSize={24}
						BackgroundTransparency={1}
					/>
				</frame>
			)}
		</frame>,
		dossierRoot,
	);
}

function DossierPaperView(props: { dossier: DossierData; currentPage: "1" | "2" }): Element {
	const { dossier } = props;
	const page = dossier.pages[props.currentPage];

	return (
		<frame
			Size={UDim2.fromScale(0.9, 0.9)}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={new Color3(1, 1, 1)}
			BackgroundTransparency={1}
		>
			{/* <uicorner CornerRadius={new UDim(0, 6)} /> */}
			<uistroke Thickness={2} />
			<uiaspectratioconstraint AspectRatio={1 / 1.414} />

			<scrollingframe
				Size={UDim2.fromScale(1, 1)}
				CanvasSize={UDim2.fromScale(1)}
				AutomaticCanvasSize={"Y"}
				ScrollingDirection={"Y"}
				BackgroundTransparency={1}
				ScrollBarThickness={0}
			>
				<textlabel
					Text={parseCustomRichText(page?.label || "", dossier)}
					Size={UDim2.fromScale(0.96, 1)}
					AutomaticSize={"Y"}
					TextXAlignment={"Left"}
					Position={UDim2.fromScale(0.5, 0)}
					AnchorPoint={new Vector2(0.5, 0)}
					TextSize={16}
					RichText={true}
					TextYAlignment={"Top"}
					TextColor3={UICONSTS.color.black}
					BackgroundTransparency={1}
					TextWrapped={true}
					ClipsDescendants={true}
				>
					<uisizeconstraint MinSize={new Vector2(1, 560)} />

					{page?.images.map((imageData, index) => (
						<imagelabel
							key={imageData.id || tostring(index)}
							Image={ASSET_ID_PREFIX + imageData.assetId}
							Size={UDim2.fromScale(imageData.size.x, imageData.size.y)}
							Position={UDim2.fromScale(imageData.position.x, imageData.position.y)}
							BackgroundColor3={new Color3(0, 0, 0)}
							ZIndex={imageData.zIndex}
							BackgroundTransparency={1}
						>
							{imageData.aspectratio !== undefined ? (
								<uiaspectratioconstraint AspectRatio={imageData.aspectratio} />
							) : (
								<></>
							)}
						</imagelabel>
					))}
				</textlabel>
			</scrollingframe>
		</frame>
	);
}

function parseCustomRichText(text: string, currentActiveDossier: DossierData): string {
	let parsed = text;

	// Convert <<break>> into a visual line divider string
	parsed = parsed.gsub("<<break>>", "\n_______________________________________")[0];

	// Format Loadout list
	const loadoutList = currentActiveDossier.build.loadout.map((item) => `- ${item}`).join("\n");
	const loadoutFormatted = `\n<b>Authorized Loadout</b>\n${loadoutList}`;
	parsed = parsed.gsub("<<loadout>>", loadoutFormatted)[0];

	// Format Skills list
	const skillsList = currentActiveDossier.build.skills.map((skill) => `- ${skill}`).join("\n");
	const skillsFormatted = `\n<b>Skills</b>\n${skillsList}`;
	parsed = parsed.gsub("<<skills>>", skillsFormatted)[0];

	// Convert <r>text</r> into redaction block characters
	parsed = parsed.gsub("<r>(.-)</r>", (match: string) => {
		return match.gsub("%S", "█")[0];
	})[0];

	return parsed;
}
