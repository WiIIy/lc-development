import React, { Element } from "@rbxts/react";
import { useTimePlayed } from "../hooks/useTimePlayed";

export function formatPlaytime(seconds: number): string {
	const minutes = math.floor(seconds / 60);
	const hours = math.floor(minutes / 60);

	const remainingMinutes = minutes % 60;

	// Less than 1 hour
	if (hours === 0) {
		return `${minutes}m`;
	}

	// Less than 24 hours
	if (hours < 24) {
		return `${hours}hr${remainingMinutes}m`;
	}

	// 24+ hours
	const days = hours / 24;
	const roundedDays = math.floor(days * 10) / 10; // 1 decimal

	return `${hours}hr${remainingMinutes}m (${roundedDays} days)`;
}

export function StatisticsPanel(): Element {
	const timePlayed = useTimePlayed();

	return (
		<frame
			Size={UDim2.fromScale(0.6, 0.6)}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={Color3.fromRGB(20, 20, 20)}
			BorderSizePixel={0}
		>
			<uilistlayout
				Padding={new UDim(0, 6)}
				FillDirection={"Vertical"}
				HorizontalAlignment={"Center"}
				VerticalAlignment={"Top"}
			/>
			<StatAndData stat="Time Played" data={formatPlaytime(timePlayed)} />
		</frame>
	);
}

export function StatAndData(props: { stat: string; data: string }): Element {
	return (
		<frame Size={UDim2.fromScale(0.9, 0.03)} BackgroundTransparency={1}>
			<uilistlayout
				FillDirection={"Horizontal"}
				VerticalAlignment={"Center"}
				Padding={new UDim(0, 4)}
				HorizontalFlex={"SpaceBetween"}
			/>
			<textlabel
				Text={"<b>" + props.stat + "</b>"}
				Position={UDim2.fromScale(0, 0)}
				Size={UDim2.fromScale(0.4, 1)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(200, 200, 200)}
				TextXAlignment={Enum.TextXAlignment.Left}
				Font={"TitilliumWeb"}
				TextSize={20}
				RichText={true}
			/>

			<textlabel
				Text={props.data}
				Size={UDim2.fromScale(0.4, 1)}
				Position={UDim2.fromScale(0.5, 0)}
				BackgroundTransparency={1}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextXAlignment={Enum.TextXAlignment.Right}
				Font={"TitilliumWeb"}
				TextSize={20}
				RichText={true}
			/>
		</frame>
	);
}
