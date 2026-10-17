import { CharacterRigR6 } from "@rbxts/promise-character";
import Replecs from "@rbxts/replecs";

import { Name, Archetype, Entity, pair } from "@rbxts/jecs";
import world from "../world";
import { Character } from "@rbxts/wcs";
import { HttpService } from "@rbxts/services";

export type MeleeAnimationData = {
	lightAttack: string;
	heavyAttack: string;
	parry: string;
	dodge: string;
};
export type ItemContainerObject = {
	model: Model;
	attachmentFolder: Folder;
};

export class Components {
	static Transform = world.component<CFrame>(); //this is replicated
	static Model = world.component<Model>();
	static Basepart = world.component<BasePart>(); //primary part of a model, used for pivots, if not humanoid, everything else is welded on
	static SystemsAtWork = world.component<string[]>();
	// also to store humanoid root part for calculations

	//player stuff
	static Health = world.component<{ current: number; max: number }>();
	static Stamina = world.component<{ current: number; max: number }>();
	static Blood = world.component<{ current: number; max: number }>();
	static ActiveStatusEffects = world.component<StatusEffect[]>();
	// static ActiveDebuffs = world.component<DebuffStatus[]>();

	static Player = world.component<Player>(); //ERRR
	static PlayerString = world.component<string>();
	static JustJoined = world.entity();
	static Character = world.component<CharacterRigR6>();
	static Inventory = world.component<Entity[]>();
	static Animator = world.component<Animator>(); //animations wont run if entity doesnt have this. client Animator is for viewmodel, sever Animator is for character
	static WCSCharacter = world.component<Character>(); //reference to wcs character
	static Humanoid = world.component<Humanoid>();
	static CurrentlyEquipped = world.component<string>(); // note, if you want to world.set(e, pair(a,b), value), a should be a component with the type of value

	static IsMelee = world.entity(); //assigns the melee wcs moveset when its currentlyequipped
	static ItemModel = world.component<BaseItem>(); //replicatedstorage reference to the item. automatically gets put to workspace when added

	static AnimationQueue = world.component<string[]>(); //playing animations one after another
	static AnimationLayers = world.component<Record<string, string>>(); //playing animations simultaneously

	static Test = world.component<string>();

	//Item related
	static Item = world.component<{ name: string }>();

	static ChamberedAmmo = world.component<number>();
	static NpcOwnedAmmo = world.component<number>();

	static Chainsaw = world.component<{
		fuel: number;
		temp: number;
		overheated: boolean;
	}>();

	static Drone = world.component<{
		deployed: boolean;
		instance: Model | undefined;
		speed: number;
		cframe: CFrame;
	}>();

	static Owner = world.component<Entity>();
	static WorldItem = world.entity(); // item exists in world
	static InventoryItem = world.component<{ slot: string; slotType: SlotType }>(); // item inside inventory

	static Prop = world.entity(); // Tag to mark entities as props
	static CarriedProp = world.component<Entity>(); // Stores the entity ID of the prop a player is carrying

	//NPC Data
	// static NPCName = world.component<string>(); //tag to mark npcs
	// static NPCHasAbility = world.entity();
	//NPC Ability
	// static NPCGrenade = world.entity();

	//generic melee = CharacterMotor6D, MeleeAnimationData
	// static MeleeAnimationData = world.component<MeleeAnimationData>();

	static ItemContainerObject = world.component<ItemContainerObject>();

	//fffffFFFFF AAAAHHH

	static EnemyState = world.component<EnemyState>();
	static EnemyType = world.component<EnemyType>(); //most behavior and stats are determined by this

	static Faction = world.component<Faction>();
	static Target = world.component<Entity>(); //
	static TargetBasepart = world.component<BasePart>();
	static VisiblePlayerEntities = world.component<Entity[]>();

	static Alertness = world.component<number>(); //chance of changing state to combat {0-20 idle/roaming, 20-50 looking at source, 50-80 investigating, 80-100 combat}
	static AlertnessMultiplier = world.component<number>(); //alertness and morale are influenced by stimulus

	static Morale = world.component<number>(); //chance of surrender
	static MoraleMultiplier = world.component<number>();

	static VisionRange = world.component<number>(); //studs they can see you
	static HearingRange = world.component<number>(); //studs they can process sound stimulus

	static MoveToTarget = world.component<Vector3>(); //if set enemies will go right to that position, component gets deleted
	static AssignedWalkPoint = world.component<PointTarget>();
	// static SearchDestination = world.component<Vector3>();
	static ChangeEnemyState = world.component<EnemyState>(); //if set enemies will change state, component gets deleted
	static FireCooldown = world.component<{ nextFireTime: number }>();

	static CanParry = world.entity();
	static CanShove = world.entity();
	static RadioConnected = world.entity();
	static CanSurrender = world.entity();
	static FakeCivilian = world.entity();
	static HoldsItem = world.component<Model>();
	static HasAccessory = world.component<Accessory[]>();
	static HasOutfit = world.component<{ shirtId: string; pantsId: string }>();

	//behavior tags
	static Group = world.component<Entity[]>();
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
	static Stimulus = world.component<Stimulus>();

	//Pathing
	static Path = world.component<PathWaypoint[]>();
	static PathIndex = world.component<number>();
	static NextPathTime = world.component<number>(); // Throttles Pathfinding Service
	static Omniscient = world.entity();

	//Following
	static TimeSightLost = world.component<number>();
	static Wandering = world.entity(); //indicates enemy that currently has wandering behaviors. actually its deprecated. delete this
	static ArrivedAtTarget = world.entity();

	//Wandering
	static WanderDestination = world.component<{ name: string; position: Vector3 }>(); //if enemy has this it means theyre approaching the destination
	static CurrentWanderPoint = world.component<string>();
	static LastSeenPosition = world.component<Vector3>();
	static LossOfSightData = world.component<{ lossTime: number; initialPos: Vector3; sampleCaptured: boolean }>();
	static BlindPursuitDirection = world.component<Vector3>();
	// Add these to Components
	static SearchDelayTimer = world.component<number>(); // Timestamp when search movement should start
	static PostSearchWaitTimer = world.component<number>(); // Timestamp when waiting ends and NPC becomes fully idle
	static SetToSearch = world.entity();
	static SittingTimer = world.component<number>();

	// Looking behaviors
	static LookAtTarget = world.component<Entity>();
	static LookAtPosition = world.component<Vector3>();
	static OriginalNeckC0 = world.component<CFrame>();
	static NeckJoint = world.component<Motor6D>();

	static ShowPathfinding = world.entity();
	static Highlighted = world.entity();

	static Merchant = world.component<{ merchantName: string; wares: [] }>();

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
	static Bleeding = world.component<{ startTime: number; severity: number; limb: string }>();
	static Shrapnel = world.component<{ startTime: number; severity: number; limb: string }>();
	static Fracture = world.component<{ startTime: number; severity: number; limb: string }>();
	static Burning = world.component<{ dps: number; endTime: number }>();
	static Sepsis = world.component<{ dps: number; endTime: number }>();
	static Stunned = world.component<{ startTime: number; endTime: number }>();

	//Stun tags
	static Cough = world.entity();
	static Concussion = world.entity();
	static Parried = world.entity();
	static Fell = world.entity();

	//Persistent Debuffs
	static HasBlindness = world.component<{ eye: Eye }>();
	static IsVegetable = world.entity();

	// Perception timer state
	static PerceptionTimer = world.component<{ firstSpottedTime?: number }>();

	// Reload state
	static IsReloading = world.component<boolean>();

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

world.set(Components.Transform, Replecs.serdes, {
	bytespan: 12,
	serialize: (transform: CFrame) => {
		const buff = buffer.create(12);
		buffer.writef32(buff, 0, transform.X);
		buffer.writef32(buff, 4, transform.Y);
		buffer.writef32(buff, 8, transform.Z);
		return buff;
	},
	deserialize: (buff: buffer) => {
		return new CFrame(buffer.readf32(buff, 0), buffer.readf32(buff, 4), buffer.readf32(buff, 8));
	},
});

world.set(Components.ActiveStatusEffects, Replecs.serdes, {
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
