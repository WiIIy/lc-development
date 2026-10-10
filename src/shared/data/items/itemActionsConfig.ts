import { Action } from "../profile/defaultKeybinds";
import { ALL_FIREARMS, ALL_MELEE_WEAPONS, ALL_THROWABLES } from "./all";

// --- BASE ACTIONS ---

export const FIREARM_BASE_ACTIONS: ItemActionDefinition[] = [
	{ trigger: { type: "Action", action: Action.FireGun }, description: "Shoot" },
	{ trigger: { type: "Action", action: Action.AimGun }, description: "Aim" },
	{ trigger: { type: "Action", action: Action.Parry }, description: "Parry" },
	{ trigger: { type: "Action", action: Action.TakeoutMagezine }, description: "Mag Out" },
];

export const MELEE_BASE_ACTIONS: ItemActionDefinition[] = [
	// Hide standard attacks if the player is currently winding up a throw
	{
		trigger: { type: "Action", action: Action.LightAttack },
		description: "Light Attack",
		condition: (ctx) => !ctx.isThrowMode,
	},
	{
		trigger: { type: "Action", action: Action.HeavyAttack },
		description: "Heavy Attack",
		condition: (ctx) => !ctx.isThrowMode,
	},
];

export const THROWABLE_BASE_ACTIONS: ItemActionDefinition[] = [
	// If NOT holding the throw, show "Prepare Throw". If holding, show "Cancel Throw"
	{
		trigger: { type: "Action", action: Action.ThrowMode },
		description: "Prepare Throw",
		condition: (ctx) => !ctx.isThrowMode,
	},
	{
		trigger: { type: "Action", action: Action.ThrowMode },
		description: "Cancel Throw",
		condition: (ctx) => ctx.isThrowMode,
	},

	// Only show the actual throw action when the player is readied up
	{
		trigger: { type: "Action", action: Action.ThrowItem },
		description: "Throw",
		condition: (ctx) => ctx.isThrowMode,
	},
];

// --- SPECIFIC OVERRIDES & ADDITIONS ---

export const SPECIFIC_ITEM_ACTIONS: Record<string, ItemActionDefinition[]> = {
	Droneremote: [
		{
			trigger: { type: "Action", action: Action.DroneDeployPickUp },
			description: "Deploy Drone",
			condition: (ctx) => !ctx.isDroneDeployed,
		},
		{
			trigger: { type: "Action", action: Action.DroneDeployPickUp },
			description: "Pickup Drone",
			condition: (ctx) => ctx.isDroneDeployed && !ctx.isDroneFocused,
		},
		{
			trigger: { type: "Raw", key: "LMB" },
			description: "Focus Feed",
			condition: (ctx) => ctx.isDroneDeployed && !ctx.isDroneFocused,
		},
		{
			trigger: { type: "Raw", key: "X" },
			description: "Unfocus",
			condition: (ctx) => ctx.isDroneFocused,
		},
		{
			trigger: { type: "Raw", key: "W/S" },
			description: "Move",
			condition: (ctx) => ctx.isDroneFocused,
		},
		{
			trigger: { type: "Raw", key: "A/D" },
			description: "Turn",
			condition: (ctx) => ctx.isDroneFocused,
		},
		{
			trigger: { type: "Raw", key: "Space/Shift" },
			description: "Elevation",
			condition: (ctx) => ctx.isDroneFocused,
		},
		{
			trigger: { type: "Raw", key: "Q/E" },
			description: "Look Up/Down",
			condition: (ctx) => ctx.isDroneFocused,
		},
		{
			trigger: { type: "Raw", key: "Scroll" },
			description: "Flight Speed",
			condition: (ctx) => ctx.isDroneFocused,
		},
	],
	Jerrycan: [
		{ trigger: { type: "Raw", key: "RMB" }, description: "Pour Oil" },
		{ trigger: { type: "Raw", key: "Scroll" }, description: "Adjust Pour/Tilt" },
	],
	Teeth: [{ trigger: { type: "Action", action: Action.Chainsaw }, description: "Rev / Stop Chainsaw" }],
	Molotov: [
		{ trigger: { type: "Action", action: Action.LightMolotov }, description: "Light Molotov" },
		{ trigger: { type: "Action", action: Action.ThrowMolotov }, description: "Throw Molotov" },
	],
	Lighter: [{ trigger: { type: "Action", action: Action.LightLighter }, description: "Open" }],
};
