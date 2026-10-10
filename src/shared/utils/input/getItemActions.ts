// --- ACTION BUILDER ---

import { ALL_FIREARMS, ALL_MELEE_WEAPONS, ALL_THROWABLES } from "shared/data/items/all";
import {
	FIREARM_BASE_ACTIONS,
	MELEE_BASE_ACTIONS,
	THROWABLE_BASE_ACTIONS,
	SPECIFIC_ITEM_ACTIONS,
} from "shared/data/items/itemActionsConfig";

// Cache the built arrays so we don't recalculate them every frame
const actionCache = new Map<string, ItemActionDefinition[]>();

export function getItemActions(itemName: string): ItemActionDefinition[] {
	if (actionCache.has(itemName)) return actionCache.get(itemName)!;

	const actions: ItemActionDefinition[] = [];

	// 1. Inherit Base Actions
	if (ALL_FIREARMS.includes(itemName)) {
		for (const action of FIREARM_BASE_ACTIONS) {
			actions.push(action);
		}
	}

	// Using 'as' to satisfy type checks since ALL_MELEE_WEAPONS is a readonly tuple
	if (ALL_MELEE_WEAPONS.includes(itemName as typeof ALL_MELEE_WEAPONS[number])) {
		for (const action of MELEE_BASE_ACTIONS) {
			actions.push(action);
		}
	}

	if (ALL_THROWABLES.includes(itemName)) {
		for (const action of THROWABLE_BASE_ACTIONS) {
			actions.push(action);
		}
	}

	// 2. Append Custom Specific Actions (e.g., Drone, Chainsaw)
	if (SPECIFIC_ITEM_ACTIONS[itemName]) {
		for (const action of SPECIFIC_ITEM_ACTIONS[itemName]) {
			actions.push(action);
		}
	}

	actionCache.set(itemName, actions);
	return actions;
}
