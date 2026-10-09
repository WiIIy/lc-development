import { EMPTY_ITEM_NAME } from "shared/data/items/all";
import { PLACEHOLDER_BLTH_ICON } from "shared/data/items/icons";

/**
 * Creates an empty ItemData object for a given slot.
 * @param slot - The slot identifier (e.g., "H1", "B5").
 * @param slotType - The type of slot ("Hotbar" or "Backpack").
 */
export const createEmptyItem = (slot: string, slotType: SlotType): ItemData => ({
	slot,
	slotType,
	name: EMPTY_ITEM_NAME,
	icon: PLACEHOLDER_BLTH_ICON,
	amount: 0,
});
