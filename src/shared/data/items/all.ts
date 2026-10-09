export const PICKUPABLE_PROPS = ["Cup", "Bottle1", "Waterbottle", "Propane", "Extingusher"];

export const HIGHLIGHT_ONLY_PROPS = ["Door", "DoorTemplate", "Vent", "VentOpening", "OpenSlightHitbox", "OpenHitbox"];

export const ALL_PROPS = [...PICKUPABLE_PROPS, ...HIGHLIGHT_ONLY_PROPS];

export const ALL_STACKABLE_ITEMS = ["Knife", "Molotov", "Detonator"];

export const ALL_MELEE_WEAPONS = [
	"Fists",
	"Fireaxe",
	"Baseballbat",
	"Brick",
	"Knife",
	"Sledgehammer",
	"Gauntlet",
	"Claw",
	"Jesus",
	"Lobotomizer",
	"Teeth", //teeth the chainsaw has melee behaviors so its registered here too, maybe extend chainsaw class from basemelee? hm
] as const;

export const WALKMAN = ["Walkman"];
export const DRONE_ITEM = ["Drone"]; //stored here so it gets highlighted and you can pick it up
export const CHAINSAW = ["Teeth"];
export const MOLOTOV = ["Molotov"];
export const FLASHLIGHT = ["Flashlight"];
export const JERRYCAN = ["Jerrycan"];
export const LIGHTER = ["Lighter"];
export const ANTLER = ["Antler"];
export const DRONE = ["Droneremote"]; //the droneremote is the main functionality item thats welded to the right arm/main. the drone wll be welded to the left arm in the drone skill
export const ALL_MISC_ITEM = [
	...CHAINSAW,
	...MOLOTOV,
	...JERRYCAN,
	...FLASHLIGHT,
	...LIGHTER,
	...WALKMAN,
	...DRONE,
	...DRONE_ITEM,
	...ANTLER,
];

export const ALL_PISTOLS = ["Vag73", "Silenced Pistol", "Taurus"];
export const ALL_SMGS = ["M10"];
export const ALL_RIFLES = ["Serpent"];
export const ALL_SHOTGUNS = ["Breach Shotgun"];
export const ALL_SNIPERS = ["R50"];
export const ALL_FIREARMS = ["Pistol", ...ALL_PISTOLS, ...ALL_SMGS, ...ALL_SHOTGUNS, ...ALL_RIFLES, ...ALL_SNIPERS];

export const EMBEDDED_THROWABLES = ["Knife", "Kabar", "Detonator"]; //fixed trajectory weight and length
export const NONEMBEDDED_THROWABLES = ["Rat", "Grenade"];
export const ALL_THROWABLES = [...EMBEDDED_THROWABLES, ...NONEMBEDDED_THROWABLES];

export const ALL_ITEMS = [...ALL_THROWABLES, ...ALL_MELEE_WEAPONS, ...ALL_FIREARMS, ...ALL_MISC_ITEM];

export type MeleeWeapons = typeof ALL_MELEE_WEAPONS[number];
export const EMPTY_ITEM_NAME = "";

export const HOTBAR_SLOT_NUMBERS = ["H1", "H2", "H3", "H4", "H5", "H6", "H7"];
export const BACKPACK_SLOT_NUMBERS = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"];
export const VALID_HOTBAR_SLOTS = ["1", "2", "3", "4", "5", "6", "7"];
export const KEYCODE_LIST = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];

export const ItemAliases: Record<string, string> = {
	"H&J R50": "R50",
	"Gerasimenko Vag73": "Vag73",
	"HAL M10": "M10",
	"Jesus & Judas": "Jesus",
	"Breach Shotgun": "Breach",
	// You can map the rest of your dossier items here!
	// "Mesin K.O.": "Fists",
};