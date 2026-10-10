// src/client/ui/dialogue/DialogueResponseButton.tsx
// A React component for individual dialogue response buttons.
import React from "@rbxts/react";
import { FunctionComponent } from "@rbxts/react";

interface DialogueResponseButtonProps {
	text: string; // The text to display on the button
	onClick: () => void; // Callback function when the button is clicked
	isSelected: boolean; // New prop: True if this button is currently selected
}

/**
 * A reusable React component for displaying a player response option in the dialogue.
 * It's styled as a TextButton and handles click events.
 * It visually changes based on the 'isSelected' prop.
 */
const DialogueResponseButton: FunctionComponent<DialogueResponseButtonProps> = ({ text, onClick, isSelected }) => {
	// Determine background and text color based on selection state
	const backgroundColor = isSelected ? Color3.fromRGB(120, 120, 120) : Color3.fromRGB(80, 80, 80); // Brighter if selected
	const textColor = isSelected ? Color3.fromRGB(255, 255, 255) : Color3.fromRGB(200, 200, 200); // Slightly brighter text if selected

	return (
		<textbutton
			key={text}
			Text={text}
			BackgroundColor3={backgroundColor}
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextSize={12}
			BackgroundTransparency={isSelected ? 0 : 1}
			TextXAlignment={Enum.TextXAlignment.Left}
			TextYAlignment={Enum.TextYAlignment.Center}
			Font={Enum.Font.ArialBold}
			Size={UDim2.fromScale(0, 0)}
			AutomaticSize={"XY"}
			TextWrapped={true}
			AutoButtonColor={false}
			Event={{
				Activated: onClick,
			}}
		>
			<uicorner CornerRadius={new UDim(0.1, 0)} />
			<uipadding
				PaddingBottom={new UDim(0, 8)}
				PaddingLeft={new UDim(0, 8)}
				PaddingRight={new UDim(0, 8)}
				PaddingTop={new UDim(0, 8)}
			/>
		</textbutton>
	);
};

export default DialogueResponseButton;
