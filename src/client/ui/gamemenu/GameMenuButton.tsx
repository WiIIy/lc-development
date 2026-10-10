import React, { Element, useRef, useState } from "@rbxts/react";
import { TweenService } from "@rbxts/services";
import { UICONSTS } from "../Uistyle";

interface GameMenuButtonProps {
	text: string;
	onclick: () => void;
	onMouseEnter?: () => void; // Added for hover logic
	onMouseLeave?: () => void; // Added for hover logic
}

const FADE_DURATION = 0.5;

export function GameMenuButton(props: GameMenuButtonProps): Element {
	const [textcolor, setTextColor] = useState(Color3.fromRGB(194, 194, 194));
	const imageRef = useRef<ImageLabel>(undefined!);

	const tweenTransparency = (target: number) => {
		const image = imageRef.current;
		if (!image) return;

		const tween = TweenService.Create(
			image,
			new TweenInfo(FADE_DURATION, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ ImageTransparency: target },
		);
		tween.Play();
	};

	const onMouseEnter = () => {
		tweenTransparency(0.8);
		setTextColor(Color3.fromRGB(255, 255, 255));
		if (props.onMouseEnter) props.onMouseEnter();
	};

	const onMouseLeave = () => {
		tweenTransparency(1);
		setTextColor(Color3.fromRGB(194, 194, 194));
		if (props.onMouseLeave) props.onMouseLeave();
	};

	return (
		<textbutton
			Text={"<b>" + props.text + "</b>"}
			RichText={true}
			Font={"TitilliumWeb"}
			Size={UDim2.fromScale(0.9, 0.23)}
			BackgroundTransparency={1}
			TextColor3={textcolor}
			TextXAlignment={Enum.TextXAlignment.Left}
			FontSize={UICONSTS.fontSize.xxxLarge}
			Event={{
				MouseEnter: onMouseEnter,
				MouseLeave: onMouseLeave,
				Activated: props.onclick,
			}}
		>
			<imagelabel
				ref={imageRef}
				Image={"rbxassetid://96859513888248"}
				Size={UDim2.fromScale(0.5, 0.8)}
				BackgroundTransparency={1}
				ImageTransparency={1}
				AnchorPoint={new Vector2(0, 0.5)}
				Position={UDim2.fromScale(0, 0.5)}
			></imagelabel>
		</textbutton>
	);
}