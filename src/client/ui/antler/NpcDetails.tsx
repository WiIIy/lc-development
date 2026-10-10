import React, { Element, useRef, useState, useEffect } from "@rbxts/react";
import { UICONSTS } from "../Uistyle";
import { updateNpcUiState } from "client/clientAtoms";
import { useAtom } from "@rbxts/react-charm";

export function NpcDetail(): Element {
	const npcDataAtom = useAtom(updateNpcUiState);
	if (!npcDataAtom) {
		print("failed to fetch");
		return <></>;
	}

	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundColor3={UICONSTS.color.darkgray}>
			<uiaspectratioconstraint AspectRatio={100 / 160} />
			<uicorner CornerRadius={new UDim(0, 7)} />
			{/*parent frame*/}

			<frame
				Size={UDim2.fromScale(0.95, 0.95)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={UDim2.fromScale(0.5, 0.5)}
				BackgroundTransparency={1}
			>
				{/*container for padding*/}

				<uilistlayout FillDirection={"Vertical"} SortOrder={"LayoutOrder"} />

				<textlabel
					Size={new UDim2(1, 0, 0, 20)}
					TextColor3={UICONSTS.color.white}
					FontSize={Enum.FontSize.Size14}
					BackgroundTransparency={1}
					RichText={true}
					TextXAlignment={"Left"}
					Text={"  <b>" + npcDataAtom.entity + ". " + npcDataAtom.npcType + "</b>"}
				/>

				<NpcDetailLine data={"State : "} value={npcDataAtom.state} />
				<NpcDetailLine data={"Outfit : "} value={npcDataAtom.outfit} />
				<NpcDetailLine data={"Ai : "} value={npcDataAtom.ai} />
				<NpcDetailLine data={"Dialogue : "} value={npcDataAtom.dialogue} />

				{/*filler */}
				<frame Size={new UDim2(1, 0, 0, 20)} BackgroundTransparency={1}></frame>

				<NpcDetailLine data={"Alertness : "} value={tostring(npcDataAtom.alertness)} />
				<NpcDetailLine data={"AlertnessMultiplier : "} value={tostring(npcDataAtom.alertnessMultiplier)} />
				<NpcDetailLine data={"Morale : "} value={tostring(npcDataAtom.morale)} />
				<NpcDetailLine data={"MoraleMultiplier : "} value={tostring(npcDataAtom.moraleMultiplier)} />
				<NpcDetailLine data={"HearingRange : "} value={tostring(npcDataAtom.hearingRange)} />

				{/*filler */}
				<frame Size={new UDim2(1, 0, 0, 20)} BackgroundTransparency={1}></frame>

				<NpcDetailList data={"Perks : "} values={npcDataAtom.perks} />
				<NpcDetailList data={"Tags : "} values={npcDataAtom.tags} />
				<NpcDetailList data={"Status Effects : "} values={npcDataAtom.statusEffects} />
				<NpcDetailList data={"Systems At Work : "} values={npcDataAtom.systemsAtWork} />

				{/*filler */}
				<frame Size={new UDim2(1, 0, 0, 20)} BackgroundTransparency={1}></frame>

				<NpcDetailLine data={"Display Pathfinding : "} value={tostring(npcDataAtom.displayPathfinding)} />
				<NpcDetailLine data={"Highlighted : "} value={tostring(npcDataAtom.highlighted)} />
				<NpcDetailLine data={"Hostile : "} value={tostring(npcDataAtom.hostile)} />
			</frame>
		</frame>
	);
}

function NpcDetailLine(props: { data: string; value: string }) {
	return (
		<frame Size={new UDim2(1, 0, 0, 20)} BackgroundTransparency={1}>
			<textlabel
				Size={new UDim2(1, 0, 0, 20)}
				TextColor3={UICONSTS.color.white}
				FontSize={Enum.FontSize.Size11}
				BackgroundTransparency={1}
				RichText={true}
				TextXAlignment={"Left"}
				Text={"  <b>" + props.data + "</b>" + props.value + ""}
			/>
		</frame>
	);
}

function NpcDetailList(props: { data: string; values: string[] }) {
	return (
		<frame Size={new UDim2(1, 0, 0, 0)} AutomaticSize={"Y"} BackgroundTransparency={1}>
			<uilistlayout FillDirection={"Vertical"} SortOrder={"LayoutOrder"} />

			<textlabel
				Size={new UDim2(1, 0, 0, 20)}
				TextColor3={UICONSTS.color.white}
				FontSize={Enum.FontSize.Size11}
				BackgroundTransparency={1}
				RichText={true}
				TextXAlignment={"Left"}
				Text={"  <b>" + props.data + "</b>" + (props.values.size() === 0 ? "none" : "")}
			/>

			{props.values.map((value) => (
				<textlabel
					Size={new UDim2(1, 0, 0, 20)}
					TextColor3={UICONSTS.color.white}
					FontSize={Enum.FontSize.Size11}
					BackgroundTransparency={1}
					RichText={true}
					TextXAlignment={"Left"}
					Text={"- " + value}
				/>
			))}
		</frame>
	);
}

interface BillboardProps {
	targetPart: BasePart | Model;
	data: NpcData;
}

// export function NpcInspectorBillboard({ targetPart, data }: BillboardProps) {
// 	return (
// 		<billboardgui
// 			Adornee={targetPart}
// 			Size={UDim2.fromOffset(250, 400)}
// 			StudsOffset={new Vector3(3, 1, 0)} // Displays to the side of the head/torso
// 			AlwaysOnTop={true}
// 			ResetOnSpawn={false}
// 		>
// 			<NpcDetail {...data} />
// 		</billboardgui>
// 	);
// }
