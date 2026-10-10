type dialogueTrees = Folder & {
	TestDialogueWithAnimatedImage: Configuration & {
		DialogueRoot: Configuration & {
			MainPathway: StringValue & {
				Outputs: Folder;
			};
		};
		Welcome: Configuration & {
			Text: StringValue;
			Skippable: BoolValue;
			MainPathway: StringValue & {
				Inputs: Folder;
				Outputs: Folder;
			};
		};
	};
	Will: Folder & {
		TestArveDialogue: Configuration & {
			Welcome: Configuration & {
				Text: StringValue;
				Skippable: BoolValue;
				MainPathway: StringValue & {
					Inputs: Folder;
					Outputs: Folder;
				};
			};
			ExpressionPrompt: Configuration & {
				Text: StringValue;
				Skippable: BoolValue;
				MainPathway: StringValue & {
					Inputs: Folder;
					Outputs: Folder;
				};
			};
			DialogueRoot: Configuration & {
				MainPathway: StringValue & {
					Outputs: Folder;
				};
			};
		};
		Will1: Configuration & {
			DialogueRoot: Configuration & {
				MainPathway: StringValue & {
					Outputs: Folder & {
						Prompt: ObjectValue;
					};
				};
			};
		};
	};
	TestDialogueWithImage: Configuration & {
		Goodbye: Configuration & {
			MainPathway: StringValue & {
				Inputs: Folder;
				Outputs: Folder;
			};
			Text: StringValue;
		};
		Welcome: Configuration & {
			Text: StringValue;
			Skippable: BoolValue;
			MainPathway: StringValue & {
				Inputs: Folder;
				Outputs: Folder & {
					Response: ObjectValue;
				};
			};
		};
		DialogueRoot: Configuration & {
			MainPathway: StringValue & {
				Outputs: Folder & {
					Welcome: ObjectValue;
				};
			};
		};
		["Ta-da!"]: Configuration & {
			Text: StringValue;
			Skippable: BoolValue;
			MainPathway: StringValue & {
				Inputs: Folder & {
					Prompt: ObjectValue;
				};
				Outputs: Folder;
			};
		};
	};
	Mika: Folder & {
		MikaDialogue: Configuration & {
			Whatisit: Configuration & {
				Character: StringValue;
				Text: StringValue;
				MainPathway: StringValue & {
					Inputs: Folder & {
						DialogueRoot: ObjectValue;
					};
					Outputs: Folder;
				};
				Skippable: BoolValue;
				Expression: StringValue;
			};
			Hey: Configuration & {
				Character: StringValue;
				Text: StringValue;
				MainPathway: StringValue & {
					Inputs: Folder & {
						DialogueRoot: ObjectValue;
					};
					Outputs: Folder & {
						ExpressionPrompt: ObjectValue;
					};
				};
				Skippable: BoolValue;
				Expression: StringValue;
			};
			tutorialPlay: Configuration & {
				Function: ModuleScript;
				MainPathway: StringValue & {
					Outputs: Folder;
				};
			};
			changePriority: Configuration & {
				Function: ModuleScript;
				MainPathway: StringValue & {
					Outputs: Folder;
				};
			};
			DialogueRoot: Configuration & {
				MainPathway: StringValue & {
					Outputs: Folder;
				};
			};
		};
	};
	TestDialogueNoImage: Configuration & {
		Response2: Configuration & {
			MainPathway: StringValue & {
				Inputs: Folder & {
					Prompt: ObjectValue;
				};
				Outputs: Folder & {
					Welcome: ObjectValue;
				};
			};
			Text: StringValue;
		};
		Response1: Configuration & {
			MainPathway: StringValue & {
				Inputs: Folder & {
					Welcome: ObjectValue;
				};
				Outputs: Folder & {
					Welcome: ObjectValue;
				};
			};
			Text: StringValue;
		};
		DialogueRoot: Configuration & {
			MainPathway: StringValue & {
				Outputs: Folder & {
					Welcome: ObjectValue;
				};
			};
		};
		Response3: Configuration & {
			MainPathway: StringValue & {
				Inputs: Folder & {
					Welcome: ObjectValue;
				};
				Outputs: Folder & {
					Welcome: ObjectValue;
				};
			};
			Text: StringValue;
		};
	};
	GalileiTest: Configuration & {
		DialogueRoot: Configuration & {
			MainPathway: StringValue & {
				Outputs: Folder & {
					Welcome: ObjectValue;
				};
			};
		};
	};
	Arve: Folder & {
		TestArveDialogue: Configuration & {
			Welcome: Configuration & {
				Text: StringValue;
				Skippable: BoolValue;
				MainPathway: StringValue & {
					Inputs: Folder;
					Outputs: Folder & {
						Goodbye: ObjectValue;
					};
				};
			};
			DialogueRoot: Configuration & {
				MainPathway: StringValue & {
					Outputs: Folder & {
						Welcome: ObjectValue;
					};
				};
			};
			ExpressionPrompt: Configuration & {
				Text: StringValue;
				Skippable: BoolValue;
				MainPathway: StringValue & {
					Inputs: Folder;
					Outputs: Folder;
				};
			};
		};
		ArveExpressions: Configuration & {
			Prompt: Configuration & {
				Text: StringValue;
				Skippable: BoolValue;
				MainPathway: StringValue & {
					Inputs: Folder & {
						DialogueRoot: ObjectValue;
					};
					Outputs: Folder;
				};
			};
			DialogueRoot: Configuration & {
				MainPathway: StringValue & {
					Outputs: Folder & {
						Prompt: ObjectValue;
					};
				};
			};
		};
	};
};
