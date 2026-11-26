import assets from "shared/assets";

export const BASE_MELEE_RANGE = 7;
export const PARRY_RELEASE_BUFFER = 1.5; // guard drops this far past parry range (stops flickering at the edge)
export const OUT_OF_RANGE_OVERRIDE = 2; // seconds before a non-reactive npc drops its moveset
export const PARRY_CHAIN_WINDOW = 0.6; // keep above moveDelay and movesetDelay or stacking cannot chain
export const PARRY_FADE_IN = 0.2;
export const PARRY_FADE_OUT = 0.1;
export const MAX_ACTION_SECONDS = 6; // safety net for an animation that never ends

export const DEFAULT_ENGAGE_RANGE = 10;
export const DEFAULT_RELEASE_RANGE = 13;
export const DEFAULT_REACTION_TIME = 0.15;
export const DECISION_INTERVAL: [number, number] = [0.4, 0.8]; // re-roll pace while nothing changes
export const MAX_RESPONSE_WEIGHT = 10;
export const DEFAULT_RESPONSE_WEIGHT = 5;

/** TODO: paste your two default animation ids. Empty = a clear warning, and the action is refused. */
export const DEFAULT_COMBAT_ANIMATIONS = {
	parry: assets["anims/character/npc/item/fists/fistsblock.rbxm"],
	shove: assets["anims/character/npc/item/fists/fistsshove.rbxm"],
};

/** pool used by every reactive npc when no weapon rule claims the roll. "weaponMove" = any move of the weapon */
export const DEFAULT_RESPONSES: ReactiveResponse[] = [
	{ movement: "still", actions: ["idle"], weight: 2 },
	{ movement: "advance", actions: ["weaponMove"], weight: 4 },
	{ movement: "still", actions: ["parry"], weight: 1 },
	{ movement: "advance", actions: ["shove"], weight: 2 },
	{ movement: "straferight", actions: ["idle"], weight: 1 },
	{ movement: "strafeleft", actions: ["idle"], weight: 1 },
];
