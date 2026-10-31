type BaseItemModel = Model & {
	handle: BasePart | UnionOperation;
	characterweld: Motor6D;
	viewmodelweld: Motor6D;
};
//no imports allowed

type Eye = "left" | "right" | "both";
type Tracer = Model & {
	Beam: Beam;
	End: BasePart & {
		Attachment: Attachment;
	};
	Start: BasePart & {
		Attachment: Attachment;
	};
};

type BaseItem = { baseModel: BaseItemModel; soundFolder: ItemSounds };
type GameMap = Folder & {
	SitPoints: Folder & {};
	WalkPoints: Folder & {};
	ExitPoints: Folder & {};
};
type SlotType = "Hotbar" | "Backpack";

interface ReplicatedStorage {
	// bullet: Part;
	// Grenade: MeshPart;
	// CAAssets: CAAssets;
	LCAssets: LCAssets;
	TS: Folder & {
		movesets: Folder & {};
		skills: Folder & {};
		statusEffects: Folder & {};
	};
}

interface Workspace {
	// TestNPC: Model; fdfdf
	// Axe: Model & {
	// 	CharWeld: Motor6D;
	// };
	// Galilei: Model & {
	// 	Humanoid: Humanoid & {
	// 		Animator: Animator;
	// 	};
	// };
	// TestMap: GameMap;
	// shelf: ItemContainer;

	Containers: Folder & {
		ThrowableContainer: Folder;
		BulletContainer: Folder;
		EnemyContainer: Folder;
	};

	EvilWilly: Model;

	evilWillyButtons: Folder & {
		["Pathfinding"]: Part & { ClickDetector: ClickDetector };
		["Omniscient"]: Part & { ClickDetector: ClickDetector };

		["Body Tracking"]: Part & { ClickDetector: ClickDetector };
		["Sight Tracking"]: Part & { ClickDetector: ClickDetector };
		["Tracking"]: Part & { ClickDetector: ClickDetector };

		["Melee Attacks"]: Part & { ClickDetector: ClickDetector };
		["Light Attacks"]: Part & { ClickDetector: ClickDetector };
		["Heavy Attacks"]: Part & { ClickDetector: ClickDetector };
		["Parry Response"]: Part & { ClickDetector: ClickDetector };
	};

	// Mirror: Model & {
	// 	Mirror: BasePart;
	// 	RenderPart: BasePart;
	// };
}

interface ReplicatedStorage {
	"shared/network@GlobalEvents": Folder & {
		visualsRemote: RemoteEvent;
		dialogueRemote: RemoteEvent;
		equipAccessoryOnViewmodel: RemoteEvent;
		attachDamageDisplayCallbackToCharacter: RemoteEvent;
		requestPickUpItem: RemoteEvent;
		neckMovement: UnreliableRemoteEvent;
		confirmEquip: RemoteEvent;
		fireWeapon: RemoteEvent;
		makeLocallyTransparent: RemoteEvent;
		startSkill: RemoteEvent;
		continueDialoguePrompt: RemoteEvent;
		requestSpawnEnemy: RemoteEvent;
		shatterGlass: RemoteEvent;
		requestEquipLoadout: RemoteEvent;
		inventorySync: RemoteEvent;
		setNetworkOwner: RemoteEvent;
		requestCarryRagdolledModel: RemoteEvent;
		equipAccessoryOnHumanoid: RemoteEvent;
		requestSetCurrentSlot: RemoteEvent;
		requestFirearmHit: RemoteEvent;
		deleteAccessoriesFromPlayerViewmodel: RemoteEvent;
		statisticsSync: RemoteEvent;
		requestMoveOrSwapItem: RemoteEvent;
		requestMeleeHit: RemoteEvent;
		requestDeleteEnemy: RemoteEvent;
		dossierRemote: RemoteEvent;
		requestSpawnStimulus: RemoteEvent;
		requestEquipItem: RemoteEvent;
		broadcastDamageNumber: RemoteEvent;
		dialogueEndedSignal: RemoteEvent;
		requestDropItem: RemoteEvent;
	};
}

type ItemContainer = Model & {
	attach_points: Folder;
};

type DoorTemplate = Model & {
	Hinge: Part & {
		WeldConstraint: WeldConstraint;
		HingeAttachment: Attachment;
	};
	OpenHitbox: Part;
	OpenSlightHitbox: Part;
	AnchorHinge: Part & {
		AnchorAttachment: Attachment;
		HingeConstraint: HingeConstraint;
		WeldConstraint: WeldConstraint;
	};
	Handle: Part;
	Door: UnionOperation & {
		OpenSlightHitboxWeld: WeldConstraint;
		OpenHitboxWeld: WeldConstraint;
		HandleWeld: WeldConstraint;
	};
};

type Drone = Model & {
	AnimationController: AnimationController & { Animator: Animator };
	blade2: MeshPart;
	camera: Part;
	AnimSaves: ObjectValue;
	blade4: MeshPart;
	handle: MeshPart & { blade4: Motor6D; blade3: Motor6D; blade2: Motor6D; blade1: Motor6D };
	blade3: MeshPart;
	blade1: MeshPart;
	viewmodelweld: Motor6D;
	characterweld: Motor6D;
};

type MeleeAnimationData = {
	lightAttack: string;
	heavyAttack: string;
	parry: string;
	dodge: string;
};
type ItemContainerObject = {
	model: Model;
	attachmentFolder: Folder;
};
