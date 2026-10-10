import React, { Element } from "@rbxts/react";
import { UICONSTS } from "../Uistyle";

const leftOffset = 0.015;

interface PlayerListProps {
	previewMode?: boolean;
}

interface PlayerListData {
	name: string;
	username: string;
	highlightColor: Color3;
	statusEffects: StatusEffect[];
	scrips: number;
	health: number; //value of 0-1. like a percent scale thing
}

const dummyPlayerData: PlayerListData[] = [
	{
		name: "Rumley",
		username: "K_Rumley",
		highlightColor: new Color3(0.08, 0.71, 0.22),
		statusEffects: [],
		scrips: 100,
		health: 0.8,
	},
	{
		name: "E",
		username: "Cheese_eater",
		highlightColor: new Color3(0.94, 0.82, 0.17),
		statusEffects: [
			{
				id: "Fracture",
				bodyPart: "Right Leg",
				startTime: os.time(),
				type: "debuff", //this will probably be automatically resolved with a function like checkStatusEffectType(id)
			},
			{
				id: "Fracture",
				bodyPart: "Left Leg",
				startTime: os.time(),
				type: "debuff",
			},
			{
				id: "Bleed",
				bodyPart: "Left Leg",
				startTime: os.time(),
				type: "debuff",
			},
			{
				id: "Shrapnel",
				bodyPart: "Right Arm",
				startTime: os.time(),
				type: "debuff",
			},
		],
		scrips: 10,
		health: 1,
	},
	{
		name: "Jaakari",
		username: "leon31323",
		highlightColor: new Color3(0.67, 0.03, 0.03),
		statusEffects: [
			{
				id: "Fracture",
				bodyPart: "Right Leg",
				startTime: os.time(),
				type: "debuff",
			},
			{
				id: "Fracture",
				bodyPart: "Left Leg",
				startTime: os.time(),
				type: "debuff",
			},
			{
				id: "Bleed",
				bodyPart: "Left Leg",
				startTime: os.time(),
				type: "debuff",
			},
			{
				id: "Shrapnel",
				bodyPart: "Right Arm",
				startTime: os.time(),
				type: "debuff",
			},
		],
		scrips: 100,
		health: 1,
	},
	{
		name: "Adrian Haley LongName",
		username: "JosephJohn3",
		highlightColor: new Color3(0.05, 0.16, 0.64),
		statusEffects: [],
		scrips: 100,
		health: 1,
	},
	{
		name: "Samael",
		username: "rot_viscera",
		highlightColor: new Color3(0.89, 0.35, 0.14),
		statusEffects: [],
		scrips: 100,
		health: 0.3,
	},
];

const bgTransparencyForTesting = 1;

export function PlayerList({ previewMode = false }: PlayerListProps): Element {
	return (
		<frame
			Size={UDim2.fromScale(0.2, 0.38)}
			Position={UDim2.fromScale(leftOffset, 0.6)}
			AnchorPoint={new Vector2(0, 1)}
			BackgroundTransparency={bgTransparencyForTesting}
		>
			<uilistlayout FillDirection={"Vertical"} VerticalAlignment={"Center"} />
			{dummyPlayerData.map((data) => (
				<IndividualPlayerDisplay
					key={data.username}
					name={data.name}
					username={data.username}
					highlightColor={data.highlightColor}
					statusEffects={data.statusEffects}
					scrips={data.scrips}
					health={data.health}
				/>
			))}
		</frame>
	);
}

export function IndividualPlayerDisplay(props: PlayerListData): Element {
	return (
		<frame Size={UDim2.fromScale(1, 0.2)} BackgroundTransparency={1}>
			{/*text frame for extra padding that doesnt apply on everythin else*/}
			<frame Size={UDim2.fromScale(0.5, 0.45)} BackgroundTransparency={1}>
				<uipadding PaddingLeft={new UDim(0, 4)} />

				{/*display name + color*/}
				<frame
					Size={UDim2.fromScale(1, 0.555)}
					Position={UDim2.fromScale(0, 0)}
					AnchorPoint={new Vector2(0, 0)}
					AutomaticSize={"X"}
					BackgroundTransparency={bgTransparencyForTesting}
				>
					<textlabel
						Text={props.name}
						Size={UDim2.fromScale(0, 1)}
						BackgroundTransparency={bgTransparencyForTesting}
						TextSize={12}
						TextXAlignment={"Left"}
						AutomaticSize={"X"}
						TextColor3={UICONSTS.color.custom_color_light}
					>
						<uistroke Color={UICONSTS.color.custom_color_dark} />
					</textlabel>

					{/*color highlight */}
					<frame
						Size={UDim2.fromScale(0.2, 0.6)}
						AnchorPoint={new Vector2(1, 0.5)}
						Position={UDim2.fromScale(1.15, 0.9)}
						BackgroundColor3={props.highlightColor}
					>
						<uistroke Thickness={1} />
						<uicorner CornerRadius={new UDim(0, 30)} />
						<uiaspectratioconstraint AspectRatio={1} />
					</frame>
				</frame>

				{/*username */}
				<textlabel
					Text={props.username}
					Size={UDim2.fromScale(1, 0.444)}
					BackgroundTransparency={1}
					TextSize={9}
					TextXAlignment={"Left"}
					TextColor3={UICONSTS.color.custom_color_mid}
					Position={UDim2.fromScale(0, 0.6)}
					AnchorPoint={new Vector2(0, 0)}
				/>
			</frame>

			{/*healthbar bg */}
			<frame
				Size={UDim2.fromScale(0.8, 0.2)}
				Position={UDim2.fromScale(0, 0.8)}
				AnchorPoint={new Vector2(0, 1)}
				BackgroundColor3={UICONSTS.color.custom_color_mid_dark}
				ClipsDescendants={true}
			>
				<uicorner CornerRadius={new UDim(0, 30)} />
				<uistroke Thickness={1} />
				<frame Size={UDim2.fromScale(props.health, 1)}>
					<uicorner CornerRadius={new UDim(0, 30)} />
					{/*uistrokes dont work with uicorners so this appends at the end for a flat look ONLY on non full healthbars*/}
					{props.health < 1 && (
						<frame
							Size={UDim2.fromScale(0.5, 1)}
							AnchorPoint={new Vector2(1, 0.5)}
							Position={UDim2.fromScale(1, 0.5)}
							BorderSizePixel={0}
						/>
					)}
				</frame>
			</frame>

			{/*scrips*/}
			<textlabel
				Text={tostring(props.scrips)}
				Size={UDim2.fromScale(0.2, 0.3)}
				Position={UDim2.fromScale(1, 0.6)}
				AnchorPoint={new Vector2(1, 0.5)}
				BackgroundTransparency={1}
			/>
		</frame>
	);
}

export function StatusEffectsDisplay(props: StatusEffect[]) {}

//buffs debuffs should just be one unified status effect list
