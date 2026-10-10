import React, { Element } from "@rbxts/react";
import { Action, KEYBINDS } from "shared/data/profile/defaultKeybinds";
import { getDisplayStringForAction } from "shared/utils/input/getDisplayStringFromAction";

// A partial dictionary for custom descriptions. Falls back to the Enum name if not provided.
const ActionDescriptions: Partial<Record<Action, string>> = {
	[Action.LightAttack]: "Perform a light attack.",
	[Action.HeavyAttack]: "Perform a heavy attack.",
	[Action.Dash]: "Quickly dash out of the way.",
	[Action.Parry]: "Parry incoming attacks.",
	[Action.PourOil]: "Pour oil onto the ground.",
	[Action.DragCarryRagdoll]: "Drag or carry a body.",
	[Action.FireGun]: "Shoot currently equipped firearm.",
	[Action.AimGun]: "Aim down sights.",
	[Action.ThrowItem]: "Throw the readied item.",
	[Action.Grenade]: "Equip/Ready a grenade.",
};

export function KeyboardSettingsPanel(): Element {
	// Extract the keys from KEYBINDS to iterate over
	const actionsList: Action[] = [];
	for (const [action] of pairs(KEYBINDS)) {
		actionsList.push(action as Action);
	}

	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<uilistlayout FillDirection={"Horizontal"} />

			{/* Left 0.6: Keyboard Dashboard (Empty for now) */}
			<frame Size={UDim2.fromScale(0.6, 1)} BackgroundTransparency={1}>
				<textlabel
					Size={UDim2.fromScale(1, 1)}
					Text="[Keyboard Dashboard Placeholder]"
					TextColor3={Color3.fromRGB(100, 100, 100)}
					BackgroundTransparency={1}
					Font={"TitilliumWeb"}
					TextSize={24}
				/>
			</frame>

			{/* Right 0.4: Iterated List of Keybinds */}
			<scrollingframe
				Size={UDim2.fromScale(0.4, 1)}
				BackgroundTransparency={1}
				ScrollBarThickness={6}
				CanvasSize={new UDim2(0, 0, 0, actionsList.size() * 50 + 60)} // Approximate size per item + padding for the reset button
			>
				<uilistlayout FillDirection={"Vertical"} Padding={new UDim(0, 5)} HorizontalAlignment={"Center"} />

				{actionsList.map((action) => {
					// Fallback to the Action enum name if a description isn't found
					const description = ActionDescriptions[action] || action;
					const keyDisplay = getDisplayStringForAction(action);

					return <IndividualKeybindSetting key={action} description={description} keyDisplay={keyDisplay} />;
				})}

				{/* Reset to Default Button */}
				<textbutton
					Text="Reset to Default Keybinds"
					Size={UDim2.fromScale(0.9, 0)}
					AutomaticSize={Enum.AutomaticSize.Y}
					BackgroundColor3={Color3.fromRGB(150, 40, 40)}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					Font={"TitilliumWeb"}
					TextSize={18}
					Event={{ Activated: () => print("Reset Keybinds Fired") }}
				/>
			</scrollingframe>
		</frame>
	);
}

// ----------------------------------------------------------------------
// Child Component for individual rows
// ----------------------------------------------------------------------
function IndividualKeybindSetting(props: { description: string; keyDisplay: string }): Element {
	return (
		<frame
			Size={UDim2.fromScale(0.95, 0)}
			AutomaticSize={Enum.AutomaticSize.Y}
			BackgroundColor3={Color3.fromRGB(30, 30, 30)}
			BorderSizePixel={0}
		>
			<uipadding
				PaddingLeft={new UDim(0, 10)}
				PaddingRight={new UDim(0, 10)}
				PaddingTop={new UDim(0, 10)}
				PaddingBottom={new UDim(0, 10)}
			/>
			<uilistlayout FillDirection={"Horizontal"} VerticalAlignment={"Center"} HorizontalFlex={"SpaceBetween"} />

			<textlabel
				Text={props.description}
				Size={UDim2.fromScale(0.6, 0)}
				AutomaticSize={Enum.AutomaticSize.Y}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(200, 200, 200)}
				TextXAlignment={Enum.TextXAlignment.Left}
				TextWrapped={true}
				Font={"TitilliumWeb"}
				TextSize={16}
			/>

			{/* Placeholder for future binding assignment button */}
			<textbutton
				Text={props.keyDisplay}
				Size={UDim2.fromScale(0.3, 0)}
				AutomaticSize={Enum.AutomaticSize.Y}
				BackgroundColor3={Color3.fromRGB(50, 50, 50)}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				Font={"TitilliumWeb"}
				TextSize={18}
				BorderSizePixel={0}
				Event={{ Activated: () => print("Begin keybind edit for", props.description) }}
			>
				<uipadding PaddingTop={new UDim(0, 5)} PaddingBottom={new UDim(0, 5)} />
			</textbutton>
		</frame>
	);
}
