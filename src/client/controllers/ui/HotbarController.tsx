import { Controller, OnInit } from "@flamework/core";
import { ContextActionService } from "@rbxts/services";
import { RemoteEvents } from "client/network";
import { InventoryStore } from "client/ui/stores/InventoryStore";
import { VALID_HOTBAR_SLOTS } from "shared/data/items/all";
import { hotbarLocked } from "shared/sharedAtoms";

// Type for the action functions, matching ContextActionService signature
type ActionHandler = (actionName: string, state: Enum.UserInputState, input: InputObject) => Enum.ContextActionResult;

// Keys for slots 1-7
const SLOT_KEYCODES: Enum.KeyCode[] = [
	Enum.KeyCode.One,
	Enum.KeyCode.Two,
	Enum.KeyCode.Three,
	Enum.KeyCode.Four,
	Enum.KeyCode.Five,
	Enum.KeyCode.Six,
	Enum.KeyCode.Seven,
];

// Base template for the action name passed to ContextActionService
const SLOT_SELECT_ACTION_NAME = "SelectHotbarSlot";

@Controller({})
export class HotbarController implements OnInit {
	// Tracks the current item actions that are bound, so we can unbind them when swapping items.
	private currentBoundActions: string[] = [];

	onInit() {
		this.setupSlotSelectionBindings(); // Setup Slot Selection Bindings (Keys 1-7)

		InventoryStore.onCurrentSlotChange((newSlotNumber) => {
			this.updateItemActionBindings(); // Subscribe to InventoryStore changes
		});

		InventoryStore.onChange(() => {
			this.updateItemActionBindings(); //also updates when the inventory updates in case player picked something new on the current empty slot
		});

		// Run once on init
		this.updateItemActionBindings();
	}

	// --- 1. Slot Selection Logic (Keys 1-7) ---

	private handleSlotSelection: ActionHandler = (actionName, state, input) => {
		if (state !== Enum.UserInputState.Begin) return Enum.ContextActionResult.Pass;

		if (hotbarLocked()) {
			//chill out theres serverside protection for this too dont worry;
			return Enum.ContextActionResult.Sink;
		}

		const slotNumberMatch = actionName.match(`^${SLOT_SELECT_ACTION_NAME}_(%d)$`);
		const slotNumber = slotNumberMatch[0];

		if (slotNumber !== undefined && VALID_HOTBAR_SLOTS.includes(tostring(slotNumber))) {
			RemoteEvents.requestSetCurrentSlot.fire(tostring(slotNumber));
			return Enum.ContextActionResult.Sink;
		}
		return Enum.ContextActionResult.Pass;
	};

	private setupSlotSelectionBindings() {
		SLOT_KEYCODES.forEach((keyCode, index) => {
			const slotNumber = `${index + 1}`;
			const actionName = `${SLOT_SELECT_ACTION_NAME}_${slotNumber}`;
			ContextActionService.BindAction(actionName, this.handleSlotSelection, false, keyCode);
		});
	}

	// --- REQUIRES CLEANING UP ---

	/**
	 * Looks at the currently equipped item, finds its matching functions in clientBindings.ts,
	 * and binds them to the correct keys (M1, M2, R, etc).
	 */
	private updateItemActionBindings() {
		this.currentBoundActions = [];

		const equippedItem = InventoryStore.getCurrentEquippedItem();

		// If no item or empty, we are done
		if (!equippedItem || equippedItem.name === "") {
			return;
		}

		if (this.currentBoundActions.size() > 0) {
			print(`[HotbarController] Equipped ${equippedItem.name}. Bound: ${this.currentBoundActions.join(", ")}`);
		}
	}
}
