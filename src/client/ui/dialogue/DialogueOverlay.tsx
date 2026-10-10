import { Dependency } from "@flamework/core";
import React, { Element, useRef, useEffect, useState } from "@rbxts/react";
import { useAtom } from "@rbxts/react-charm";
import { UserInputService, TweenService, Players, Workspace } from "@rbxts/services";
import { pointedItem } from "client/clientAtoms";
import { DialogueController } from "client/controllers/ui/DialogueController";
import { IMAGE_IDS } from "shared/data/assetid/ImageIDs";
import { AUDIO_PATH, DIALOGUE_TREE_PATH, ASSET_ID_PREFIX } from "shared/data/paths";
import { KEYBINDS, inputIsKey } from "shared/data/profile/defaultKeybinds";

// Define the shape of your character data
export interface CharacterConfig {
	spriteId: string;
	aspectRatio: number;
	spriteBGcolor: ColorSequence;
}

// Export the dictionary so other components can use it
export const CHARACTERS: { [key: string]: CharacterConfig } = {
	Galilei: {
		spriteId: IMAGE_IDS.characterSprites.galileiSprite.id,
		aspectRatio: IMAGE_IDS.characterSprites.galileiSprite.aspectratio,
		spriteBGcolor: new ColorSequence([
			new ColorSequenceKeypoint(0, Color3.fromRGB(31, 46, 36)),
			new ColorSequenceKeypoint(0.7, Color3.fromRGB(0, 0, 0)),
			new ColorSequenceKeypoint(1, Color3.fromRGB(0, 0, 0)),
		]),
	},
	Jonathan: {
		spriteId: IMAGE_IDS.characterSprites.jonathanSprite.id,
		aspectRatio: IMAGE_IDS.characterSprites.jonathanSprite.aspectratio,
		spriteBGcolor: new ColorSequence([
			new ColorSequenceKeypoint(0, Color3.fromRGB(56, 13, 13)),
			new ColorSequenceKeypoint(0.7, Color3.fromRGB(0, 0, 0)),
			new ColorSequenceKeypoint(1, Color3.fromRGB(0, 0, 0)),
		]),
	},
	Madam: {
		spriteId: IMAGE_IDS.characterSprites.madamSprite.id,
		aspectRatio: IMAGE_IDS.characterSprites.madamSprite.aspectratio,
		spriteBGcolor: new ColorSequence([
			new ColorSequenceKeypoint(0, Color3.fromRGB(56, 13, 13)),
			new ColorSequenceKeypoint(0.7, Color3.fromRGB(0, 0, 0)),
			new ColorSequenceKeypoint(1, Color3.fromRGB(0, 0, 0)),
		]),
	},
	Will: {
		spriteId: IMAGE_IDS.characterSprites.willSprite.id,
		aspectRatio: IMAGE_IDS.characterSprites.madamSprite.aspectratio,
		spriteBGcolor: new ColorSequence([
			new ColorSequenceKeypoint(0, Color3.fromRGB(56, 13, 13)),
			new ColorSequenceKeypoint(0.7, Color3.fromRGB(0, 0, 0)),
			new ColorSequenceKeypoint(1, Color3.fromRGB(0, 0, 0)),
		]),
	},
};

export function DialogueOverlay(): Element {
	// Refs for the UI Elements
	const topBar = useRef<Frame>(undefined);
	const bottomBar = useRef<Frame>(undefined);
	const spriteBackground = useRef<Frame>(undefined);
	const characterSprite = useRef<Frame>(undefined);
	const colorFrame = useRef<Frame>(undefined);

	const pointedItemString = useAtom(pointedItem);
	const [activeData, setActiveData] = useState<CharacterConfig | undefined>(undefined);
	const dialogueController = Dependency<DialogueController>();

	const isOpen = useRef(false);

	const toggleCinematicBars = (show: boolean) => {
		const topFrame = bottomBar.current;
		const bottomFrame = topBar.current;
		const backgroundSpriteFrame = spriteBackground.current;
		const characterSpriteFrame = characterSprite.current;
		const transparentColorFrame = colorFrame.current;

		if (!topFrame || !bottomFrame || !backgroundSpriteFrame || !characterSpriteFrame || !transparentColorFrame)
			return;

		// 1. Determine Targets
		const targetTop = show ? TOP_FRAME_VISIBLE : TOP_FRAME_HIDDEN;
		const targetBottom = show ? BOTTOM_FRAME_VISIBLE : BOTTOM_FRAME_HIDDEN;
		const targetBackground = show ? BACKGROUND_FRAME_VISIBLE : BACKGROUND_FRAME_HIDDEN;
		const targetSprite = show ? SPRITE_FRAME_VISIBLE : SPRITE_FRAME_HIDDEN;
		const targetTransparency = show ? COLOR_FRAME_VISIBLE_TRANSPARENCY : COLOR_FRAME_HIDDEN_TRANSPARENCY;

		// 2. Select TweenInfo based on Direction (Open vs Close)
		const tiBars = show ? OPEN_BARS : CLOSE_BARS;
		const tiBg = show ? OPEN_BG : CLOSE_BG;
		const tiChar = show ? OPEN_CHAR : CLOSE_CHAR;
		const delayWhoosh = show ? DELAY_CHAR : 0;
		const volumeWhoosh = show ? 0.09 : 0; //only plays on open

		// 3. Play Tweens
		TweenService.Create(topFrame, tiBars, { Position: targetTop }).Play();
		TweenService.Create(bottomFrame, tiBars, { Position: targetBottom }).Play();

		TweenService.Create(backgroundSpriteFrame, tiBg, { Position: targetBackground }).Play();
		TweenService.Create(characterSpriteFrame, tiChar, { Position: targetSprite }).Play();
		TweenService.Create(transparentColorFrame, ZOOM_IN_OUT, { BackgroundTransparency: targetTransparency }).Play();

		const camera = Workspace.CurrentCamera;

		if (camera !== undefined) {
			const fovTween = show ? camera.FieldOfView - FOV_ZOOM_AMOUNT : camera.FieldOfView + FOV_ZOOM_AMOUNT; //only plays on open
			TweenService.Create(camera, ZOOM_IN_OUT, { FieldOfView: fovTween }).Play();
		}

		task.wait(delayWhoosh);
		AUDIO_PATH.ui.whoosh.Volume = volumeWhoosh;
		AUDIO_PATH.ui.whoosh.PlaybackSpeed = AUDIO_PATH.ui.whoosh.TimeLength / 0.3;
		AUDIO_PATH.ui.whoosh.Play();
	};

	useEffect(() => {
		const unsub = dialogueController.producer.subscribe((newState: DialogueState, oldState: DialogueState) => {
			if (newState.dialogueEndedSignal && !oldState.dialogueEndedSignal) {
				toggleCinematicBars(false); //cleanup
				isOpen.current = false;
			}
		});
		return () => unsub();
	}, [dialogueController]);

	useEffect(() => {
		const connection = UserInputService.InputBegan.Connect((inp, proc) => {
			if (proc) return;

			// eslint-disable-next-line roblox-ts/lua-truthiness
			const characterData = pointedItemString ? CHARACTERS[pointedItemString] : undefined;

			if (KEYBINDS.CharacterInteract.some((key) => inputIsKey(inp, key))) {
				if (characterData && pointedItemString) {
					setActiveData(characterData);
					isOpen.current = !isOpen.current;
					toggleCinematicBars(isOpen.current);

					if (isOpen.current) {
						// --- SEARCHES IN THE DIALOGUETREES FOLDER FOR THE "dialogue" attribute string ---
						const charName = pointedItemString;
						const container = Workspace.WaitForChild("CharacterContainer") as Folder;
						const characterModel = container.FindFirstChild(charName);
						const dialogueID = characterModel?.GetAttribute("dialogue");

						if (characterModel && typeIs(dialogueID, "string")) {
							const charFolder = DIALOGUE_TREE_PATH.FindFirstChild(charName);
							const dialogueConfig = charFolder?.FindFirstChild(dialogueID);

							if (dialogueConfig && dialogueConfig.IsA("Configuration")) {
								dialogueController.onDialogueEvent(dialogueConfig, {
									Speaker: charName,
									Range: 50000,
									Position: new Vector3(0, 5, 0),
								});
							} else {
								warn(`Dialogue Config not found for: ${charName} -> ${dialogueID}`);
							}
						}
					} else {
						if (dialogueController.producer.getState().active) {
							dialogueController.producer.endDialogue();
						}
					}
				} else {
					setActiveData(undefined);
					isOpen.current = false;
					toggleCinematicBars(false);
				}
			}
		});

		return () => {
			connection.Disconnect();
		};
	}, [pointedItemString]);

	// ----- INSTANT DATA LOAD/NO NEED TO PRESS E TWICE ----
	useEffect(() => {
		if (activeData) {
			toggleCinematicBars(true);
		}
	}, [activeData]);

	// ----- SWAY EFFECT ----
	useEffect(() => {
		const frame = characterSprite.current;
		if (!frame) return;

		frame.Rotation = SWAY_AMOUNT_DEGREES;

		const swayInfo = new TweenInfo(SWAY_DURATION, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true, 0);

		const swayTween = TweenService.Create(frame, swayInfo, { Rotation: SWAY_AMOUNT_DEGREES });
		swayTween.Play();

		return () => {
			swayTween.Cancel();
		};
	}, []);

	if (!activeData) {
		return <></>;
	}

	return (
		<frame
			BackgroundTransparency={1}
			Size={UDim2.fromScale(1, 1)}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
		>
			{/*transparent color*/}
			<frame
				ref={colorFrame}
				Size={UDim2.fromScale(1, 1)}
				BackgroundColor3={new Color3(0, 0, 0)}
				BackgroundTransparency={1}
				ZIndex={-3}
			></frame>
			<frame
				ref={bottomBar}
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				Size={UDim2.fromScale(1, 0.1)}
				Position={TOP_FRAME_HIDDEN}
				AnchorPoint={new Vector2(0, 0)}
				BorderSizePixel={0}
			></frame>
			<frame
				ref={topBar}
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				Size={UDim2.fromScale(1, 0.1)}
				Position={BOTTOM_FRAME_HIDDEN}
				AnchorPoint={new Vector2(0, 1)}
				BorderSizePixel={0}
			></frame>
			{/*sprite bg*/}
			<frame
				ref={spriteBackground}
				Size={UDim2.fromScale(1.5, 0.8)}
				Position={BACKGROUND_FRAME_HIDDEN}
				BorderSizePixel={0}
				AnchorPoint={new Vector2(0, 0)}
				ZIndex={-2}
				Rotation={-80}
			>
				<uigradient Rotation={50} Color={activeData.spriteBGcolor} />
			</frame>
			{/*sprite image*/}
			<frame
				ref={characterSprite}
				BackgroundTransparency={1}
				Size={UDim2.fromScale(0.4, 0.8)}
				Position={SPRITE_FRAME_HIDDEN}
				AnchorPoint={new Vector2(1, 1)}
				ZIndex={2}
			>
				<imagelabel
					BackgroundTransparency={1}
					Size={UDim2.fromScale(1, 1)}
					Image={ASSET_ID_PREFIX + activeData.spriteId}
					ZIndex={2}
				/>
				<uiaspectratioconstraint AspectRatio={activeData.aspectRatio} />
			</frame>
		</frame>
	);
}

//consts are outside so they dont get re-rendered and cause big memory usage
// --- Animation Configuration ---
const DURATION = 0.3;
const STYLE = Enum.EasingStyle.Cubic;
const DIR = Enum.EasingDirection.Out;

const DELAY_BG = 0.12;
const DELAY_CHAR = 0.3;

// 1. OPENING Tweens (Bars first, then BG, then Char)
const OPEN_BARS = new TweenInfo(DURATION, STYLE, DIR, 0, false, 0);
const OPEN_BG = new TweenInfo(DURATION, STYLE, DIR, 0, false, DELAY_BG);
const OPEN_CHAR = new TweenInfo(DURATION, STYLE, DIR, 0, false, DELAY_CHAR);
const ZOOM_IN_OUT = new TweenInfo(DURATION + DELAY_CHAR, STYLE, DIR, 0, false, 0);
const FOV_ZOOM_AMOUNT = 10;

// 2. CLOSING Tweens (Char first, then BG, then Bars)
const CLOSE_CHAR = new TweenInfo(DURATION, STYLE, DIR, 0, false, 0);
const CLOSE_BG = new TweenInfo(DURATION, STYLE, DIR, 0, false, DELAY_CHAR - DELAY_BG);
const CLOSE_BARS = new TweenInfo(DURATION, STYLE, DIR, 0, false, DELAY_CHAR);

// --- Positions ---
const TOP_FRAME_HIDDEN = UDim2.fromScale(0, -0.1);
const TOP_FRAME_VISIBLE = UDim2.fromScale(0, 0);

const BOTTOM_FRAME_HIDDEN = UDim2.fromScale(0, 1.1);
const BOTTOM_FRAME_VISIBLE = UDim2.fromScale(0, 1);

const BACKGROUND_FRAME_HIDDEN = UDim2.fromScale(0.8, 0);
const BACKGROUND_FRAME_VISIBLE = UDim2.fromScale(0.4, 0);

const SPRITE_FRAME_HIDDEN = UDim2.fromScale(1.4, 1);
const SPRITE_FRAME_VISIBLE = UDim2.fromScale(1, 1);

const COLOR_FRAME_HIDDEN_TRANSPARENCY = 1;
const COLOR_FRAME_VISIBLE_TRANSPARENCY = 0.5;

const SWAY_AMOUNT_DEGREES = 4;
const SWAY_DURATION = 3;
