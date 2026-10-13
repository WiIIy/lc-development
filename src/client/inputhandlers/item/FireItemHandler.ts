import { Character } from "@rbxts/wcs";
import { Action } from "shared/data/profile/defaultKeybinds";

export const FireItemHandlers: Partial<Record<Action, (char: Character, input: InputObject, active: boolean) => void>> =
	{
		[Action.LightMolotov]: (char, input, active) => {
			// if (!active) return;
			// const skill = char.GetSkillFromConstructor(Molotov);
			// skill?.light();
		},
		[Action.ThrowMolotov]: (char, input, active) => {
			// const skill = char.GetSkillFromConstructor(Molotov);
			// if (!skill?.molotovIsLit) {
			// 	return;
			// }
			// if (active) {
			// 	skill?.wind();
			// } else {
			// 	if (skill?.beingWind) {
			// 		skill.throw();
			// 	}
			// }
		},
		[Action.LightLighter]: (char, input, active) => {
			// if (!active) return;
			// const lighterSkill = char.GetSkillFromConstructor(Lighter);
			// lighterSkill?.light();
		},
		[Action.PourOil]: (char, input, active) => {
			// if (!active) return;
			// const oilSkill = char.GetSkillFromConstructor(Jerrycan);
			// if (!oilSkill) return;
			// oilSkill.pour();
		},
	};
