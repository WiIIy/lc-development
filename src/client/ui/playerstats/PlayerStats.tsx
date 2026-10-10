/* eslint-disable roblox-ts/lua-truthiness */
import React, { Element, useState } from "@rbxts/react";
import { useAtom } from "@rbxts/react-charm";
import {
	activeStatusEffectsAtom,
	currentBloodAtom,
	currentHealthAtom,
	currentStaminaAtom,
	maxBloodAtom,
	maxHealthAtom,
	maxStaminaAtom,
} from "client/clientAtoms";
import { Blindness } from "../statuseffects/Blindness";
import { UICONSTS } from "../Uistyle";

const width = 0.28;
const leftOffset = 0.015;

function formatDebuffName(status: StatusEffect): string {
	if (status.bodyPart) {
		return `${status.id} (${status.bodyPart})`;
	}
	return status.id;
}

// function formatBuffName(status: BuffStatus): string {
// 	if (status.bodyPart) {
// 		return `${status.id} (${status.bodyPart})`;
// 	}
// 	return status.id;
// }

function getStatusEffectIcon(id: string): string {
	const icons: Record<string, string> = {
		//debuffs
		Bleed: "rbxassetid://103603483427971",
		Fracture: "rbxassetid://138707887229931",
		Blindness: "rbxassetid://137193678752191",
		SeeingThings: "rbxassetid://94205999656746",
		default: "rbxassetid://140024170331628", //placeholder
	};
	return icons[id] || icons["default"];
}

//consider just making the color one with the image. i think thas the way to go. can make icon shake if its severe or newly got too
function getStatusEffectBackgroundColor(id: string): string {
	const backgroundColors: Record<string, string> = {
		Green: "rbxassetid://88850639803220",

		default: "rbxassetid://88850639803220",
	};
	return backgroundColors[id] || backgroundColors["default"];
}

function getBlindnessType(debuffs: StatusEffect[]): "Left" | "Right" | "Both" | undefined {
	const hasLeft = debuffs.some((d) => d.id === "Blindness" && d.bodyPart === "Left Eye");
	const hasRight = debuffs.some((d) => d.id === "Blindness" && d.bodyPart === "Right Eye");

	if (hasLeft && hasRight) return "Both";
	if (hasLeft) return "Left";
	if (hasRight) return "Right";
	return undefined;
}

interface PlayerStatProps {
	previewMode?: boolean;
}

export function PlayerStats({ previewMode = false }): Element {
	const maxStam = useAtom(maxStaminaAtom);
	const maxHealth = useAtom(maxHealthAtom);
	const maxBlood = useAtom(maxBloodAtom);

	const currStam = useAtom(currentStaminaAtom);
	const currHealth = useAtom(currentHealthAtom);
	const currBlood = useAtom(currentBloodAtom);

	let statusEffects = useAtom(activeStatusEffectsAtom);
	// let buffs = useAtom
	//let status effects

	if (previewMode) {
		statusEffects = [
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
				id: "Bleeding",
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
		];
	}

	const buffs = statusEffects.filter((effect) => effect.type === "buff");

	const debuffs = statusEffects.filter((effect) => effect.type === "debuff");

	const [hoverIndex, setHoverIndex] = useState<number | undefined>(undefined);

	const blindnessEye = getBlindnessType(debuffs);

	return (
		<frame key={"PlayerStats"} Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<Health max={maxHealth} curr={currHealth} />
			<Blood max={maxBlood} curr={currBlood} />
			<Stamina max={maxStam} curr={currStam} />

			{/* buffs */}
			<frame
				Size={UDim2.fromScale(width, 0.04)}
				Position={UDim2.fromScale(leftOffset, 0.87)}
				AnchorPoint={new Vector2(0, 1)}
				BackgroundTransparency={1}
				BackgroundColor3={UICONSTS.color.red}
			>
				<uilistlayout FillDirection="Horizontal" Padding={new UDim(0, 5)} VerticalAlignment="Center" />

				{buffs.map((buff, index) => (
					<frame
						key={`debuff-${index}`}
						Size={UDim2.fromScale(0.08, 1)}
						BackgroundTransparency={0}
						Event={{
							MouseEnter: () => setHoverIndex(index),
							MouseLeave: () => setHoverIndex(undefined),
						}}
						AnchorPoint={new Vector2(0.5,0.5)}
					>
						<uiaspectratioconstraint AspectRatio={1} />

						{hoverIndex === index && (
							<textlabel
								Text={formatDebuffName(buff)}
								AutomaticSize="XY"
								Position={UDim2.fromScale(0.5, 0.2)}
								AnchorPoint={new Vector2(0, 1)}
								BackgroundColor3={new Color3(0, 0, 0)}
								BackgroundTransparency={0.3}
								TextColor3={new Color3(1, 1, 1)}
								TextSize={11}
								ZIndex={10}
							>
								<uipadding
									PaddingTop={new UDim(0, 4)}
									PaddingBottom={new UDim(0, 4)}
									PaddingLeft={new UDim(0, 6)}
									PaddingRight={new UDim(0, 6)}
								/>
								<uistroke Thickness={1} Transparency={0.5} />
								<uicorner CornerRadius={new UDim(0, 4)} />
							</textlabel>
						)}

						{/*status effect background; green for debuff, yellow and blue for positive idk*/}
						<imagelabel
							Size={UDim2.fromScale(1, 1)}
							SizeConstraint="RelativeYY"
							Image={"rbxassetid://88850639803220"}
							BackgroundTransparency={1}
						>
							<imagelabel
								Size={UDim2.fromScale(1, 1)}
								SizeConstraint="RelativeYY"
								Image={getStatusEffectIcon(buff.id)}
								BackgroundTransparency={1}
							></imagelabel>
						</imagelabel>
					</frame>
				))}
			</frame>

			{/*debuffs*/}
			<frame
				Size={UDim2.fromScale(width, 0.04)}
				Position={UDim2.fromScale(leftOffset, 0.91)}
				AnchorPoint={new Vector2(0, 1)}
				BackgroundTransparency={1}
				BackgroundColor3={UICONSTS.color.red}
			>
				<uilistlayout FillDirection="Horizontal" Padding={new UDim(0, 5)} VerticalAlignment="Center" />

				{debuffs.map((debuff, index) => (
					<frame
						key={`debuff-${index}`}
						Size={UDim2.fromScale(0.08, 1)}
						BackgroundTransparency={0}
						Event={{
							MouseEnter: () => setHoverIndex(index),
							MouseLeave: () => setHoverIndex(undefined),
						}}
					>
						<uiaspectratioconstraint AspectRatio={1} />

						{hoverIndex === index && (
							<textlabel
								Text={formatDebuffName(debuff)}
								AutomaticSize="XY"
								Position={UDim2.fromScale(0.5, 0.2)}
								AnchorPoint={new Vector2(0, 1)}
								BackgroundColor3={new Color3(0, 0, 0)}
								BackgroundTransparency={0.3}
								TextColor3={new Color3(1, 1, 1)}
								TextSize={11}
								ZIndex={10}
							>
								<uipadding
									PaddingTop={new UDim(0, 4)}
									PaddingBottom={new UDim(0, 4)}
									PaddingLeft={new UDim(0, 6)}
									PaddingRight={new UDim(0, 6)}
								/>
								<uistroke Thickness={1} Transparency={0.5} />
								<uicorner CornerRadius={new UDim(0, 4)} />
							</textlabel>
						)}

						<imagelabel
							Size={UDim2.fromScale(1, 1)}
							SizeConstraint="RelativeYY"
							Image={"rbxassetid://88850639803220"}
							BackgroundTransparency={1}
						>
							<imagelabel
								Size={UDim2.fromScale(1, 1)}
								SizeConstraint="RelativeYY"
								Image={getStatusEffectIcon(debuff.id)}
								BackgroundTransparency={1}
							></imagelabel>
						</imagelabel>
					</frame>
				))}
			</frame>

			{/*blindness lol */}
			{blindnessEye && <Blindness eye={blindnessEye} />}
		</frame>
	);
}

function Health(props: { max: number; curr: number }) {
	return (
		<frame
			Size={UDim2.fromScale(width, 0.05)}
			AnchorPoint={new Vector2(0, 1)}
			Position={UDim2.fromScale(leftOffset, 0.99)}
			BackgroundTransparency={0.4}
			BackgroundColor3={new Color3(0, 0, 0)}
			ZIndex={-1}
		>
			<textlabel
				Text={"  " + math.floor(props.curr) + "/" + props.max}
				Size={UDim2.fromScale(1, 1)}
				TextXAlignment={"Left"}
				BackgroundTransparency={1}
				TextSize={20}
				TextColor3={new Color3(0, 0, 0)}
				ZIndex={2}
			></textlabel>
			<frame
				Size={UDim2.fromScale(props.curr / props.max, 1)}
				BackgroundColor3={new Color3(255, 255, 255)}
				BackgroundTransparency={0.4}
				Position={UDim2.fromScale(0, 0.5)}
				AnchorPoint={new Vector2(0, 0.5)}
			/>
		</frame>
	);
}

function Stamina(props: { max: number; curr: number }) {
	return (
		<frame
			Size={UDim2.fromScale(width, 0.01)}
			AnchorPoint={new Vector2(0, 1)}
			Position={UDim2.fromScale(leftOffset, 0.94)}
			BackgroundTransparency={0.4}
			BackgroundColor3={new Color3(0, 0, 0)}
			ZIndex={-1}
		>
			<textlabel
				Text={"  " + math.floor(props.curr) + "/" + props.max}
				Size={UDim2.fromScale(1, 1)}
				TextXAlignment={"Left"}
				BackgroundTransparency={1}
				TextSize={12}
				TextColor3={new Color3(0, 0, 0)}
				ZIndex={2}
			></textlabel>
			<frame
				Size={UDim2.fromScale(props.curr / props.max, 1)}
				BackgroundColor3={new Color3(0.93, 0.84, 0.46)}
				BackgroundTransparency={0.4}
				Position={UDim2.fromScale(0, 0.5)}
				AnchorPoint={new Vector2(0, 0.5)}
			/>
		</frame>
	);
}

function Blood(props: { max: number; curr: number }) {
	return (
		<frame
			Size={UDim2.fromScale(width, 0.01)}
			AnchorPoint={new Vector2(0, 1)}
			Position={UDim2.fromScale(leftOffset, 0.93)}
			BackgroundColor3={new Color3(0, 0, 0)}
			BackgroundTransparency={0.4}
			ZIndex={-1}
		>
			<frame
				Size={UDim2.fromScale(props.curr / props.max, 1)}
				BackgroundColor3={new Color3(0.26, 0.02, 0.02)}
				BackgroundTransparency={0.4}
				Position={UDim2.fromScale(0, 0.5)}
				AnchorPoint={new Vector2(0, 0.5)}
			/>
		</frame>
	);
}
