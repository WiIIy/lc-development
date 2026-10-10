// import React, { Element, useEffect, useState } from "@rbxts/react";
// import { Players, UserInputService } from "@rbxts/services";
// import { useDossier } from "../hooks/useDossier";
// import { DossierData } from "shared/data/ProfileData";
// import { RemoteEvents } from "client/network";
// import { KEYBINDS, inputIsKey } from "shared/data/DefaultKeybindControls";

// // Helper to reliably extract the item name string whether it's a string or an object
// function extractItemName(item?: string | { item: string; amount?: number }): string {
// 	if (item === undefined) return "None";
// 	if (typeIs(item, "string")) return item;
// 	return item.item;
// }

// export function LoadoutSelector(): Element {
// 	const dossiers = useDossier();
// 	const [LoadoutSelectorVisible, setLoadoutSelectorVisible] = useState<boolean>(false);

// 	// Track the currently selected dossier index and info toggle state
// 	const [selectedIndex, setSelectedIndex] = useState<number>(0);
// 	const [showInfo, setShowInfo] = useState<boolean>(false);
// 	const [modalTrue, setModalTrue] = useState(false);

// 	const activeDossier = dossiers[selectedIndex] || dossiers[0];

// 	useEffect(() => {
// 		const connection = UserInputService.InputBegan.Connect((inp, proc) => {
// 			if (proc) return;

// 			if (KEYBINDS.LoadoutSelector.some((key) => inputIsKey(inp, key))) {
// 				setLoadoutSelectorVisible(!LoadoutSelectorVisible);
// 				setModalTrue(!modalTrue);
// 			}
// 		});

// 		return () => connection.Disconnect();
// 	}, [LoadoutSelectorVisible]);

// 	const handleSelect = () => {
// 		if (!activeDossier) return;

// 		const player = Players.LocalPlayer;

// 		// Explicitly typed array with no undefined
// 		const items: (string | { item: string; amount?: number })[] = [];

// 		if (activeDossier.item1 !== undefined) {
// 			items.push(activeDossier.item1);
// 		}

// 		if (activeDossier.item2 !== undefined) {
// 			items.push(activeDossier.item2);
// 		}

// 		if (activeDossier.item3 !== undefined) {
// 			items.push(activeDossier.item3);
// 		}

// 		if (activeDossier.item4 !== undefined) {
// 			items.push(activeDossier.item4);
// 		}

// 		// print(`Clearing current inventory for ${player.Name}...`);

// 		items.forEach((itemObj) => {
// 			const itemName = extractItemName(itemObj);

// 			if (itemName !== "None" && itemName !== "TBA") {
// 				print(`[${itemName}] doesnt exist yet!, Attempted to give loadout to ${player.Name}`);
// 			}
// 		});

// 		// print(`Requesting server to equip loadout: ${activeDossier.displayName}...`);

// 		// Fire the remote to let the server handle inventory wiping and item granting
// 		RemoteEvents.requestEquipLoadout.fire(activeDossier.displayName);
// 	};
// 	return (
// 		<frame
// 			Visible={LoadoutSelectorVisible}
// 			Size={UDim2.fromScale(0.6, 0.6)}
// 			AnchorPoint={new Vector2(0.5, 0.5)}
// 			Position={UDim2.fromScale(0.5, 0.5)}
// 			BackgroundColor3={new Color3(0.15, 0.15, 0.15)}
// 			BorderSizePixel={2}
// 			BorderColor3={new Color3(0, 0, 0)}
// 		>
// 			<uilistlayout FillDirection={"Horizontal"} SortOrder={"LayoutOrder"} />

// 			<textbutton Modal={modalTrue} Transparency={1} TextTransparency={1} />

// 			{/* LEFT PANEL: Dossier Selection List (0.3 Scale) */}
// 			<frame BackgroundColor3={new Color3(0.1, 0.1, 0.1)} Size={UDim2.fromScale(0.3, 1)}>
// 				<scrollingframe
// 					Size={UDim2.fromScale(1, 1)}
// 					BackgroundTransparency={1}
// 					CanvasSize={UDim2.fromScale(0, 0)}
// 					AutomaticCanvasSize={Enum.AutomaticSize.Y}
// 					ScrollBarThickness={4}
// 				>
// 					<uilistlayout FillDirection={"Vertical"} SortOrder={"LayoutOrder"} />
// 					{dossiers.map((dossier, index) => (
// 						<textbutton
// 							key={dossier.displayName}
// 							Text={` ${dossier.displayName}`}
// 							Size={UDim2.fromScale(1, 0.1)}
// 							BackgroundColor3={
// 								selectedIndex === index ? new Color3(0.3, 0.3, 0.3) : new Color3(0.2, 0.2, 0.2)
// 							}
// 							TextColor3={new Color3(1, 1, 1)}
// 							TextSize={18}
// 							Font={Enum.Font.ArialBold}
// 							TextXAlignment={"Left"}
// 							Event={{
// 								Activated: () => {
// 									setSelectedIndex(index);
// 									setShowInfo(false); // Reset info tab when changing dossier
// 								},
// 							}}
// 						/>
// 					))}
// 				</scrollingframe>
// 			</frame>

// 			{/* RIGHT PANEL: Dossier Details (0.7 Scale) */}
// 			<frame BackgroundColor3={new Color3(0.2, 0.2, 0.2)} Size={UDim2.fromScale(0.7, 1)}>
// 				<uipadding
// 					PaddingTop={new UDim(0, 15)}
// 					PaddingBottom={new UDim(0, 15)}
// 					PaddingLeft={new UDim(0, 15)}
// 					PaddingRight={new UDim(0, 15)}
// 				/>

// 				{activeDossier ? (
// 					<>
// 						{/* Header Section */}
// 						<frame Size={UDim2.fromScale(1, 0.15)} BackgroundTransparency={1}>
// 							{/* <textlabel
// 								Text={activeDossier.displayName.upper()}
// 								Size={UDim2.fromScale(0.7, 1)}
// 								BackgroundTransparency={1}
// 								TextColor3={new Color3(1, 1, 1)}
// 								TextSize={28}
// 								Font={Enum.Font.ArialBold}
// 								TextXAlignment={"Left"}
// 							/> */}
// 							{/* Toggle Info Button */}
// 							<textbutton
// 								Text={showInfo ? "Hide Lore" : "Info"}
// 								Size={UDim2.fromScale(0.25, 0.8)}
// 								Position={UDim2.fromScale(1, 0.1)}
// 								AnchorPoint={new Vector2(1, 0)}
// 								BackgroundColor3={new Color3(0.3, 0.3, 0.3)}
// 								TextColor3={new Color3(1, 1, 1)}
// 								Font={Enum.Font.ArialBold}
// 								TextSize={14}
// 								Event={{ Activated: () => setShowInfo(!showInfo) }}
// 							/>
// 						</frame>

// 						<frame
// 							BackgroundColor3={new Color3(1, 1, 1)}
// 							Size={UDim2.fromScale(1, 0.005)}
// 							BackgroundTransparency={0.5}
// 						/>

// 						{/* Lore Details (Toggled) */}
// 						<frame Size={UDim2.fromScale(1, 0.35)} BackgroundTransparency={1} Visible={showInfo}>
// 							<uilistlayout FillDirection={"Vertical"} Padding={new UDim(0, 5)} />
// 							<textlabel
// 								Text={`Full Name: ${activeDossier.fullName !== undefined || "N/A"}`}
// 								TextColor3={new Color3(0.8, 0.8, 0.8)}
// 								TextSize={14}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.15)}
// 							/>
// 							<textlabel
// 								Text={`ID: ${activeDossier.id !== undefined || "CLASSIFIED"}`}
// 								TextColor3={new Color3(0.8, 0.8, 0.8)}
// 								TextSize={14}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.15)}
// 							/>
// 							<textlabel
// 								Text={`Date Created: ${activeDossier.dateCreated !== undefined || "UNKNOWN"}`}
// 								TextColor3={new Color3(0.8, 0.8, 0.8)}
// 								TextSize={14}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.15)}
// 							/>
// 							<textlabel
// 								Text={`Nationality: ${activeDossier.nationality !== undefined || "UNKNOWN"}`}
// 								TextColor3={new Color3(0.8, 0.8, 0.8)}
// 								TextSize={14}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.15)}
// 							/>
// 							<textlabel
// 								Text={`Description: ${
// 									activeDossier.description !== undefined || "No description available."
// 								}`}
// 								TextColor3={new Color3(0.7, 0.7, 0.7)}
// 								TextSize={14}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								TextYAlignment={"Top"}
// 								TextWrapped={true}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.4)}
// 							/>
// 						</frame>

// 						{/* Significant Details (Always Visible) */}
// 						<frame
// 							Size={UDim2.fromScale(1, showInfo ? 0.45 : 0.8)}
// 							Position={UDim2.fromScale(0, showInfo ? 0.55 : 0.2)}
// 							BackgroundTransparency={1}
// 						>
// 							<uilistlayout FillDirection={"Vertical"} Padding={new UDim(0, 1)} />
// 							<textlabel
// 								Text="<font color='#00ff00'>AUTHORIZED LOADOUT</font>"
// 								RichText={true}
// 								TextColor3={new Color3(1, 1, 1)}
// 								TextSize={18}
// 								Font={Enum.Font.ArialBold}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.1)}
// 							/>
// 							<textlabel
// 								Visible={activeDossier.item1 !== undefined}
// 								Text={`• ${extractItemName(activeDossier.item1)}`}
// 								TextColor3={new Color3(0.9, 0.9, 0.9)}
// 								TextSize={16}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.1)}
// 							/>
// 							<textlabel
// 								Visible={activeDossier.item2 !== undefined}
// 								Text={`• ${extractItemName(activeDossier.item2)}`}
// 								TextColor3={new Color3(0.9, 0.9, 0.9)}
// 								TextSize={16}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.1)}
// 							/>
// 							<textlabel
// 								Visible={activeDossier.item3 !== undefined}
// 								Text={`• ${extractItemName(activeDossier.item3)}`}
// 								TextColor3={new Color3(0.9, 0.9, 0.9)}
// 								TextSize={16}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.1)}
// 							/>
// 							<textlabel
// 								Visible={activeDossier.item4 !== undefined}
// 								Text={`• ${extractItemName(activeDossier.item4)}`}
// 								TextColor3={new Color3(0.9, 0.9, 0.9)}
// 								TextSize={16}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.1)}
// 							/>

// 							<frame Size={UDim2.fromScale(1, 0.05)} BackgroundTransparency={1} />

// 							<textlabel
// 								Text="<font color='#00ff00'>SKILLS & AUGMENTATIONS</font>"
// 								RichText={true}
// 								TextColor3={new Color3(1, 1, 1)}
// 								TextSize={18}
// 								Font={Enum.Font.ArialBold}
// 								TextXAlignment={"Left"}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.1)}
// 							/>
// 							<textlabel
// 								Text={`Skills: ${
// 									activeDossier.skills.size() > 0 ? activeDossier.skills.join(", ") : "None"
// 								}`}
// 								TextColor3={new Color3(0.9, 0.9, 0.9)}
// 								TextSize={16}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								TextWrapped={true}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.1)}
// 							/>
// 							<textlabel
// 								Text={`Mods: ${
// 									activeDossier.mods && activeDossier.mods.size() > 0
// 										? activeDossier.mods.join(", ")
// 										: "None"
// 								}`}
// 								TextColor3={new Color3(0.9, 0.9, 0.9)}
// 								TextSize={16}
// 								Font={Enum.Font.Arial}
// 								TextXAlignment={"Left"}
// 								TextWrapped={true}
// 								BackgroundTransparency={1}
// 								Size={UDim2.fromScale(1, 0.1)}
// 							/>
// 						</frame>

// 						{/* Select Button */}
// 						<textbutton
// 							Text="Select Loadout"
// 							Size={UDim2.fromScale(0.3, 0.12)}
// 							AnchorPoint={new Vector2(1, 1)}
// 							Position={UDim2.fromScale(1, 1)}
// 							BackgroundColor3={new Color3(0, 0.6, 0)}
// 							TextColor3={new Color3(1, 1, 1)}
// 							Font={Enum.Font.ArialBold}
// 							TextSize={18}
// 							Event={{ Activated: handleSelect }}
// 						/>
// 					</>
// 				) : (
// 					<textlabel
// 						Text="NO DOSSIER AVAILABLE"
// 						Size={UDim2.fromScale(1, 1)}
// 						BackgroundTransparency={1}
// 						TextColor3={new Color3(1, 1, 1)}
// 						TextSize={24}
// 						Font={Enum.Font.ArialBold}
// 					/>
// 				)}
// 			</frame>
// 		</frame>
// 	);
// }
