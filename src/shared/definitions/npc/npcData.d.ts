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
};
