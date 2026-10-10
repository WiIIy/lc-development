import { useState, useEffect } from "@rbxts/react";
import { InventoryStore } from "../stores/InventoryStore";

/**
 * A custom hook to subscribe to the client-side inventory state.
 * This will cause the component to re-render whenever the inventory changes.
 */
export function useInventoryItems(): ItemData[] {
	const [inventory, setInventory] = useState<ItemData[]>(() => InventoryStore.getItems());

	useEffect(() => {
		const connection = InventoryStore.onChange((newItems) => {
			setInventory(newItems);
		});

		return () => connection.Disconnect();
	}, []);

	return inventory;
}
