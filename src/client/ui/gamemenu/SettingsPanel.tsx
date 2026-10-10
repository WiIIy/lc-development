import React, { Element } from "@rbxts/react";
import { KeyboardSettingsPanel } from "./KeyboardSettingsPanel";

interface SettingsPanelProps {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

export function SettingsPanel({ activeTab, setActiveTab }: SettingsPanelProps): Element {
	return (
		<frame
			Size={UDim2.fromScale(0.7, 0.8)}
			Position={UDim2.fromScale(0.55, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={Color3.fromRGB(20, 20, 20)}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
			ZIndex={5}
		>
			{/* Header / Tabs */}
			<frame Size={UDim2.fromScale(1, 0.1)} BackgroundTransparency={1}>
				<uilistlayout
					FillDirection={"Horizontal"}
					HorizontalFlex={"SpaceEvenly"}
					VerticalAlignment={"Center"}
				/>

				{["Keyboard", "Visual", "Audio"].map((tabName) => (
					<textbutton
						key={tabName}
						Text={tabName}
						Size={UDim2.fromScale(0.3, 0.8)}
						BackgroundColor3={
							activeTab === tabName ? Color3.fromRGB(50, 50, 50) : Color3.fromRGB(30, 30, 30)
						}
						TextColor3={
							activeTab === tabName ? Color3.fromRGB(255, 255, 255) : Color3.fromRGB(150, 150, 150)
						}
						Font={"TitilliumWeb"}
						TextSize={24}
						BorderSizePixel={0}
						Event={{ Activated: () => setActiveTab(tabName) }}
					/>
				))}
			</frame>

			{/* Tab Content Area */}
			<frame Size={UDim2.fromScale(1, 0.9)} Position={UDim2.fromScale(0, 0.1)} BackgroundTransparency={1}>
				{activeTab === "Keyboard" && <KeyboardSettingsPanel />}
				{activeTab === "Visual" && (
					<textlabel
						Size={UDim2.fromScale(1, 1)}
						Text="Visual Settings Placeholder"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						BackgroundTransparency={1}
					/>
				)}
				{activeTab === "Audio" && (
					<textlabel
						Size={UDim2.fromScale(1, 1)}
						Text="Audio Settings Placeholder"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						BackgroundTransparency={1}
					/>
				)}
			</frame>
		</frame>
	);
}
