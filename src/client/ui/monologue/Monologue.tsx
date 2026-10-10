import React, { Element, useEffect, useRef } from "@rbxts/react";
import { useAtom } from "@rbxts/react-charm";
import { monologue } from "shared/sharedAtoms";
import { TweenService } from "@rbxts/services";

export function Monologue(): Element {
	const currentMonologue = useAtom(monologue);
	const textRef = useRef<TextLabel>(undefined);
	const frameRef = useRef<Frame>(undefined);

	useEffect(() => {
		const label = textRef.current;
		if (!label) return;

		if (currentMonologue !== "") {
			// Setup starting position (slightly lower, fully invisible)
			label.Text = currentMonologue;
			label.Position = UDim2.fromScale(0.5, 0.92);
			label.TextTransparency = 1;

			// Tween rising up and fading in
			const tweenIn = TweenService.Create(
				label,
				new TweenInfo(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
				{
					Position: UDim2.fromScale(0.5, 0.88),
					TextTransparency: 0,
				},
			);
			tweenIn.Play();
		} else {
			// Tween fading out when the text is cleared
			const tweenOut = TweenService.Create(
				label,
				new TweenInfo(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
				{
					TextTransparency: 1,
				},
			);
			tweenOut.Play();
		}
	}, [currentMonologue]);

	return (
		<frame ref={frameRef} Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1} ZIndex={10}>
			<textlabel
				ref={textRef}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={UDim2.fromScale(0.5, 0.92)}
				Size={UDim2.fromScale(0.6, 0.1)}
				BackgroundTransparency={1}
				Text={""}
				TextColor3={new Color3(1, 1, 1)}
				TextScaled={false}
				TextSize={14}
				TextWrapped={true}
				TextTransparency={1}
				BorderColor3={new Color3(0, 0, 0)}
				BorderSizePixel={1}
				BorderMode={"Outline"}
				Font={Enum.Font.GothamMedium}
			></textlabel>
		</frame>
	);
}
