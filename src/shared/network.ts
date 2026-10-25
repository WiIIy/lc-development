import world, { replicator } from "./world";
import { Networking } from "@flamework/networking";
import Log from "@rbxts/log";
import Replecs from "@rbxts/replecs";
import Net, { Route } from "@rbxts/yetanothernet";
import { t } from "t";
import { StimulusChannel } from "./components/components";
import { SkillConstructor } from "@rbxts/wcs";
import { Entity, Id, TagDiscriminator } from "@rbxts/jecs";

export const server = replicator.server;
export const client = replicator.client;

// ---- flamework remotes ----//
interface ClientToServerEvents {
	// Inventory System Remotes
	requestMoveOrSwapItem: (draggedSlot: string, targetSlot: string) => boolean;
	requestDropItem: (itemSlot: string) => void;
	requestPickUpItem: (item: Instance) => void; //erm, secure these remotes
	requestEquipItem: (itemSlot: string) => void;
	requestSetCurrentSlot: (slotNumber: string) => void;

	//dossier remotes
	requestCreateDossier: (buildData: DossierData) => void;
	requestSaveDossier: (updatedDossier: DossierData) => void;
	requestDeleteDossier: (dossierID: string) => void;

	// Combat Remotes
	requestMeleeHit: (hitInstance: BasePart, hitPosition: Vector3) => void;
	// requestMeleeHit: () => void; //secured, TODO add a debounce so client cant infinitely fire
	setNetworkOwner: (inst: Instance | undefined) => void;

	fireWeapon: (origin: Vector3, direction: Vector3) => void;

	dialogueEndedSignal(dialogueEnded: boolean): void;
	requestEquipLoadout: (dossierName: string) => void;

	neckMovement: Networking.Unreliable<(neckC0: CFrame, rightShC0?: CFrame, leftShC0?: CFrame) => void>;

	//enemy stuff
	requestSpawnEnemy(position: Vector3, enemyType: EnemyType): void;
	requestSpawnStimulus(
		stimulusType: StimulusType,
		position: Vector3,
		channel: StimulusChannel,
		strength: number,
		sender?: Player,
	): void;
	requestDeleteEnemy(enemy: Model): void;

	equipAccessoryOnHumanoid(humanoid: Humanoid, accessory: Accessory): void;
	requestCarryRagdolledModel(ragdoll: Model, carrier: Model, interactType: "carry" | "drag" | "drop"): void;

	shatterGlass(glassModel: Model, hitPosition: Vector3, origin: Vector3): void;
	requestFirearmHit: (
		hitInstance: BasePart | undefined,
		hitPosition: Vector3,
		weaponName: string,
		origin: Vector3,
	) => void;

	doorInteract(doorModel: Model, doorState: "Close" | "Open" | "Physics", cfGoal: CFrame): void;
	ventInteract(ventModel: Model, cfGoal: CFrame): void;

	//antler debug
	subscribeToEntity(entityRef: Instance): NpcData;
	unsubscribeFromEntity(): void;

	addComponentToEntityReference(
		enityRef: Instance,
		component: Id<TagDiscriminator>,
		add: boolean,
		part: BasePart,
	): void; //add true = add component, add false = remove component
}

interface ServerToClientEvents {
	inventorySync: (inventory: ItemData[], currentSlot: string) => void;
	confirmEquip: (itemName: string) => void;
	dialogueRemote(dialogueTree: Instance, params?: DialogueParams): void;
	continueDialoguePrompt(): void;
	visualsRemote(shooter: Player, origin: Vector3, hit: Vector3, casingName?: string): void;
	startSkill(skill: SkillConstructor): void;
	dossierRemote(dossierData: DossierData[]): void;
	equipAccessoryOnViewmodel(accessoryString: string): void;
	makeLocallyTransparent(item: Model | Accessory): void;

	deleteAccessoriesFromPlayerViewmodel(): void;
	statisticsSync: (timePlayed: number) => void; //send other statistics data here
	dossierSync: (dossierData: DossierData[]) => void;

	broadcastDamageNumber(damageAmount: number, displayPosition: Vector3): void; //not sure if this will be used. this renders damage numbers from the server. need client side rendering responsiveness
	attachDamageDisplayCallbackToCharacter(model: Model): void;

	//menu
	sendClientServerRegion(region: string): void;

	//antler debug
	syncEntityData(targetInstance: Instance, npcData: NpcData): void;
	// syncEntityCounts: (data: WorldEntityData) => void;
}

interface ClientToServerFunctions {
	getEntityCounts: () => WorldEntityData;
	fetchViewportAccessoryOrFace: (accessoryId: number) => Accessory | SpecialMesh | undefined;
}

interface ServerToClientFunctions {}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalFunctions = Networking.createFunction<ClientToServerFunctions, ServerToClientFunctions>();

// ---- replecs shi ---- //
// note to self. DO NOT MOVE THIS TO A SEPARATE ROUTING FILE. IT WILL BREAK REPLICATION. I DONT KNOW WHY

const ReplecsReliableRoute = new Route<[buffer, Array<Array<unknown>>?]>();
const ReplecsUnreliableRoute = new Route<[buffer, Array<Array<unknown>>?]>();
const ReplecsInitialSyncRoute = new Route<[buffer, Array<Array<unknown>>?]>();

export const NetworkRoutes = {
	ReplecsInitialSyncRoute,
	ReplecsReliableRoute,
	ReplecsUnreliableRoute,
};

export const [beginNetworkFrame, endNetworkFrame] = Net.createHook(NetworkRoutes);

Log.Debug("[Network] Setting up logging middleware");
for (const [name, route] of pairs(NetworkRoutes)) {
	route.addIncomingMiddleware((args) => {
		// Log.Debug(`[Network] Incoming ${name} with args: ${tostring(args)}`);
		return args;
	});
	route.addOutgoingMiddleware((args) => {
		// Log.Debug(`[Network] Outgoing ${name} with args: ${tostring(args)}`);
		return args as unknown;
	});
}
