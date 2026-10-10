import { RemoteEvents } from "client/network";
import { defaultProfileData } from "shared/data/profile/defaultProfileData";

// 1. Reactive mechanisms (BindableEvents)
const inventoryChanged = new Instance("BindableEvent");
const currentSlotChanged = new Instance("BindableEvent");

const mapSlotNumberToSlotId = (slotNumber: string) => `H${slotNumber}`;

// 2. State variables
let inventoryItems: ItemData[] = defaultProfileData.Items;
// eslint-disable-next-line prefer-const
let currentSlot: string = defaultProfileData.currentSlot;

export namespace InventoryStore {
	/**
	 * Subscribes to changes in the full inventory item list.
	 */
	export function onChange(callback: (newItems: ItemData[]) => void) {
		return inventoryChanged.Event.Connect(() => callback([...inventoryItems]));
	}

	/**
	 * Subscribes to changes in the currently selected hotbar slot.
	 */
	export function onCurrentSlotChange(callback: (newSlot: string) => void) {
		return currentSlotChanged.Event.Connect(() => callback(currentSlot));
	}

	export function getItems(): ItemData[] {
		return [...inventoryItems];
	}

	export function getCurrentSlot(): string {
		return currentSlot;
	}

	export function getCurrentEquippedItem(): ItemData | undefined {
		const slotId = mapSlotNumberToSlotId(currentSlot);
		return inventoryItems.find((item) => item.slot === slotId);
	}
}

// The server will send the ENTIRE item data for simplicity.
RemoteEvents.inventorySync.connect((Items: ItemData[], _currentSlot: string) => {
	// Update Items
	inventoryItems = Items;
	inventoryChanged.Fire();

	// Update currentSlot
	if (currentSlot !== _currentSlot) {
		currentSlot = _currentSlot;
		currentSlotChanged.Fire();
	}
});
