import { Character } from "@rbxts/wcs";
import { Action } from "shared/data/profile/defaultKeybinds";

export const AntlerHandlers: Partial<Record<Action, (char: Character, input: InputObject, active: boolean) => void>> = {
	[Action.AntlerOpen]: (char, input, active) => {
		if (!active) return;

		// //this context action only turns it on. it's turned off on the UI
		// const antlerSkill = char.GetSkillFromConstructor(Antler);
		// if (antlerSkill) {
		// 	if (antlerDebuggerDisplaying() === false) {
		// 		UserInputService.MouseIconEnabled = true || getMouseIconEnabled();
		// 		antlerDebuggerDisplaying(true);
		// 		antlerSkill.toggleDebugger(antlerDebuggerDisplaying());
		// 		print("Antler Opened");
		// 	}
		// }
	},
	[Action.AntlerSpawnNpc]: (char, input, active) => {},
	[Action.AntlerDuplicateNpc]: (char, input, active) => {},
	[Action.AntlerMoveNpc]: (char, input, active) => {},
	[Action.AntlerDeleteNpc]: (char, input, active) => {},
	[Action.AntlerOpenNewInspect]: (char, input, active) => {
		if (!active) return;
		print("AntlerOpenNewInspect pressed");
	},
	[Action.AntlerOpenInspect]: (char, input, active) => {},
};
