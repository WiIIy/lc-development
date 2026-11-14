type EnemyType = typeof import("../../data/npcs/enemyTypes").ENEMY_TYPES[number];

type WorldEntityData = {
	WorldEntityCount: number;
	ItemEntities: number;
	EnvironmentEntities: number;
	NpcEntities: number;
	HostileNpcEntities: number;
	CivilianNpcEntities: number;
	MerchantNpcEntities: number;
	PlayerEntities: number;
};

//this type indicates current action
type EnemyState =
	| "idle" //0-20
	| "patrol"
	| "walking"
	| "searching"
	| "arrived"
	| "sitting"
	//
	| "chatting"
	| "radio"
	| "phone"
	| "distracted"
	| "stunned"
	| "coughing"
	//
	// | "suspicious" //20-50 alertness //alertness related states shouldnt be included here
	// | "investigating" //50-80 alertness
	// | "combat" //80-100 alertness
	// | "fleeing" //if morale 50-80 has a chance of fleeing instead of facing you
	| "surrendered"
	| "escaping"
	| "brawling"
	| "freezing";
//randomly triggered. 100% chance if morale is 100

type NpcData = {
	entity: string;
	npcType: EnemyType;
	outfit: string;
	ai: string;
	tags: string[];
	state: EnemyState;
	dialogue: string;

	visibleInteractableEntities: import("@rbxts/jecs").Entity[];
	alertness: number;
	alertnessMultiplier: number;
	morale: number;
	moraleMultiplier: number;
	hearingRange: number;

	perks: string[];
	statusEffects: string[];
	systemsAtWork: string[];

	displayPathfinding: boolean;
	highlighted: boolean;
	hostile: boolean;
};

type StimulusType = "gunshot" | "noise" | "yell" | "death";

type MoveData = {
	damage: number;
	bleedChance: number;
	fractureChance: number;
	range?: number; //defaults to the standard melee range (7 studs) when omitted
};

type MovesetData = {
	combo: string[]; //move names, each must exist in `moves` AND in MoveCallbacks
	weight: number; //relative chance of being picked
};

type BlockcastData = {
	size: Vector3; //width (X), height (Y), depth (Z) of the swept block. Keep depth small, see note below
	distance: number; //studs the block travels forward from the npc root
	aimAtTarget?: boolean; //true: aim at the target (auto-aim). default: the direction the npc is facing
};

type MeleeMoveData = {
	damage: number;
	bleedChance: number;
	fractureChance: number;
	blockcast: BlockcastData;
};

type NpcMeleeWeapon<TMoveKeys extends string = string> = {
	id: string;
	moves: Record<TMoveKeys, NpcMoveData>;
	movesets: NpcMovesetEntry<TMoveKeys>[];
	moveDelay: number;
	movesetDelay: number;
	animations: Record<TMoveKeys, string>;
	parry?: Partial<ParryProfile>;
	blockAnim?: string; //this is separated from the animations cause it does not corespond to a move
};

type NpcMovesetEntry<TMoveKeys extends string = string> = {
	combo: TMoveKeys[];
	weight: number;
};

type NpcMoveData = {
	damage: number;
	bleedChance: number;
	fractureChance: number;
	blockcast: {
		size: Vector3;
		distance: number;
	};
	windup?: number;
};

type MemoryState = {
	phase: "Approach" | "Turn" | "Scan" | "Walk";
	lostAt: number;
	phaseAt: number;
	lastSeenPos: Vector3;
	target: import("@rbxts/jecs").Entity;
	snapshot?: Vector3;
	heading?: Vector3;
};

// global types
type MemoryConfig = { snapshotDelay: number; stopShort: number; maxWalk: number; maxScan: number };

type ParryProfile = {
	/** PREDICTIVE flavor: seconds after an attack STARTS before this npc can react to it */
	reactionTime: number;
	/** PREDICTIVE flavor: how long a timed parry window stays open (random uses holdMin/holdMax instead) */
	windowDuration: number;
	/** vulnerable time after a parry window that did NOT catch a hit (the punish window) */
	recovery: number;
	/** recovery after a parry that DID catch a hit (short, so success feels good) */
	successRecovery: number;
	/** RANDOM: how often this npc parries, in parries per minute (average, +/-25% jitter). Lower = rarer, 0 = never */
	parriesPerMinute: number;
	/** chance that a roll results in a parry */
	baseChance: number;
	/** PREDICTIVE flavor: +/- seconds of aim error when placing the window around the hit */
	timingError: number;
	/** RANDOM: the npc only parries while its target is within this many studs. PREDICTIVE: only swings this close are noticed */
	range: number;
	/** how long the parried attacker keeps the Parried tag */
	stunTime: number;
	/** true = may break off its own combo mid-swing to parry. false = only parries while idle */
	interruptsCombo: boolean;
	/** seconds the parry pose fades in when the window opens */
	fadeIn: number;
	/** seconds the parry pose fades out when the window closes or catches a hit */
	fadeOut: number;
	/** RANDOM: seconds between rolls while the npc is idle and has a target */
	rollInterval: number;
	/** RANDOM: shortest time the npc holds a parry (picked per parry between holdMin and holdMax) */
	holdMin: number;
	/** RANDOM: longest time the npc holds a parry */
	holdMax: number;
};

/** written onto npcs that are targeting an attacker (and use predictive parrying) when it starts a swing */
type Threat = {
	attacker: import("@rbxts/jecs").Entity;
	moveName: string;
	startedAt: number;
	hitAt: number;
	/** set once a decision system has looked at it, so each attack is decided exactly once */
	handled: boolean;
};

type ParryPhase = "scheduled" | "active" | "recovery";

/** exists from the moment a parry is decided until recovery ends. Doubles as the "busy parrying" gate */
type ParryTimeline = {
	phase: ParryPhase;
	/** when the current phase ends (for "scheduled": when the window opens) */
	phaseEnds: number;
	profile: ParryProfile;
	/** how long the Parrying tag stays on once the window opens (random picks this per parry) */
	windowDuration: number;
	/** pose resolved from the equipped weapon when the parry was scheduled */
	animationId?: string;
};

/** ring buffer entry on the ATTACKER. Predictive parrying will read this later */
type AttackRecord = {
	move: string;
	startedAt: number;
	hitAt: number;
};
