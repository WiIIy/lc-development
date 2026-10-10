type Action = ValueOf<typeof import("../../data/profile/defaultKeybinds").Action>;

type ActionStateContext = {
	isAiming: boolean;
	isDroneFocused: boolean;
	isDroneDeployed: boolean; // Added for Drone context
	isThrowMode: boolean; // Added for Throwing context
};

type ItemActionDefinition = {
	trigger: ActionTrigger;
	description: string;
	condition?: (context: ActionStateContext) => boolean;
};

type ActionTrigger = { type: "Action"; action: Action } | { type: "Raw"; key: string };
