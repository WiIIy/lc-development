/* eslint-disable roblox-ts/lua-truthiness */
// The main React component for displaying the dialogue UI.
import React, { useEffect, useRef } from "@rbxts/react";
import { useProducer, useSelector } from "@rbxts/react-reflex";
import { ContextActionService, TweenService, UserInputService } from "@rbxts/services";
import { Dialogue } from "./Dialogue";
import { DialogueCharacter } from "./DialogueCharacter";
import { KEYBINDS, inputIsKey } from "shared/data/profile/defaultKeybinds";

const DIALOGUE_TEXT_FONT = Enum.Font.ArialBold;
const DIALOGUE_PROMPT_COLOR = new Color3(1, 1, 1);
const DIALOGUE_BG_COLOR = Color3.fromRGB(40, 40, 40);

const DIALOGUE_ACTION_NAME = "DialogueInputHandler";

export interface ProducerType {
	selectResponse: (nodeInfo: DialogueNodeInfo) => void;
}

/**
 * Main DialogueHandler React component.
 * It renders the dialogue UI elements: speaker name, prompt text, and response buttons.
 * It uses React-Reflex for state management and dispatches actions to trigger logic.
 * This version adds keyboard and mouse wheel navigation for responses,
 * and spacebar to skip typing or select responses.
 */
const DialogueHandler = () => {
	const producer = useProducer();
	const {
		active,
		speakerName,
		displayedPromptText,
		fullPromptText,
		currentResponses,
		isTyping,
		canSkipTyping,
		dialogueEndedSignal,
		selectedResponseIndex,
	} = useSelector((state: DialogueState) => state);

	const canvasGroupRef = useRef<CanvasGroup>();
	const scrollingFrameRef = useRef<ScrollingFrame>();
	const frameRef = useRef<Frame>();

	// Effect to handle fade-in animation
	useEffect(() => {
		const mainCanvasGroup = canvasGroupRef.current;
		if (!mainCanvasGroup) return;
		mainCanvasGroup.GroupTransparency = 1;

		const FADE_IN_DURATION = 0.3;
		const tweenInfo = new TweenInfo(FADE_IN_DURATION, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

		if (active) {
			mainCanvasGroup.Visible = true;
			TweenService.Create(mainCanvasGroup, tweenInfo, { GroupTransparency: 0 }).Play();
		}
	}, [active]);

	// Effect to handle fade-out animation when the dialogue ends
	useEffect(() => {
		const mainCanvasGroup = canvasGroupRef.current;
		if (!mainCanvasGroup || !dialogueEndedSignal) return;
		mainCanvasGroup.GroupTransparency = 0;

		const FADE_OUT_DURATION = 0.3;
		const tweenInfo = new TweenInfo(FADE_OUT_DURATION, Enum.EasingStyle.Quad, Enum.EasingDirection.In);

		const tween = TweenService.Create(mainCanvasGroup, tweenInfo, { GroupTransparency: 1 });
		tween.Play();

		task.wait(FADE_OUT_DURATION); // Wait for tween to finish
		producer.clearDialogueEndedSignal();
		producer.setDialogueActive(false);
	}, [dialogueEndedSignal]);

	useEffect(() => {
		if (!active) return;
		const state = producer.getState() as DialogueState;
		const {
			currentResponses: currentResponsesInState,
			isTyping: isTypingInState,
			canSkipTyping: canSkipTypingInState,
			selectedResponseIndex: selectedResponseIndexInState,
		} = state;

		const inputConnection = UserInputService.InputEnded.Connect((input) => {
			const currentIndex = selectedResponseIndexInState ?? 0;
			// Ensure the input is from a keyboard and is either 'E' or 'Space'
			if (
				input.UserInputType === Enum.UserInputType.Keyboard &&
				KEYBINDS.ContinueDialogue.some((key) => inputIsKey(input, key))
			) {
				if (isTyping && canSkipTyping) {
					producer.skipPromptTyping();
				} else if (!isTyping && currentResponses.size() === 0 && canSkipTyping) {
					producer.triggerContinuePrompt();
				} else if (!isTyping && currentResponses.size() > 0 && selectedResponseIndexInState !== undefined) {
					producer.selectResponse(currentResponsesInState[selectedResponseIndexInState]);
				}
			}
		});

		// Cleanup function: Disconnects the event when dialogue is no longer active.
		return () => {
			inputConnection.Disconnect();
		};
	}, [active, isTyping, canSkipTyping, currentResponses, selectedResponseIndex, producer]);

	useEffect(() => {
		const wheelConnection = UserInputService.InputChanged.Connect((input) => {
			if (input.UserInputType !== Enum.UserInputType.MouseWheel) return;

			const state = producer.getState() as DialogueState;
			const numResponses = state.currentResponses.size();

			// Only handle scroll if there are responses to choose from
			if (!state.isTyping && numResponses > 0) {
				const currentIndex = state.selectedResponseIndex ?? -1;
				let newIndex = currentIndex;

				if (input.Position.Z > 0) {
					// Mouse wheel scrolled UP -> Move selection DOWN in the list
					newIndex = (currentIndex + 1) % numResponses;
				} else {
					// Mouse wheel scrolled DOWN -> Move selection UP in the list
					newIndex = (currentIndex - 1 + numResponses) % numResponses;
				}

				if (newIndex !== currentIndex) {
					producer.setSelectedResponseIndex(newIndex);
					producer.selectResponse(currentResponses[newIndex]);
				}
			}
		});

		// Cleanup function: Disconnects the event when dialogue is no longer active.
		return () => {
			wheelConnection.Disconnect();
		};
	}, [active, producer]); // Re-run if dialogue becomes active/inactive.

	// Effect to initialize selected response index when responses appear
	useEffect(() => {
		if (active && !isTyping && currentResponses.size() > 0 && selectedResponseIndex === undefined) {
			producer.setSelectedResponseIndex(0);
		}
	}, [active, isTyping, currentResponses, selectedResponseIndex, producer]);

	// Handles clicking on the prompt area to advance dialogue.
	const handlePromptClick = () => {
		if (isTyping && canSkipTyping) {
			producer.skipPromptTyping();
		} else if (!isTyping && canSkipTyping && currentResponses.size() === 0) {
			// Only continue if there are no responses to choose from.
			producer.triggerContinuePrompt();
		}
	};

	return (
		<DialogueCharacter
			canvasGroupRef={canvasGroupRef}
			active={active}
			frameRef={frameRef}
			dialogueEndedSignal={dialogueEndedSignal}
			speakerName={speakerName}
			currentResponses={currentResponses}
			isTyping={isTyping}
			selectedResponseIndex={selectedResponseIndex}
			displayedPromptText={displayedPromptText}
			handlePromptClick={handlePromptClick}
			producer={producer}
			bgcolor={DIALOGUE_BG_COLOR}
			font={DIALOGUE_TEXT_FONT}
			promptcolor={DIALOGUE_PROMPT_COLOR}
		/>
	);
};

export default DialogueHandler;
