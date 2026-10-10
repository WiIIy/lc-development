import { BASEBALL_BAT_SETTINGS } from "./stats/baseball";
import { SAB_SETTINGS } from "./stats/sab";

export const ENEMY_TYPES = [
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

export const NPC_SETTINGS = {
	sab: SAB_SETTINGS,
	baseballBat: BASEBALL_BAT_SETTINGS,
};

export const SPECIAL_NPCS = ["Sab", "Alpha", "Crane", "John"];
