// Define the structure for a dialogue node's information to pass to the producer.
type DialogueNodeInfo = {
	instance: Instance; // Reference to the actual Roblox Instance of the node
	_type: string; // The type of dialogue node (e.g., "Prompt", "Response", "Condition", "Lock")
	priority: number; // For ordering responses or conditions
	text?: string; // The text content for "Prompt" or "Response" nodes
	skippable?: boolean; // Whether a "Prompt" can be skipped
	moduleScript?: ModuleScript; // Reference to a ModuleScript child, if it exists
	character?: string;
	expression?: string;
};
