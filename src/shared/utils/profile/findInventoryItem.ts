/** Helper to find an item by slot ID (e.g., "H1", "B5"). */
export function findItemBySlot(items: ItemData[], slotId: string): ItemData | undefined {
	return items.find((item) => item.slot === slotId);
}

/** Helper to find the index of the first empty slot. */
export function findFirstEmptySlotIndex(items: ItemData[]): number {
	return items.findIndex((item) => item.name === "");
}
