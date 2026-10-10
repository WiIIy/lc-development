/* eslint-disable roblox-ts/lua-truthiness */
// Handles the core logic of the dialogue system, including tree traversal,
// node processing, and interaction with the Reflex store.
import { OnStart, Controller } from "@flamework/core";
import { Players } from "@rbxts/services";
import { RemoteEvents } from "client/network";
import ReactRoblox, { createPortal } from "@rbxts/react-roblox";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import Maid from "@rbxts/maid";
import Log from "@rbxts/log";
import DialogueHandler from "client/ui/dialogue/DialogueTextHandler";
import { node, number } from "@rbxts/react/src/prop-types";
import { dialogueProducer } from "shared/utils/ui/dialogueProducer";

//Significant functions
//loadNode -> handles node processing and proceeding
//loadNodes -> runs loadNode for every output if there's multiple
//processContinuePrompt -> handles prompt processing, if the prompt waits for a spacebar signal, this function is responsible
//onDialogueEvent -> handles node processing on DialogueRoot

const PromptTypeWaitTime = 0.02; // Time between each character in the typewriter effect

@Controller({})
export class DialogueController implements OnStart {
	readonly producer = dialogueProducer;
	private rootPart?: Part;
	private typingPromise: Promise<void> | undefined;
	private maid = new Maid();

	//
	//
	//------------------------ lifecycle ----------------------------------//
	//
	//

	onStart() {
		const player = Players.LocalPlayer;
		const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

		const dialogueScreenGui = new Instance("ScreenGui");
		dialogueScreenGui.Name = "DialogueSystemScreenGui";
		dialogueScreenGui.IgnoreGuiInset = true;
		dialogueScreenGui.ResetOnSpawn = false;
		dialogueScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
		dialogueScreenGui.Parent = playerGui;

		RemoteEvents.continueDialoguePrompt.connect(() => {
			dialogueProducer.triggerContinuePrompt();
		});

		const reactRoot = ReactRoblox.createRoot(dialogueScreenGui);

		reactRoot.render(
			<ReflexProvider producer={dialogueProducer}>
				{createPortal(<DialogueHandler />, dialogueScreenGui)}
			</ReflexProvider>,
		);

		if (player.Character) {
			this.rootPart = player.Character.WaitForChild("HumanoidRootPart") as Part;
		}
		// CharacterAdded connection cleanup
		const charConn = player.CharacterAdded.Connect((char) => {
			this.rootPart = char.WaitForChild("HumanoidRootPart") as Part;
		});
		this.maid.GiveTask(charConn);

		// dialogueRemote connection cleanup
		const dialogueConn = RemoteEvents.dialogueRemote.connect((dialogueTree: Instance, params?) => {
			this.onDialogueEvent(dialogueTree, params);
		});
		this.maid.GiveTask(dialogueConn);

		// Distance check loop cleanup
		let running = true;
		const distanceTask = task.spawn(() => {
			while (running) {
				task.wait(1);
				const state = this.producer.getState();
				const currentParams = state.currentParams;
				const rootPart = this.rootPart;

				if (
					state.active &&
					currentParams &&
					currentParams.Range !== undefined &&
					currentParams.Position &&
					rootPart
				) {
					const dist = rootPart.Position.sub(currentParams.Position).Magnitude;
					if (dist > currentParams.Range) {
						this.producer.endDialogue();
					}
				}
			}
		});
		this.maid.GiveTask(() => {
			running = false;
		});

		// Reflex producer subscription cleanup
		const unsub = this.producer.subscribe((newState: DialogueState, oldState: DialogueState) => {
			if (newState.selectedResponseNode && newState.selectedResponseNode !== oldState.selectedResponseNode) {
				this.processSelectedResponse(newState.selectedResponseNode);
			}
			if (newState.continuePromptTrigger && !oldState.continuePromptTrigger) {
				this.processContinuePrompt();
			}

			// Add a subscription for dialogue ending to reset character expressions
			if (!newState.active && oldState.active) {
				// Dialogue just ended, reset all character expressions to neutral
				// Iterate through registered characters and set their expression to "neutral" string

				if (newState.dialogueEndedSignal && !oldState.dialogueEndedSignal) {
					this.cleanConnections(); //cleanup
				}
			}
		});
		this.maid.GiveTask(unsub);

		// Clean up UI and React root when the controller is destroyed
		this.maid.GiveTask(() => {
			reactRoot.unmount();
			dialogueScreenGui.Destroy();
		});
	}

	//
	//
	//------------------------ internal utils ----------------------------------//
	//
	//

	/**
	 * Finds the root node of the dialogue tree.
	 * A root node is identified by having a "Type" attribute set to "DialogueRoot".
	 * @param tree The root instance of the dialogue tree.
	 * @returns The dialogue root node instance, or undefined if not found.
	 */
	private getRootNode(tree: Instance): Instance | undefined {
		for (const node of tree.GetChildren()) {
			if (node.GetAttribute("Type") === "DialogueRoot") {
				return node;
			}
		}
		return undefined;
	}

	/**
	 * Retrieves the actual node (Configuration instance) from a given value instance.
	 * This is used to resolve connections between nodes in the graph.
	 * @param value The ObjectValue instance whose Value points to a node.
	 * @returns The parent Configuration node, or undefined.
	 */
	private getNodeFromValue(value: Instance): Instance | undefined {
		const node = value.FindFirstAncestorWhichIsA("Configuration") || undefined;
		return node;
	}

	/**
	 * Gets all output nodes connected to the given input node.
	 * Output nodes are determined by ObjectValue children within an "Outputs" folder
	 * that point to other dialogue nodes.
	 * @param inputNode The node from which to find outputs.
	 * @returns An array of DialogueNodeInfo for all connected output nodes.
	 */
	private getOutputNodes(inputNode: Instance): DialogueNodeInfo[] {
		const nodes: Instance[] = [];
		for (const output of inputNode.GetDescendants()) {
			if (output.Parent?.Name === "Outputs" && output.IsA("ObjectValue") && output.Value !== undefined) {
				const node = this.getNodeFromValue(output.Value);
				if (node && !nodes.includes(node)) {
					nodes.push(node);
				}
			}
		}
		return nodes.map((node) => this.parseNodeInfo(node));
	}

	/**
	 * Gets all input nodes connected to the given output node.
	 * Input nodes are determined by ObjectValue children within an "Inputs" folder
	 * that point to other dialogue nodes.
	 * @param outputNode The node from which to find inputs.
	 * @returns An array of DialogueNodeInfo for all connected input nodes.
	 */
	private getInputNodes(outputNode: Instance): DialogueNodeInfo[] {
		const nodes: Instance[] = [];
		for (const input of outputNode.GetDescendants()) {
			if (input.Parent?.Name === "Inputs" && input.IsA("ObjectValue") && input.Value !== undefined) {
				const node = this.getNodeFromValue(input.Value);
				if (node && !nodes.includes(node)) {
					nodes.push(node);
				}
			}
		}
		return nodes.map((node) => this.parseNodeInfo(node));
	}

	/**
	 * Gets all raw Input ObjectValue instances connected to the given node.
	 * @param node The node to get inputs for.
	 * @returns An array of ObjectValue instances representing inputs.
	 */
	private getRawInputs(node: Instance): ObjectValue[] {
		const inputs: ObjectValue[] = [];
		for (const input of node.GetDescendants()) {
			if (input.Parent?.Name === "Inputs" && input.IsA("ObjectValue") && input.Value !== undefined) {
				inputs.push(input);
			}
		}
		return inputs;
	}

	/**
	 * Parses a Roblox Instance (dialogue node) into a `DialogueNodeInfo` object.
	 * Extracts attributes like Type, Priority, and checks for common children like Text, Skippable, ModuleScript.
	 * @param node The Roblox Instance representing a dialogue node.
	 * @returns A `DialogueNodeInfo` object containing parsed information.
	 */
	private parseNodeInfo(_node: Instance): DialogueNodeInfo {
		const _type = _node.GetAttribute("Type") as string;

		const priority = (_node.GetAttribute("Priority") as number) || 0;

		const textInstance = _node.FindFirstChild("Text");
		let text: string | undefined;
		if (textInstance && textInstance.IsA("StringValue")) {
			text = textInstance.Value;
		}

		const skippableInstance = _node.FindFirstChild("Skippable");
		let skippable: boolean | undefined;
		if (skippableInstance && skippableInstance.IsA("BoolValue")) {
			skippable = (skippableInstance as BoolValue).Value;
		}

		const characterInstance = _node.FindFirstChild("Character");

		let character: string | undefined;
		if (characterInstance && characterInstance.IsA("StringValue")) {
			character = (characterInstance as StringValue).Value;
		}

		const expressionInstance = _node.FindFirstChild("Expression");
		let expression: string | undefined;
		if (expressionInstance && expressionInstance.IsA("StringValue")) {
			expression = (expressionInstance as StringValue).Value;
		}

		const moduleScript = _node.FindFirstChildOfClass("ModuleScript") || undefined;

		return { instance: _node, _type, priority, text, skippable, moduleScript, character, expression };
	}

	/**
	 * Finds a node among a list by its "Type" attribute.
	 * @param nodes Array of DialogueNodeInfo to search through.
	 * @param _type The _type string to match.
	 * @returns The first matching DialogueNodeInfo, or undefined.
	 */
	private findNodeType(nodes: DialogueNodeInfo[], _type: string): DialogueNodeInfo | undefined {
		const foundNode = nodes.find((node) => node._type === _type);
		return foundNode;
	}

	/**
	 * Finds an input ObjectValue by its target Value's Name within a list of raw inputs.
	 * @param inputs Array of raw ObjectValue inputs.
	 * @param name The name of the target Value to match.
	 * @returns The matching ObjectValue instance, or undefined.
	 */
	private findInput(inputs: ObjectValue[], name: string): ObjectValue | undefined {
		const foundInput = inputs.find((input) => input.Value && input.Value.Name === name);
		return foundInput;
	}

	/**
	 * Fires RemoteEvents and BindableEvents found directly within a node.
	 * @param node The node instance.
	 */
	private fireEvents(node: Instance) {
		for (const event of node.GetChildren()) {
			if (event.IsA("RemoteEvent")) {
				(event as RemoteEvent).FireServer(node);
			} else if (event.IsA("BindableEvent")) {
				(event as BindableEvent).Fire(node);
			}
		}
	}

	/**
	 * Runs "commands" associated with input nodes of the given node.
	 * In the original Lua, this involved requiring ModuleScripts.
	 * Here, it's a placeholder for where you'd implement specific command logic.
	 * @param node The node instance whose inputs to check for commands.
	 */
	private runCommands(node: Instance) {
		for (const inputNodeInfo of this.getInputNodes(node)) {
			// Check if the input node is a "Command" type
			if (inputNodeInfo._type === "Command") {
				// Look for a ModuleScript named "Function" directly under the Command node instance
				const functionModule = inputNodeInfo.instance.FindFirstChild("Function");
				if (functionModule && functionModule.IsA("ModuleScript")) {
					try {
						// Require and execute the ModuleScript
						// It's good practice to pass relevant context (like the player, the node itself)
						// to the module script if it needs to perform actions.
						const moduleFunction = require(functionModule);
						if (typeIs(moduleFunction, "function")) {
							moduleFunction(Players.LocalPlayer, node);
						}
					} catch (e) {
						Log.Error(
							"[DialogueService] Error running command ModuleScript " + node.Name + e,
							inputNodeInfo.instance.Name,
							e,
						);
					}
				} else {
					Log.Warn(
						"[DialogueService] Command node {NodeName} does not have a 'Function' ModuleScript child.",
						inputNodeInfo.instance.Name,
					);
				}
			}
		}
	}

	/**
	 * Checks if a "Condition" input node allows the current node to be processed.
	 * If a condition module script returns a value different from the current node's priority, it "fails".
	 * @param node The node to check conditions for.
	 * @returns True if a condition prevents the node from loading, false otherwise.
	 */
	private checkForCondition(node: Instance): boolean {
		for (const inputNodeInfo of this.getInputNodes(node)) {
			if (inputNodeInfo._type === "Condition" && inputNodeInfo.moduleScript) {
				if (this.getRawInputs(inputNodeInfo.instance).size() <= 0) {
					Log.Warn(
						"[DialogueService] Attempted to check condition from ModuleScript for node: {NodeName}. Please implement specific handling for this condition logic.",
						inputNodeInfo.instance.Name,
					);
					if (inputNodeInfo.instance.GetAttribute("ReturnedValue") !== node.GetAttribute("Priority")) {
						return false; // Return true if condition fails, false if it passes (original logic was reversed?)
					}
				}
			}
		}
		return false;
	}

	/**
	 * Toggles the "Toggle" value of any "Lock" _type input nodes.
	 * @param node The node instance.
	 */
	private toggleLock(node: Instance) {
		for (const input of this.getRawInputs(node)) {
			if (input.Value?.Name === "Toggle" && input.Value.IsA("BoolValue")) {
				(input.Value as BoolValue).Value = !(input.Value as BoolValue).Value;
			}
		}
	}

	/**
	 * Checks if the given node is "locked" by a "Lock" node.
	 * A node is locked if it has a "Lock" input node whose "Toggle" value is true,
	 * AND if that Lock node has a "MainPathway" input connected to this node.
	 * @param node The node instance to check.
	 * @returns True if the node is locked, false otherwise.
	 */
	private isLocked(node: Instance): boolean {
		const lockNodeInfo = this.findNodeType(this.getInputNodes(node), "Lock");

		if (lockNodeInfo) {
			const toggleValue = lockNodeInfo.instance.FindFirstChild("Toggle") as BoolValue;
			if (toggleValue && toggleValue.Value === true) {
				// Check if this node is the "MainPathway" input for the Lock node
				const rawInputsOfLockNode = this.getRawInputs(lockNodeInfo.instance);
				const mainPathwayInput = this.findInput(rawInputsOfLockNode, "MainPathway");

				if (mainPathwayInput?.Value === node) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Runs internal commands specific to the node itself if it has a ModuleScript.
	 * Similar to `runCommands`, this is a placeholder for custom node-specific logic.
	 * @param node The node instance.
	 */
	private runInternalCommands(node: Instance) {
		const moduleScript = node.FindFirstChildOfClass("ModuleScript");
		if (moduleScript) {
			Log.Warn(
				"[DialogueService] Attempted to run internal ModuleScript for node: {NodeName}. Please implement specific handling for this node's internal logic.",
				node.Name,
			);
		}
	}

	/**
	 * Executes common functions for a dialogue node (commands, toggles, events, internal commands).
	 * @param node The node instance to process.
	 */
	private commonNodeFunctions(node: Instance) {
		this.runCommands(node);
		this.toggleLock(node);
		this.fireEvents(node);
		this.runInternalCommands(node);
	}

	/**
	 * Loads and processes a single dialogue node, logic handler.
	 * @param nodeInfo The information about the dialogue node to load.
	 */
	private async loadNode(nodeInfo: DialogueNodeInfo) {
		const _node = nodeInfo.instance;
		const _type = nodeInfo._type;

		if (!this.producer.getState().active) {
			return;
		}

		// Apply lock and condition checks
		if (this.isLocked(_node)) {
			// If the node itself is locked, we completely skip it.
			return;
		}
		if (this.checkForCondition(_node)) {
			return;
		}

		// Execute common functions that apply to all relevant node types
		this.commonNodeFunctions(_node);

		if (_type === "Response") {
			// Add the response node to the list of current responses in the state
			const currentResponses = this.producer.getState().currentResponses;
			if (!currentResponses.some((r) => r.instance === _node)) {
				// Avoid adding duplicates
				this.producer.setResponses([...currentResponses, nodeInfo].sort((a, b) => a.priority < b.priority));
			}
		} else if (_type === "Prompt" || _type === "ExpressionPrompt") {
			this.producer.setCurrentPromptNode(nodeInfo); // Set the current prompt node
			this.producer.setFullPromptText(nodeInfo.text || "");
			this.producer.setDisplayedPromptText(""); // Clear for typewriter effect
			this.producer.setCanSkipTyping(nodeInfo.skippable === true); // Ensure it's a boolean
			this.producer.setIsTyping(true); // Indicate typing has started

			if (_type === "ExpressionPrompt") {
				if (nodeInfo.character && nodeInfo.expression) {
					// Make sure character is isnt lowercase but expression is, "Arve", "neutral"
				} else {
					Log.Warn(
						`[DialogueController] ExpressionPrompt node ${nodeInfo.instance.Name} is missing 'Character' or 'Expression' attributes.`,
					);
				}
			}

			// Typewriter effect logic
			if (PromptTypeWaitTime > 0) {
				const fullText = nodeInfo.text || "";
				if (this.typingPromise) {
					// In a real scenario, you'd need a way to truly cancel the task.
					// For now, the loop break condition based on `isTyping` helps.
				}

				this.typingPromise = new Promise((resolve) => {
					task.spawn(() => {
						for (let i = 0; i < fullText.size(); i++) {
							const currentState = this.producer.getState();
							// Break if dialogue is no longer active or typing is skipped
							if (!currentState.active || !currentState.isTyping) {
								break;
							}
							// Update displayed text character by character
							this.producer.setDisplayedPromptText(fullText.sub(0, i + 1));
							task.wait(PromptTypeWaitTime);
						}
						this.producer.setDisplayedPromptText(fullText); // Ensure full text is shown
						this.producer.setIsTyping(false); // Mark typing as finished
						resolve();
					});
				});
				await this.typingPromise;
			} else {
				// If no typewriter effect, just display full text immediately
				this.producer.setDisplayedPromptText(nodeInfo.text || "");
				this.producer.setIsTyping(false);
			}

			const outputs = this.getOutputNodes(_node);
			const responseOutputs = outputs.filter((output) => output._type === "Response");
			const otherOutputsExist = outputs.some((output) => output._type !== "Response");

			if (responseOutputs.size() > 0) {
				// If there are response outputs, add them to the currentResponses state
				// This makes the DialogueResponseButtons visible in the UI
				this.producer.setResponses(responseOutputs.sort((a, b) => a.priority < b.priority));
			} else if (otherOutputsExist) {
				// If there are other outputs (not responses), the dialogue should wait for a "continue" action.
				// The processContinuePrompt will handle determining and loading the next appropriate node
				// from these outputs based on locking and priority rules.
				// We explicitly DO NOT call this.loadNodes here to allow the dialogue to pause.
				// If there are no outputs at all, this is likely an end-of-path prompt.
			}
		} else if (_node.FindFirstChildOfClass("ModuleScript")) {
			// Handle generic nodes with ModuleScripts (e.g., custom actions)
			this.loadNodes(this.getOutputNodes(_node));
		} else {
			this.loadNodes(this.getOutputNodes(_node));
		}
	}

	/**
	 * Clears all currently displayed responses
	 */
	private clearResponses() {
		this.producer.setResponses([]);
	}

	/**
	 * Loads all output nodes connected to the current node and decides what to do with them
	 * If no nodes are provided, the dialogue ends.
	 * @param nodes An array of DialogueNodeInfo to load.
	 */
	private loadNodes(nodes: DialogueNodeInfo[]) {
		if (nodes.size() === 0) {
			this.producer.endDialogue(); // End dialogue if no more nodes
			return;
		}

		this.clearResponses(); // Clear old responses before loading new ones

		// Load each node concurrently using task.spawn, as they might be prompts or responses.
		// Prompts will `await` internally, responses will just be added to state.
		for (const node of nodes) {
			task.spawn(() => this.loadNode(node));
		}
	}

	/**
	 * Handles incoming dialogue events, initiating the dialogue sequence.
	 * @param dialogueTree The root instance of the dialogue tree.
	 * @param params Optional parameters for the dialogue (e.g., speaker, range).
	 */
	onDialogueEvent(dialogueTree: Instance, params?: { Speaker?: string; Range?: number; Position?: Vector3 }) {
		// If dialogue is already active, ignore new event
		if (this.producer.getState().active) {
			Log.Warn("Dialogue is already active. Ignoring new dialogue event for tree: {TreeName}", dialogueTree.Name);
			return;
		}

		// Start dialogue and update initial state
		this.producer.startDialogue(dialogueTree, params || {});

		// Find the root node of the dialogue tree
		const rootNode = this.getRootNode(dialogueTree);

		if (rootNode) {
			// Reset "ReturnedValue" attribute on all condition nodes for a fresh start
			const rootNodeOutputs = this.getOutputNodes(rootNode);

			for (const condition of dialogueTree.GetChildren()) {
				if (condition.GetAttribute("Type") === "Condition") {
					condition.SetAttribute("ReturnedValue", undefined); // Clear previous condition results
				}
			}

			const otherOutputs = rootNodeOutputs.filter((output) => output._type !== "Response"); // Filter out responses

			if (otherOutputs.size() > 0) {
				// Filter for only prompt-like outputs that are NOT locked and pass conditions
				const availablePromptOutputs = otherOutputs.filter(
					(otherOutput) =>
						(otherOutput._type === "Prompt" || otherOutput._type === "ExpressionPrompt") &&
						!this.isLocked(otherOutput.instance) &&
						!this.checkForCondition(otherOutput.instance),
				);

				if (availablePromptOutputs.size() > 0) {
					// Sort by priority to find the highest priority among the AVAILABLE prompts
					availablePromptOutputs.sort((a, b) => a.priority < b.priority);

					// Get the lowest priority value from the sorted available prompts
					const lowestAvailablePriority = availablePromptOutputs[0].priority;

					// Filter for all prompts that share this highest available priority
					const highestPriorityAvailablePrompts = availablePromptOutputs.filter(
						(prompt) => prompt.priority === lowestAvailablePriority,
					);

					let selectedPrompt: DialogueNodeInfo;
					if (highestPriorityAvailablePrompts.size() > 1) {
						// If multiple prompts with same highest priority, pick one randomly
						const randomIndex = math.random(1, highestPriorityAvailablePrompts.size());
						selectedPrompt = highestPriorityAvailablePrompts[randomIndex - 1];
					} else {
						// If only one, select that one
						selectedPrompt = highestPriorityAvailablePrompts[0];
					}

					// Load only the selected (highest priority, unlocked, unconditioned) prompt
					this.loadNodes([selectedPrompt]);
				} else {
					Log.Error(
						"DialogueTree '{TreeName}' has no DialogueRoot node! Ending dialogue.",
						dialogueTree.Name,
					);
					warn("DialogueTree has no DialogueRoot node! Ending dialogue.");
					this.producer.endDialogue();
				}
			}
		}
	}

	/**
	 * Processes a selected response node when signaled by the UI.
	 * This method is called by the `onStateChanged` listener.
	 * @param nodeInfo The information about the response node that was chosen.
	 */
	private processSelectedResponse(nodeInfo: DialogueNodeInfo) {
		// Ensure dialogue is active before processing a response
		if (!this.producer.getState().active) {
			Log.Warn("Dialogue is not active. Cannot process selected response: {NodeName}", nodeInfo.instance.Name);
			return;
		}
		// Execute common functions for the chosen response node
		this.commonNodeFunctions(nodeInfo.instance);
		// Load the nodes connected to this response
		this.loadNodes(this.getOutputNodes(nodeInfo.instance));
		// Clear the transient state
		this.producer.clearSelectedResponse();
	}

	/**
	 * Handles a "continue" action from the prompt when signaled by the UI.
	 * This method is called by the `onStateChanged` listener.
	 */
	processContinuePrompt() {
		// print("from processContinuePrompt");
		const state = this.producer.getState();
		// Only continue if dialogue is active, NOT TYPING, and a prompt node exists
		if (!state.active || state.isTyping || !state.currentPromptNode) {
			// IMPORTANT: Check for !state.isTyping
			this.producer.clearContinuePromptTrigger(); // Clear the trigger even if conditions aren't met
			return;
		}

		// Check if there are any responses displayed. If yes, player should click a response.
		// This should be the primary check to prevent automatic continuation if responses are present.
		if (state.currentResponses.size() > 0) {
			this.producer.clearContinuePromptTrigger(); // Clear the trigger
			return;
		}

		// If no responses are displayed, then we determine the next node to load
		const currentPromptNodeInstance = state.currentPromptNode.instance;
		const outputs = this.getOutputNodes(currentPromptNodeInstance);
		const otherOutputs = outputs.filter((output) => output._type !== "Response"); // Filter out responses

		if (otherOutputs.size() > 0) {
			// Filter for only prompt-like outputs that are NOT locked and pass conditions
			const availablePromptOutputs = otherOutputs.filter(
				(otherOutput) =>
					(otherOutput._type === "Prompt" || otherOutput._type === "ExpressionPrompt") &&
					!this.isLocked(otherOutput.instance) &&
					!this.checkForCondition(otherOutput.instance),
			);

			if (availablePromptOutputs.size() > 0) {
				// Sort by priority to find the highest priority among the AVAILABLE prompts
				availablePromptOutputs.sort((a, b) => a.priority < b.priority);

				// Get the lowest priority value from the sorted available prompts
				const lowestAvailablePriority = availablePromptOutputs[0].priority;

				// Filter for all prompts that share this highest available priority
				const highestPriorityAvailablePrompts = availablePromptOutputs.filter(
					(prompt) => prompt.priority === lowestAvailablePriority,
				);

				let selectedPrompt: DialogueNodeInfo;
				if (highestPriorityAvailablePrompts.size() > 1) {
					// If multiple prompts with same highest priority, pick one randomly
					const randomIndex = math.random(1, highestPriorityAvailablePrompts.size());
					selectedPrompt = highestPriorityAvailablePrompts[randomIndex - 1];
				} else {
					// If only one, select that one
					selectedPrompt = highestPriorityAvailablePrompts[0];
				}

				// Load only the selected (highest priority, unlocked, unconditioned) prompt
				this.loadNodes([selectedPrompt]);
			} else {
				// If no available prompt outputs after filtering (all were locked or failed conditions),
				// then end the dialogue.
				this.producer.endDialogue();
			}
		} else {
			// If there are no other outputs at all, this is an end-of-path for this branch
			this.producer.endDialogue();
		}
		this.producer.clearContinuePromptTrigger(); // Clear the trigger after processing
		RemoteEvents.dialogueEndedSignal.fire(this.producer.getState().dialogueEndedSignal);
	}

	private cleanConnections() {
		this.maid.DoCleaning();
	}
}
