import { CharacterRigR6 } from "@rbxts/promise-character";
import Replecs from "@rbxts/replecs";

import { Name, Archetype, Entity, pair, Component } from "@rbxts/jecs";
import world, { replicator } from "../world";
import { Character } from "@rbxts/wcs";
import { HttpService } from "@rbxts/services";

type LooseLib = { set_serdes(component: unknown, serdes: unknown): void };

export function setSerdes<T>(component: Entity<T>, serdes: Replecs.SerdesTable<T>): void {
	(replicator as unknown as LooseLib).set_serdes(component, serdes);
}

//this is done because using world.component makes replecs entities overlap
//world.entity starts at a higher count like 240 instead of 1 2 3, replecs component ids are 1 2 3
const component = <T>() => {
	const e = world.entity();
	world.add(e, Component);
	return e as unknown as Entity<T>;
};

export class Components {
	static Transform = component<CFrame>(); //this is replicated
	static Model = component<Model>();
	static Basepart = component<BasePart>(); //primary part of a model, used for pivots, if not humanoid, everything else is welded on
	static SystemsAtWork = component<string[]>();
	// also to store humanoid root part for calculations

	//player stuff
	static Health = component<{ current: number; max: number }>();
	static Stamina = component<{ current: number; max: number }>();
	static Blood = component<{ current: number; max: number }>();
	static ActiveStatusEffects = component<StatusEffect[]>();
	// static ActiveDebuffs = world.component<DebuffStatus[]>();

	static Player = component<Player>(); //ERRR
	static PlayerString = component<string>();
	static JustJoined = world.entity();
	static Character = component<CharacterRigR6>();
	static Inventory = component<Entity[]>();
	static Animator = component<Animator>(); //animations wont run if entity doesnt have this. client Animator is for viewmodel, sever Animator is for character
	static WCSCharacter = component<Character>(); //reference to wcs character
	static Humanoid = component<Humanoid>();
	static CurrentlyEquipped = component<string>(); // note, if you want to world.set(e, pair(a,b), value), a should be a component with the type of value

	static IsMelee = world.entity(); //assigns the melee wcs moveset when its currentlyequipped
	static ItemModel = component<BaseItem>(); //replicatedstorage reference to the item. automatically gets put to workspace when added

	static AnimationQueue = component<string[]>(); //playing animations one after another
	static AnimationLayers = component<Record<string, string>>(); //playing animations simultaneously

	static Test = component<string>();

	//Item related
	static Item = component<{ name: string }>();

	static ChamberedAmmo = component<number>();
	static NpcOwnedAmmo = component<number>();

	static Chainsaw = component<{
		fuel: number;
		temp: number;
		overheated: boolean;
	}>();

	static Drone = component<{
		deployed: boolean;
		instance: Model | undefined;
		speed: number;
		cframe: CFrame;
	}>();

	static Owner = component<Entity>();
	static WorldItem = world.entity(); // item exists in world
	static InventoryItem = component<{ slot: string; slotType: SlotType }>(); // item inside inventory

	static Prop = world.entity(); // Tag to mark entities as props
	static CarriedProp = component<Entity>(); // Stores the entity ID of the prop a player is carrying

	//NPC Data
	// static NPCName = world.component<string>(); //tag to mark npcs
	// static NPCHasAbility = world.entity();
	//NPC Ability
	// static NPCGrenade = world.entity();

	//generic melee = CharacterMotor6D, MeleeAnimationData
	// static MeleeAnimationData = world.component<MeleeAnimationData>();

	static ItemContainerObject = component<ItemContainerObject>();

	//fffffFFFFF AAAAHHH

	static EnemyState = component<EnemyState>();
	static EnemyType = component<EnemyType>(); //most behavior and stats are determined by this

	static Faction = component<Faction>();
	static Target = component<Entity>(); //
	static TargetBasepart = component<BasePart>();
	static VisiblePlayerEntities = component<Entity[]>();

	static Alertness = component<number>(); //chance of changing state to combat {0-20 idle/roaming, 20-50 looking at source, 50-80 investigating, 80-100 combat}
	static AlertnessMultiplier = component<number>(); //alertness and morale are influenced by stimulus

	static Morale = component<number>(); //chance of surrender
	static MoraleMultiplier = component<number>();

	static VisionRange = component<number>(); //studs they can see you
	static HearingRange = component<number>(); //studs they can process sound stimulus

	static MoveToTarget = component<Vector3>(); //if set enemies will go right to that position, component gets deleted
	static AssignedWalkPoint = component<PointTarget>();
	// static SearchDestination = world.component<Vector3>();
	static ChangeEnemyState = component<EnemyState>(); //if set enemies will change state, component gets deleted
	static FireCooldown = component<{ nextFireTime: number }>();

	static CanParry = world.entity();
	static CanShove = world.entity();
	static RadioConnected = world.entity();
	static CanSurrender = world.entity();
	static FakeCivilian = world.entity();
	static HoldsItem = component<Model>();
	static HasAccessory = component<Accessory[]>();
	static HasOutfit = component<{ shirtId: string; pantsId: string }>();

	//behavior tags
	static Group = component<Entity[]>();
	static Sitting = world.entity();
	static Hiding = world.entity();
	static Distancing = world.entity();
	static Following = world.entity();
	static Alert = world.entity();
	static Dead = world.entity();
	static Restrained = world.entity();

	static FirearmBehaviors = world.entity(); //makesfirearm behaviors iterate it
	static FollowsPlayerIfVisible = world.entity();

	//stimulus and perception, World stuff
	static GameObject = world.entity(); //things that arent part of the map/interactable, not players
	static Stimulus = component<Stimulus>();

	//Pathing
	static Path = component<PathWaypoint[]>();
	static PathIndex = component<number>();
	static NextPathTime = component<number>(); // Throttles Pathfinding Service
	static Omniscient = world.entity();

	//Following
	static TimeSightLost = component<number>();
	static Wandering = world.entity(); //indicates enemy that currently has wandering behaviors. actually its deprecated. delete this
	static ArrivedAtTarget = world.entity();

	//Wandering
	static WanderDestination = component<{ name: string; position: Vector3 }>(); //if enemy has this it means theyre approaching the destination
	static CurrentWanderPoint = component<string>();
	static LastSeenPosition = component<Vector3>();
	static LossOfSightData = component<{ lossTime: number; initialPos: Vector3; sampleCaptured: boolean }>();
	static BlindPursuitDirection = component<Vector3>();
	// Add these to Components
	static SearchDelayTimer = component<number>(); // Timestamp when search movement should start
	static PostSearchWaitTimer = component<number>(); // Timestamp when waiting ends and NPC becomes fully idle
	static SetToSearch = world.entity();
	static SittingTimer = component<number>();

	// Looking behaviors
	static LookAtTarget = component<Entity>();
	static LookAtPosition = component<Vector3>();
	static OriginalNeckC0 = component<CFrame>();
	static NeckJoint = component<Motor6D>();

	static Tracking = world.entity(); //allows target setting behaviors
	static TargetPlayer = component<Player>();

	static SightTracking = component<Entity>(); //makes the head move
	static Pathfinding = component<Entity>();
	static TargetTransform = component<CFrame>();

	static ShowPathfinding = world.entity();
	static Highlighted = world.entity();

	static Merchant = component<{ merchantName: string; wares: [] }>();

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

	//Status Effect Tags,
	//Debuffs
	//Applicable to Both Player and Enemy
	static Bleeding = component<{ startTime: number; severity: number; limb: string }>();
	static Shrapnel = component<{ startTime: number; severity: number; limb: string }>();
	static Fracture = component<{ startTime: number; severity: number; limb: string }>();
	static Burning = component<{ dps: number; endTime: number }>();
	static Sepsis = component<{ dps: number; endTime: number }>();
	static Stunned = component<{ startTime: number; endTime: number }>();

	//Stun tags
	static Cough = world.entity();
	static Concussion = world.entity();
	static Parried = world.entity();
	static Fell = world.entity();

	//Persistent Debuffs
	static HasBlindness = component<{ eye: Eye }>();
	static IsVegetable = world.entity();

	// Perception timer state
	static PerceptionTimer = component<{ firstSpottedTime?: number }>();

	// Reload state
	static IsReloading = component<boolean>();

	// Behavior style tag components
	static ConserverTag = world.entity();
	static SprayTag = world.entity();
	static AmbusherTag = world.entity();

	// Out of ammo outcome tag components
	static EscapeTag = world.entity();
	static HailMaryTag = world.entity();
	static FreezeTag = world.entity();
}

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

//names every component
for (const [key, value] of pairs(Components)) {
	// Only apply to Entities / Components created on the object
	if (typeIs(value, "number")) {
		world.set(value as Entity, Name, key.lower());
	}
}

setSerdes(Components.Transform, {
	bytespan: 12,
	serialize: (transform) => {
		const buff = buffer.create(12);
		buffer.writef32(buff, 0, transform.X);
		buffer.writef32(buff, 4, transform.Y);
		buffer.writef32(buff, 8, transform.Z);
		return buff;
	},
	deserialize: (buff) => new CFrame(buffer.readf32(buff, 0), buffer.readf32(buff, 4), buffer.readf32(buff, 8)),
});

setSerdes(Components.ActiveStatusEffects, {
	serialize: (debuffs: StatusEffect[]) => {
		// Simple JSON serialization for complex arrays
		const json = HttpService.JSONEncode(debuffs);
		const buff = buffer.create(json.size());
		buffer.writestring(buff, 0, json);
		return buff;
	},
	deserialize: (buff: buffer) => {
		const json = buffer.readstring(buff, 0, buffer.len(buff));
		return HttpService.JSONDecode(json) as StatusEffect[];
	},
});

// world.set(Components.Blood, Replecs.serdes, {
// 	bytespan: 8,
// 	serialize: (blood: { current: number; max: number }) => {
// 		const buff = buffer.create(8);
// 		buffer.writef32(buff, 0, blood.current);
// 		buffer.writef32(buff, 4, blood.max);
// 		return buff;
// 	},
// 	deserialize: (buff: buffer) => {
// 		return {
// 			current: buffer.readf32(buff, 0),
// 			max: buffer.readf32(buff, 4),
// 		};
// 	},
// });

export default Components;
