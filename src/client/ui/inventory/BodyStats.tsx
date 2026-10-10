import React, { Element, useState, useEffect } from "@rbxts/react";
import { useAtom } from "@rbxts/react-charm";
import { activeStatusEffectsAtom } from "client/clientAtoms";
import { UICONSTS } from "../Uistyle";

// Helper to check if a specific body part is affected by the list of statusEffects
function getStatusEffectForPart(partName: string, allstatusEffects: StatusEffect[]): StatusEffect[] {
	return allstatusEffects.filter((d) => {
		if (d.bodyPart === partName) return true;
		// Map specific parts to general body areas
		if (partName === "Head" && (d.bodyPart === "Left Eye" || d.bodyPart === "Right Eye")) return true;
		return false;
	});
}

interface BodyPartProps {
	name: string;
	size: UDim2;
	position: UDim2;
	anchorPoint: Vector2;
	statusEffects: StatusEffect[];
	isSelected: boolean;
	onSelect: (name: string) => void;
}

function BodyPart({ name, size, position, anchorPoint, statusEffects, isSelected, onSelect }: BodyPartProps) {
	const [hovered, setHovered] = useState(false);

	const isInjured = statusEffects.size() > 0;
	const hasShrapnel = statusEffects.some((d) => d.id === "Shrapnel");

	// Color: Red if injured, White if healthy
	const color = isInjured ? new Color3(0.98, 0, 0) : new Color3(1, 1, 1);

	// Join unique debuff IDs (e.g. "Fracture\nBleeding")
	const tooltipText = statusEffects.map((d) => d.id).join("\n");

	return (
		<textbutton
			Text=""
			AutoButtonColor={false}
			Size={size}
			Position={position}
			AnchorPoint={anchorPoint}
			BackgroundColor3={color}
			BackgroundTransparency={0}
			Event={{
				MouseEnter: () => setHovered(true),
				MouseLeave: () => setHovered(false),
				Activated: () => {
					if (hasShrapnel) {
						onSelect(name);
					}
				},
			}}
		>
			{/* Hover Tooltip (Only if NOT selected to avoid overlapping UI clutter) */}
			{hovered && isInjured && !isSelected && (
				<textlabel
					Text={tooltipText}
					AutomaticSize="XY"
					Position={UDim2.fromScale(0.5, 0)}
					AnchorPoint={new Vector2(0.5, 1)}
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

			{/* "Take Out" Popup (Only if Selected AND has Shrapnel) */}
			{isSelected && hasShrapnel && (
				<textbutton
					Text="Take Out"
					AutomaticSize="XY"
					Position={UDim2.fromScale(0.5, 0.5)}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={new Color3(0, 0, 0)}
					BackgroundTransparency={0.2}
					TextColor3={new Color3(1, 1, 1)} // Slightly red text to indicate action
					TextSize={11}
					ZIndex={20}
					Event={{
						Activated: () => {
							print(`Requesting to take out shrapnel from ${name}`);
							// Add your RemoteEvent logic here, e.g.:
							// RemoteEvents.requestSurgery.fire(name, "Shrapnel");
						},
					}}
				>
					<uipadding
						PaddingTop={new UDim(0, 4)}
						PaddingBottom={new UDim(0, 4)}
						PaddingLeft={new UDim(0, 6)}
						PaddingRight={new UDim(0, 6)}
					/>
					<uicorner CornerRadius={new UDim(0, 4)} />
				</textbutton>
			)}
		</textbutton>
	);
}

export function BodyStats(props: { visible: boolean }) {
	const statusEffects = useAtom(activeStatusEffectsAtom);
	const [selectedPart, setSelectedPart] = useState<string | undefined>(undefined);

	// Reset selection when inventory closes
	useEffect(() => {
		if (!props.visible) {
			setSelectedPart(undefined);
		}
	}, [props.visible]);

	return (
		<frame
			Visible={props.visible}
			Size={UDim2.fromScale(0.12, 0.19)}
			Position={UDim2.fromScale(0.015, 0.83)}
			AnchorPoint={new Vector2(0, 1)}
			BackgroundTransparency={0}
		>
			<uiaspectratioconstraint AspectRatio={600 / 710} />

			{/*body image*/}
			<imagelabel
				Image={"rbxassetid://104401711602348"}
				Size={UDim2.fromScale(1, 1)}
				BackgroundTransparency={1}
				ImageColor3={UICONSTS.color.custom_color_mid_dark}
				Position={UDim2.fromScale(0.5, 1)}
				AnchorPoint={new Vector2(0.5, 1)}
				ZIndex={2}
			>
				<uicorner CornerRadius={new UDim(0, 10)} />
				<uiaspectratioconstraint AspectRatio={600 / 710} />

				<BodyPart
					name="Right Arm"
					size={UDim2.fromScale(0.16, 0.24)}
					position={UDim2.fromScale(0.83, 0.33)}
					anchorPoint={new Vector2(1, 0)}
					statusEffects={getStatusEffectForPart("Right Arm", statusEffects)}
					isSelected={selectedPart === "Right Arm"}
					onSelect={setSelectedPart}
				/>

				<BodyPart
					name="Left Arm"
					size={UDim2.fromScale(0.16, 0.24)}
					position={UDim2.fromScale(0.17, 0.33)}
					anchorPoint={new Vector2(0, 0)}
					statusEffects={getStatusEffectForPart("Left Arm", statusEffects)}
					isSelected={selectedPart === "Left Arm"}
					onSelect={setSelectedPart}
				/>

				<BodyPart
					name="Torso"
					size={UDim2.fromScale(0.34, 0.24)}
					position={UDim2.fromScale(0.33, 0.33)}
					anchorPoint={new Vector2(0, 0)}
					statusEffects={getStatusEffectForPart("Torso", statusEffects)}
					isSelected={selectedPart === "Torso"}
					onSelect={setSelectedPart}
				/>

				<BodyPart
					name="Head"
					size={UDim2.fromScale(0.23, 0.165)}
					position={UDim2.fromScale(0.38, 0.16)}
					anchorPoint={new Vector2(0, 0)}
					statusEffects={getStatusEffectForPart("Head", statusEffects)}
					isSelected={selectedPart === "Head"}
					onSelect={setSelectedPart}
				/>

				<BodyPart
					name="Left Leg"
					size={UDim2.fromScale(0.17, 0.24)}
					position={UDim2.fromScale(0.33, 0.57)}
					anchorPoint={new Vector2(0, 0)}
					statusEffects={getStatusEffectForPart("Left Leg", statusEffects)}
					isSelected={selectedPart === "Left Leg"}
					onSelect={setSelectedPart}
				/>

				<BodyPart
					name="Right Leg"
					size={UDim2.fromScale(0.17, 0.24)}
					position={UDim2.fromScale(0.5, 0.57)}
					anchorPoint={new Vector2(0, 0)}
					statusEffects={getStatusEffectForPart("Right Leg", statusEffects)}
					isSelected={selectedPart === "Right Leg"}
					onSelect={setSelectedPart}
				/>
			</imagelabel>
		</frame>
	);
}
