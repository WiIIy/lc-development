export enum Action {
	//player gamme actions
	LightAttack = "LightAttack", //LMB
	HeavyAttack = "HeavyAttack", //RMB
	Dash = "Dash", //shift
	Parry = "Parry", //R
	Yell = "Yell", //V
	Mark = "Mark", //Z
	Crouch = "Crouch", //ctrl

	Grenade = "Grenade", //G
	ThrowMode = "ThrowMode", //F
	ThrowItem = "ThrowItem", //LMB
	GrapplingHook = "GrapplingHook", //G
	Chainsaw = "Chainsaw", //F
	LightMolotov = "LightMolotov", //F
	ThrowMolotov = "ThrowMolotov", //LMB
	DragCarryRagdoll = "DragCarryRagdoll", //E
	PourOil = "PourOil", //LMB

	//gun
	FireGun = "FireGun", //LMB
	AimGun = "AimGun", //RMB
	QuickReload = "QuickReload", //R
	TakeoutMagezine = "TakeoutMagezine", //X
	CockGun = "CockGun", //C
	LightLighter = "LightLighter", //LMB

	//items, some missing atm
	WalkmanPlayStop = "WalkmanPlay", //LMB
	WalkmanChangeMode = "WalkmanChangeMode", //RMB
	WalkmanChangeSongs = "WalkmanChangeSongs", //MB3
	WalkmanThrow = "WalkmanThrow", //F

	NeedlegunScrollAmpoules = "NeedlegunScrollAmpoules", //mousewheel
	NeedlegunSelectAmpoule = "NeedlegunSelectAmpoule", //LMB
	NeedlegunThrowAmpoule = "NeedlegunThrowAmpoule", //LMB
	NeedlegunInsertAmpoule = "NeedlegunInsertAmpoule", //LMB
	NeedlegunCrossbow = "NeedlegunCrossbow", //F
	NeedlegunAdministerTeam = "NeedlegunAdministerTeam", //LMB
	NeedlegunAdministerEnemy = "NeedlegunAdministerEnemy", //RMB

	DroneTurnOnCloseUp = "DroneTurnOnCloseUp", //LMB
	DroneDeployPickUp = "DroneDeployPickUp", //F
	DroneUnfocusFeed = "DroneUnfocusFeed", //X

	//ui
	OpenBackpack = "OpenBackpack", //tab
	OpenMenu = "OpenMenu", //M
	CharacterInteract = "CharacterInteract", //E
	EnvironmentInteract = "EnvironmentInteract", //E
	DoorPull = "DoorPull", //F
	ContinueDialogue = "ContinueDialogue", //space
	DropItem = "DropItem", //Q
	DossierMenu = "DossierMenu", //J
	DossierMenuNew = "DossierMenuNew", //B
	SitUnsit = "SitUnsit", //E

	//antler debugger
	AntlerOpen = "AntlerOpen", //LMB
	AntlerSpawnNpc = "AntlerSpawnNpc", //LMB
	AntlerDuplicateNpc = "AntlerDuplicateNpc", //LMB
	AntlerMoveNpc = "AntlerMoveNpc", //RMB
	AntlerDeleteNpc = "AntlerDeleteNpc", //RMB
	AntlerOpenNewInspect = "AntlerOpenNewInspect", //LMB + shift
	AntlerOpenInspect = "AntlerOpenInspect", //LMB + ctrl

	//debug
	DebugTracks = "DebugTracks", //T
	DebugMenu = "DebugMenu", //~/`
	DebugMenuAlt = "DebugMenuAlt", //`
	DefaultCamera = "DefaultCamera", //P
	LoadoutSelector = "LoadoutSelector", //L
	HideViewmodel = "HideViewmodel", //H
	SeeEnemyHidingSpots = "SeeEnemyHidingSpots", //N
}

export function inputIsKey(inp: InputObject, keycode: Enum.KeyCode | Enum.UserInputType) {
	return inp.KeyCode === keycode || inp.UserInputType === keycode;
}

// ----------------- Binds Config -----------------
export const KEYBINDS: Record<Action, (Enum.KeyCode | Enum.UserInputType)[]> = {
	[Action.LightAttack]: [Enum.UserInputType.MouseButton1],
	[Action.HeavyAttack]: [Enum.UserInputType.MouseButton2],
	[Action.Dash]: [Enum.KeyCode.LeftShift],
	[Action.Parry]: [Enum.KeyCode.R],
	[Action.Yell]: [Enum.KeyCode.V],
	[Action.Mark]: [Enum.KeyCode.Z],
	[Action.Crouch]: [Enum.KeyCode.LeftControl],

	//items
	[Action.Grenade]: [Enum.KeyCode.G],
	[Action.ThrowMode]: [Enum.KeyCode.F],
	[Action.ThrowItem]: [Enum.UserInputType.MouseButton1], //this model tolerates binds which are the exact same
	[Action.GrapplingHook]: [Enum.KeyCode.G],
	[Action.Chainsaw]: [Enum.KeyCode.F],
	[Action.LightMolotov]: [Enum.KeyCode.F],
	[Action.ThrowMolotov]: [Enum.UserInputType.MouseButton1],
	[Action.DragCarryRagdoll]: [Enum.KeyCode.E],
	[Action.PourOil]: [Enum.UserInputType.MouseButton1],
	[Action.LightLighter]: [Enum.UserInputType.MouseButton1],

	[Action.WalkmanChangeMode]: [Enum.UserInputType.MouseButton2],
	[Action.WalkmanPlayStop]: [Enum.UserInputType.MouseButton1],
	[Action.WalkmanThrow]: [Enum.KeyCode.F],
	[Action.WalkmanChangeSongs]: [Enum.UserInputType.MouseButton3],

	[Action.NeedlegunScrollAmpoules]: [Enum.UserInputType.MouseWheel],
	[Action.NeedlegunSelectAmpoule]: [Enum.UserInputType.MouseButton1],
	[Action.NeedlegunThrowAmpoule]: [Enum.UserInputType.MouseButton1],
	[Action.NeedlegunInsertAmpoule]: [Enum.UserInputType.MouseButton1],
	[Action.NeedlegunCrossbow]: [Enum.KeyCode.F],
	[Action.NeedlegunAdministerTeam]: [Enum.UserInputType.MouseButton1],
	[Action.NeedlegunAdministerEnemy]: [Enum.UserInputType.MouseButton2],

	[Action.DroneTurnOnCloseUp]: [Enum.UserInputType.MouseButton1],
	[Action.DroneDeployPickUp]: [Enum.KeyCode.F],
	[Action.DroneUnfocusFeed]: [Enum.KeyCode.X],

	//UI
	[Action.OpenBackpack]: [Enum.KeyCode.Tab],
	[Action.OpenMenu]: [Enum.KeyCode.M],
	[Action.CharacterInteract]: [Enum.KeyCode.E],
	[Action.EnvironmentInteract]: [Enum.KeyCode.E],
	[Action.DoorPull]: [Enum.KeyCode.F],
	[Action.ContinueDialogue]: [Enum.KeyCode.Space],
	[Action.DropItem]: [Enum.KeyCode.Q],
	[Action.DossierMenu]: [Enum.KeyCode.J],
	[Action.DossierMenuNew]: [Enum.KeyCode.B],
	[Action.SitUnsit]: [Enum.KeyCode.E],

	//guns
	[Action.FireGun]: [Enum.UserInputType.MouseButton1],
	[Action.AimGun]: [Enum.UserInputType.MouseButton2],
	[Action.QuickReload]: [Enum.KeyCode.R],
	[Action.TakeoutMagezine]: [Enum.KeyCode.X],
	[Action.CockGun]: [Enum.KeyCode.C],

	[Action.AntlerOpen]: [Enum.UserInputType.MouseButton1],
	[Action.AntlerSpawnNpc]: [Enum.UserInputType.MouseButton1],
	[Action.AntlerDuplicateNpc]: [Enum.UserInputType.MouseButton1],
	[Action.AntlerMoveNpc]: [Enum.UserInputType.MouseButton3],
	[Action.AntlerDeleteNpc]: [Enum.UserInputType.MouseButton2],
	[Action.AntlerOpenNewInspect]: [Enum.UserInputType.MouseButton1, Enum.KeyCode.LeftShift],
	[Action.AntlerOpenInspect]: [Enum.UserInputType.MouseButton1, Enum.KeyCode.LeftControl],

	[Action.DebugTracks]: [Enum.KeyCode.T],
	[Action.DebugMenu]: [Enum.KeyCode.Tilde],
	[Action.DebugMenuAlt]: [Enum.KeyCode.Backquote],
	[Action.DefaultCamera]: [Enum.KeyCode.P],
	[Action.LoadoutSelector]: [Enum.KeyCode.L],
	[Action.HideViewmodel]: [Enum.KeyCode.H],
	[Action.SeeEnemyHidingSpots]: [Enum.KeyCode.N],
};

// export enum ActionCategory {
// 	Gameplay, // Attacks, Movement, Items
// 	UI, // Backpack, Dialogue, Menus
// 	Debug, // Antler tools, Debug Menus, Hiding spots
// }

// // Map actions to their categories
// const ACTION_CATEGORIES: Partial<Record<Action, ActionCategory>> = {
// 	// Debug & Antler actions
// 	// [Action.AntlerSpawnNpc]: ActionCategory.Debug,
// 	// [Action.AntlerDuplicateNpc]: ActionCategory.Debug,
// 	// [Action.AntlerMoveNpc]: ActionCategory.Debug,
// 	// [Action.AntlerDeleteNpc]: ActionCategory.Debug,
// 	// [Action.AntlerOpenNewInspect]: ActionCategory.Debug,
// 	// [Action.AntlerOpenInspect]: ActionCategory.Debug,
// 	// [Action.DebugTracks]: ActionCategory.Debug,
// 	// [Action.DebugMenu]: ActionCategory.Debug,
// 	// [Action.DebugMenuAlt]: ActionCategory.Debug,

// 	// UI actions (allow toggling menus open/closed)
// 	[Action.OpenBackpack]: ActionCategory.UI,
// 	[Action.OpenMenu]: ActionCategory.UI,
// 	[Action.DossierMenu]: ActionCategory.UI,
// 	[Action.DossierMenuNew]: ActionCategory.UI,

// 	// All remaining actions default to ActionCategory.Gameplay
// 	// (You can fill out the rest or assume default)
// };

// function getActionCategory(action: Action): ActionCategory {
// 	return ACTION_CATEGORIES[action] ?? ActionCategory.Gameplay;
// }
