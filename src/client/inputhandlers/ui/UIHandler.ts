import { UserInputService } from "@rbxts/services";
import { Character } from "@rbxts/wcs";
import { RemoteEvents } from "client/network";
import { InventoryStore } from "client/ui/stores/InventoryStore";
import { Action } from "shared/data/profile/defaultKeybinds";
import { getMouseIconEnabled } from "shared/utils/ui/getMouseIconEnabled";

export const UIHandlers: Partial<Record<Action, (char: Character, input: InputObject, active: boolean) => void>> = {
	[Action.OpenBackpack]: (char, input, active) => {
		if (!active) {
			// print("mouseIconEnabled:", getMouseIconEnabled(), "antlerOpen", antlerDebuggerDisplaying());
			UserInputService.MouseIconEnabled = false || getMouseIconEnabled(); //close on tab let go, false || true
		} else {
			// print("mouseIconEnabled:", getMouseIconEnabled());
			UserInputService.MouseIconEnabled = true || getMouseIconEnabled(); //open on tab
		}
	},
	[Action.OpenMenu]: (char, input, active) => {},
	[Action.ContinueDialogue]: (char, input, active) => {},
	[Action.DropItem]: (char, input, active) => {
		RemoteEvents.requestDropItem("H" + InventoryStore.getCurrentSlot());
	},
};
