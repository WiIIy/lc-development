// Define the overall state for the dialogue system UI.
type DialogueState = {
	active: boolean; // Controls the visibility of the entire dialogue UI
	speakerName: string; // Name of the current speaker
	displayedPromptText: string; // The text currently visible in the prompt (for typewriter effect)
	fullPromptText: string; // The complete text for the current prompt
	currentResponses: DialogueNodeInfo[]; // List of available response options for the player
	canSkipTyping: boolean; // Whether the current prompt's typewriter effect can be skipped
	isTyping: boolean; // True if the typewriter effect is actively playing
	currentDialogueTree: Instance | undefined; // Reference to the root of the active dialogue tree
	currentParams: DialogueParams | undefined; // Parameters passed when dialogue started (e.g., position for range check)
	currentPromptNode: DialogueNodeInfo | undefined; // The currently active prompt node

	// transient states for UI interactions
	selectedResponseNode?: DialogueNodeInfo; // Stores the selected response node for the service to process
	continuePromptTrigger?: boolean; // A transient flag to signal "continue prompt" action
	dialogueEndedSignal: boolean; // Signal that dialogue has ended
	selectedResponseIndex?: number; // Index of the currently selected response for keyboard/scroll navigation
};
