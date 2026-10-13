import { Character } from "@rbxts/wcs";
import { Action } from "shared/data/profile/defaultKeybinds";

export const ThrowableHandlers: Partial<
	Record<Action, (char: Character, input: InputObject, active: boolean) => void>
> = {
	[Action.ThrowItem]: (char, input, active) => {
		// if (!active) return;
		// char.GetSkillFromConstructor(Throw)?.Throw();
	},

	[Action.ThrowMode]: (char, input, active) => {
		// if (!active) return;
		// char.GetSkillFromConstructor(Throw)?.toggleThrowMode();
	},

	[Action.Grenade]: (char, input, active) => {
		// const skill = char.GetSkillFromConstructor(Grenade);
		// if (active) {
		// 	skill?.Start();
		// } else {
		// 	skill?.Release();
		// }
	},
};
