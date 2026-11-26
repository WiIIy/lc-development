import { Entity } from "@rbxts/jecs";
import world from "../world";
import { component } from "shared/utils/ecs/componentUtil";

export const AIComponents = {
	//NPC Data
	// static NPCName = world.component<string>(); //tag to mark npcs
	// static NPCHasAbility = world.entity();
	//NPC Ability
	// static NPCGrenade = world.entity();

	//fffffFFFFF AAAAHHH

	EnemyState: component<EnemyState>(),
	EnemyType: component<EnemyType>(), //most behavior and stats are determined by this

	Faction: component<Faction>(),
	Target: component<Entity>(), //
	TargetBasepart: component<BasePart>(),
	VisiblePlayerEntities: component<Entity[]>(),

	Alertness: component<number>(), //chance of changing state to combat {0-20 idle/roaming, 20-50 looking at source, 50-80 investigating, 80-100 combat}
	AlertnessMultiplier: component<number>(), //alertness and morale are influenced by stimulus

	Morale: component<number>(), //chance of surrender
	MoraleMultiplier: component<number>(),

	VisionRange: component<number>(), //studs they can see you
	HearingRange: component<number>(), //studs they can process sound stimulus

	MoveToTarget: component<Vector3>(), //if set enemies will go right to that position, component gets deleted
	AssignedWalkPoint: component<PointTarget>(),
	// static SearchDestination = world.component<Vector3>();
	ChangeEnemyState: component<EnemyState>(), //if set enemies will change state, component gets deleted
	FireCooldown: component<{ nextFireTime: number }>(),

	CanShove: world.entity(),
	RadioConnected: world.entity(),
	CanSurrender: world.entity(),
	FakeCivilian: world.entity(),
	HoldsItem: component<Model>(),
	HasAccessory: component<Accessory[]>(),
	HasOutfit: component<{ shirtId: string; pantsId: string }>(),

	//behavior tags
	Group: component<Entity[]>(),
	Sitting: world.entity(),
	Hiding: world.entity(),
	Distancing: world.entity(),
	Following: world.entity(),
	Alert: world.entity(),
	Dead: world.entity(),
	Restrained: world.entity(),

	FirearmBehaviors: world.entity(), //makesfirearm behaviors iterate it
	FollowsPlayerIfVisible: world.entity(),

	//stimulus and perception, World stuff
	Stimulus: component<Stimulus>(),

	//Pathing
	Path: component<PathWaypoint[]>(),
	PathIndex: component<number>(),
	NextPathTime: component<number>(), // Throttles Pathfinding Service
	Omniscient: world.entity(),

	//Following
	// static TimeSightLost = component<number>();
	// static Wandering = world.entity(); //indicates enemy that currently has wandering behaviors. actually its deprecated. delete this
	// static ArrivedAtTarget = world.entity();

	//Wandering
	// static WanderDestination = component<{ name: string; position: Vector3 }>(); //if enemy has this it means theyre approaching the destination
	// static CurrentWanderPoint = component<string>();
	// static LastSeenPosition = component<Vector3>();
	// static LossOfSightData = component<{ lossTime: number; initialPos: Vector3; sampleCaptured: boolean }>();
	// static BlindPursuitDirection = component<Vector3>();
	// static SearchDelayTimer = component<number>(); // Timestamp when search movement should start
	// static PostSearchWaitTimer = component<number>(); // Timestamp when waiting ends and NPC becomes fully idle
	// static SetToSearch = world.entity();
	// static SittingTimer = component<number>();

	// Looking behaviors
	LookAtTarget: component<Entity>(),
	LookAtPosition: component<Vector3>(),
	OriginalNeckC0: component<CFrame>(),
	NeckJoint: component<Motor6D>(),
	RootJoint: component<Motor6D>(),

	Tracking: world.entity(), //allows target setting behaviors
	BodyTracking: world.entity(),
	BodyAligner: component<AlignOrientation>(),
	HeadLook: component<{ yaw: number; pitch: number }>(),
	TargetPlayer: component<Player>(),

	SightTracking: world.entity(), //makes the head move
	Pathfinding: world.entity(),
	TargetTransform: component<CFrame>(),

	PathState: component<PathState>(),

	ShowPathfinding: world.entity(),

	//memory
	TargetVisible: world.entity(),
	PathGoal: component<{ position: Vector3; stopDistance: number; once?: boolean; expiresAt?: number }>(),
	PathingMemory: world.entity(), // tag: enables memory behavior with defaults
	MemoryBehaviors: component<Partial<MemoryConfig>>(), // optional overrides, per enemy
	MemoryState: component<MemoryState>(),
	LastSeen: component<{ pos: CFrame; time: number; target: Entity; visible: boolean }>(),

	StopFacingWalls: world.entity(),
	WallLook: component<{ nextScanAt: number; posing: boolean; goal?: Vector3 }>(),

	//state tracking
	TrackTargetActionState: world.entity(), // tag: npc mirrors its target's behavior state
	TargetState: component<PlayerBehaviorState>(), // npc's copy of its target's PlayerBehavior
	ActionToken: component<number>(), // bumped on every action so stale timed resets can tell they are stale
	TrackTargetRelativeState: world.entity(), // tag
	TargetRelativeState: component<TargetRelativeState>(),

	TestReactive: world.entity(), // tag: this test behavior
	CloseQuarters: world.entity(), // tag: a close-quarters behavior currently owns this npc's movement

	//perception system will use the stimulus and determine how its processed by each enemy. can trigger distraction from throwing cans
	//decisionsystem controls being distracted
	//groupbehaviorsystem; groupmembers, groupbehavior

	///map data: walkpoint, sitpoint, exitpoint
	//all attachments indicating where enemies can do what

	//==============================
	//Civilian entities simply lack combat components.
	// Faction = civilian
	// VisionRange
	// HearingRange
	// Alertness
	// AIState
	//if alertness > threshold: flee
	//==============================

	// Perception timer state
	PerceptionTimer: component<{ firstSpottedTime?: number }>(),

	// Behavior style tag components
	ConserverTag: world.entity(),
	SprayTag: world.entity(),
	AmbusherTag: world.entity(),

	// Out of ammo outcome tag components
	EscapeTag: world.entity(),
	HailMaryTag: world.entity(),
	FreezeTag: world.entity(),
};

export type StimulusChannel = "visual" | "auditory";
//kill me
export type Stimulus = {
	stimulusType: StimulusType;
	channel: StimulusChannel;
	position: Vector3;
	strength: number;
	sender?: Player;
};

export const EnemyTypeArray = [
	"Golok",
	"Lobotomizer",
	"Serpent",
	"FakeCivilian",
	"Civilian",
	"The Follower",
	"The Distancer",
	"The Hider",
	"The Flee",
	"The Stalker",
	"Taurus",
	"Futile",
] as const;

// export const enemyList: readonly EnemyType[] = EnemyTypeArray; // Use it as a string array (readonly)
export type Faction = "Faction1" | "Faction2";