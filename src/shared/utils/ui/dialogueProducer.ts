/* eslint-disable roblox-ts/lua-truthiness */

import { createProducer } from "@rbxts/reflex";

// Initial state for the dialogue system.
const initialState: DialogueState = {
	active: false,
	speakerName: "",
	displayedPromptText: "",
	fullPromptText: "",
	currentResponses: [],
	canSkipTyping: false,
	isTyping: false,
	currentDialogueTree: undefined,
	currentParams: undefined,
	currentPromptNode: undefined,
	selectedResponseNode: undefined,
	continuePromptTrigger: false,
	dialogueEndedSignal: false,
	selectedResponseIndex: undefined,
};

export const dialogueProducer = createProducer(initialState, {
	setDialogueActive: (state: DialogueState, active: boolean) => ({ ...state, active }),
	setSpeakerName: (state: DialogueState, name: string) => ({ ...state, speakerName: name }),
	setDisplayedPromptText: (state: DialogueState, text: string) => ({ ...state, displayedPromptText: text }),
	setFullPromptText: (state: DialogueState, text: string) => ({ ...state, fullPromptText: text }),
	setResponses: (state: DialogueState, responses: DialogueNodeInfo[]) => ({ ...state, currentResponses: responses }),
	setCanSkipTyping: (state: DialogueState, canSkip: boolean) => ({ ...state, canSkipTyping: canSkip }),
	setIsTyping: (state: DialogueState, isTyping: boolean) => ({ ...state, isTyping }),
	// Action to set the current prompt node
	setCurrentPromptNode: (state: DialogueState, node: DialogueNodeInfo | undefined) => ({
		...state,
		currentPromptNode: node,
	}),
	// Action to initiate a new dialogue sequence
	startDialogue: (state: DialogueState, tree: Instance, params: DialogueParams) => ({
		...state,
		currentDialogueTree: tree,
		currentParams: params,
		active: true,
		speakerName: params.Speaker || "?",
		displayedPromptText: "",
		fullPromptText: "",
		currentResponses: [],
		canSkipTyping: false,
		isTyping: false,
		currentPromptNode: undefined,
		selectedResponseNode: undefined,
		continuePromptTrigger: false,
		dialogueEndedSignal: false, // Ensure this is false when starting a new dialogue
		selectedResponseIndex: undefined, //Reset selection on new dialogue
	}),
	// Action to immediately skip the prompt typing animation
	skipPromptTyping: (state) => ({ ...state, isTyping: false, displayedPromptText: state.fullPromptText }),
	// Action to end the current dialogue sequence and reset the state
	endDialogue: (state) => ({
		...state,
		currentResponses: [],
		canSkipTyping: false,
		isTyping: false,
		currentDialogueTree: undefined,
		currentParams: undefined,
		currentPromptNode: undefined,
		selectedResponseNode: undefined,
		continuePromptTrigger: false,
		dialogueEndedSignal: true,
		selectedResponseIndex: undefined, // Clear selection when dialogue ends
	}),

	selectResponse: (state: DialogueState, node: DialogueNodeInfo) => ({ ...state, selectedResponseNode: node }),
	clearSelectedResponse: (state: DialogueState) => ({ ...state, selectedResponseNode: undefined }),
	triggerContinuePrompt: (state: DialogueState) => ({ ...state, continuePromptTrigger: true }),
	clearContinuePromptTrigger: (state: DialogueState) => ({ ...state, continuePromptTrigger: false }),
	clearDialogueEndedSignal: (state: DialogueState) => ({ ...state, dialogueEndedSignal: false }),
	setSelectedResponseIndex: (state: DialogueState, index: number | undefined) => ({
		...state,
		selectedResponseIndex: index,
	}),
});
