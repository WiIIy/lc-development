// -> shared/utils/npc/attack/parryConfig.ts (replaces parryTypes.ts)
// Tuning data only. The types (ParryProfile etc.) live in the global d.ts.
//
// Profile resolution order (later wins): DEFAULT_PARRY_PROFILE < weapon data `parry` < entity ParryConfig

export const DEFAULT_PARRY_PROFILE: ParryProfile = {
	reactionTime: 0.15, // predictive only
	windowDuration: 0.3, // predictive only
	recovery: 0.7, // vulnerable time after a parry that did NOT catch a hit
	successRecovery: 0.15, // recovery after a parry that DID catch a hit
	parriesPerMinute: 6, // average spacing between parry starts. 0 = this npc/weapon never parries
	baseChance: 0.5, // chance that a roll becomes a parry
	timingError: 0.1, // predictive only
	range: 10, // only parries while the target is within this many studs
	stunTime: 1, // how long the parried attacker keeps the Parried tag
	interruptsCombo: true, // false = only parries between combos
	fadeIn: 0.2,
	fadeOut: 0.1,
	rollInterval: 1, // seconds between rolls while idle with a target
	holdMin: 1, // shortest time the pose is held
	holdMax: 4, // longest time the pose is held
	// stacking is not a number: add Components.ParryStackable to allow two parries in a row
};

const rare: Partial<ParryProfile> = {
	parriesPerMinute: 2,
	baseChance: 0.3,
	rollInterval: 1.5,
	holdMin: 0.8,
	holdMax: 1.5,
};

const frequent: Partial<ParryProfile> = {
	parriesPerMinute: 12,
	baseChance: 0.7,
	rollInterval: 0.6,
	holdMin: 0.6,
	holdMax: 1.5,
	recovery: 0.6,
};

// predictive flavors (reaction speed), unused until predictive parrying is wired up
const hopeless: Partial<ParryProfile> = { reactionTime: 1.2, baseChance: 0.3, timingError: 0.25 };
const trained: Partial<ParryProfile> = { reactionTime: 0.2, baseChance: 0.7, timingError: 0.08 };
const inhuman: Partial<ParryProfile> = { reactionTime: 0.1, baseChance: 0.9, timingError: 0.03, windowDuration: 0.2 };

/** use as `parry: ParryPresets.rare` on weapon data, or as a ParryConfig value */
export const ParryPresets = { rare, frequent, hopeless, trained, inhuman };
