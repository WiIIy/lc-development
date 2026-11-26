// Global types for the reactive / non-reactive split. No imports, no exports.

type SelfMovement =
	| "still"
	| "advance"
	| "backtrack"
	| "straferight"
	| "strafeleft"
	| "advanceright"
	| "advanceleft"
	| "backtrackright"
	| "backtrackleft";

/** "idle" | "parry" | "shove" are built in. Every other string is a key of the weapon's `moves`. */
type BuiltInAction = "idle" | "parry" | "shove";

type TargetMovementPattern = RelativeMotion | "any";
type TargetActionPattern = PlayerBehaviorState["actionState"] | "any";

type ReactiveResponse<TAction extends string = string> = {
	movement: SelfMovement;
	/** one of these is picked evenly from the ones the npc can currently do */
	actions: TAction[];
	/** 0-10, a share out of 10. 10 = always (while capable). Omitted = 5 */
	weight?: number;
};

type ReactiveRule<TAction extends string = string> = {
	/** [targetMovement, targetAction] */
	when: [TargetMovementPattern, TargetActionPattern];
	responses: ReactiveResponse<TAction>[];
};

type ReactiveBehavior<TAction extends string = string> = {
	engageRange?: number; // inside this the reactive brain takes over movement
	releaseRange?: number; // beyond this pathfinding takes it back
	rules?: ReactiveRule<TAction>[];
};

type WeaponMove = {
	damage: number;
	bleedChance: number;
	fractureChance: number;
	blockcast: { size: Vector3; distance: number };
	range?: number; // defaults to BASE_MELEE_RANGE
};

type ParryBehavior = {
	reactionTime: number; // reactive only
	minLength: number;
	maxLength: number;
	stacking: boolean; // true = up to 2 in a row, false = 1
	timeout: number; // seconds after a parry ends before another may start (a stacked parry skips it)
	recovery?: number; // extra lock after a parry that caught nothing
	range?: number; // only parries with the target this close. Defaults to BASE_MELEE_RANGE
};

type ShoveBehavior = {
	reactionTime: number; // reactive only: how long the target's parry must be seen
	stunTime: number;
	blockcast: { size: Vector3; distance: number };
	range?: number;
};

type MovesetEntry<TAction extends string = string> = {
	combo: TAction[];
	weight?: number; // relative, omitted = 1
};

type NpcWeapon = {
	id: string;
	moves: { [name: string]: WeaponMove };
	movesets: MovesetEntry[]; // non-reactive only
	moveDelay: number;
	movesetDelay: number;
	parryBehavior?: ParryBehavior; // absent = never parries
	shoveBehavior?: ShoveBehavior; // absent = never shoves
	reactive?: ReactiveBehavior;
	animations: {
		moves: { [name: string]: string };
		parry?: string; // optional override of the default
		shove?: string; // optional override of the default
	};
};

/** what a brain asks for. Consumed (accepted or rejected) in the same frame, so it is never a queue */
type ActionRequest = { action: string };

/** present exactly while an action is running */
type ActiveAction = {
	token: number;
	action: string;
	weaponId: string;
	/** parry: when it ends (decided by code). animated moves: safety timeout only */
	expiresAt: number;
};

type ParryState = { streak: number; readyAt: number; chainUntil: number };

/** non-reactive brain only */
type ComboState = {
	weaponId: string;
	movesetIndex: number; // -1 = none picked
	step: number;
	inFlight: boolean;
	readyAt: number;
	outOfRangeSince?: number;
};

/** reactive brain only: perception timing, not a queue */
type ReactiveDecision = {
	weaponId: string;
	seenKey: string;
	seenSince: number;
	decidedKey: string;
	decideAgainAt: number;
	wasActing: boolean;
};

type ReactiveGrants = { relative: boolean; action: boolean };
