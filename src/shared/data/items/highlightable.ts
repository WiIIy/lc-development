import { ENEMY_TYPES } from "../npcs/enemyTypes";
import { INTERACTABLE_CHARACTERS } from "../world/npcs";
import { ALL_ITEMS, ALL_PROPS } from "./all";

export const HIGHLIGHTABLE_ITEMS = [
	...INTERACTABLE_CHARACTERS,
	...ALL_ITEMS,
	...ALL_PROPS,
	...ENEMY_TYPES,
	// ...ALL_SEATS,
];
