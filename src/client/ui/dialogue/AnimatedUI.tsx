import React, { useEffect, useState } from "@rbxts/react";

interface AnimatedSpriteProps {
	imageSheets: string[]; // decal IDs (each a 4x4 grid)
	totalFrames: number; // total number of animation frames across all sheets
	frameSpeed: number; // time per frame in seconds
	size?: UDim2;
	position?: UDim2;
	anchorPoint?: Vector2;
}

const SPRITE_SHEET_COLS = 4;
const FRAMES_PER_SHEET = 16;
/**
 * Animated Sprite
 * @param imageSheets A list of image id's containing 4x4 frames. eg: imageSheets={["103726754518321","77047615321639"]}
 * @param totalFrames The total amount of frames across all spritesheets
 * @param frameSpeed Amount of time each frame is displayed, the less the faster it plays
 * @param size imagelabel size
 * @param position imagelabel position
 * @param anchorPoint imagelabel anchorpoint
 */
export const AnimatedSprite = (props: AnimatedSpriteProps) => {
	const [currentFrame, setCurrentFrame] = useState(0);

	useEffect(() => {
		let lastTime = tick();

		const renderStep = game.GetService("RunService").RenderStepped.Connect(() => {
			const now = tick();
			if (now - lastTime >= props.frameSpeed) {
				lastTime = now;

				setCurrentFrame((prev) => (prev + 1) % props.totalFrames);
			}
		});

		return () => {
			renderStep.Disconnect();
		};
	}, [props.totalFrames, props.frameSpeed]);

	// Figure out which sheet and which frame within the sheet
	const sheetIndex = math.floor(currentFrame / FRAMES_PER_SHEET);
	const frameInSheet = currentFrame % FRAMES_PER_SHEET;

	const row = math.floor(frameInSheet / SPRITE_SHEET_COLS);
	const col = frameInSheet % SPRITE_SHEET_COLS;

	return (
		<imagelabel
			Image={`rbxassetid://${props.imageSheets[sheetIndex]}`}
			Size={props.size ?? new UDim2(0, 64, 0, 64)}
			Position={props.position}
			AnchorPoint={props.anchorPoint ?? new Vector2(0.5, 0.5)}
			BackgroundTransparency={1}
			ImageRectSize={new Vector2(1024 / SPRITE_SHEET_COLS, 1024 / SPRITE_SHEET_COLS)}
			ImageRectOffset={new Vector2((1024 / SPRITE_SHEET_COLS) * col, (1024 / SPRITE_SHEET_COLS) * row)}
		/>
	);
};
