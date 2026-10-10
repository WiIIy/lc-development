import { useState, useEffect } from "@rbxts/react";
import { InventoryStore } from "../stores/InventoryStore";

/**
 * A custom hook to subscribe to the player's currently equipped hotbar slot number.
 * This causes the component to re-render whenever the currentSlot changes.
 * @returns The selected slot number string (e.g., "1", "2", "3").
 */
export function useCurrentSlot(): string {
	// Initialize with the current state from the store
	const [slot, setSlot] = useState<string>(() => InventoryStore.getCurrentSlot());

	useEffect(() => {
		// Use the new onCurrentSlotChange method
		const connection = InventoryStore.onCurrentSlotChange((newSlot) => {
			setSlot(newSlot);
		});

		return () => connection.Disconnect();
	}, []);

	return slot;
}
