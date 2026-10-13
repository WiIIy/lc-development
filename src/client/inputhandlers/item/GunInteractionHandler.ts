import { Character } from "@rbxts/wcs";
import { Action } from "shared/data/profile/defaultKeybinds";

export const GunInteractionHandlers: Partial<
	Record<Action, (char: Character, input: InputObject, active: boolean) => void>
> = {
	[Action.FireGun]: (char, input, active) => {
		// // print("fire gun runs");
		// const parrySkill = char.GetSkillFromConstructor(Parry);
		// if (parrySkill?.parrying) {
		// 	print("cant aim while parrying");
		// 	return;
		// }
		// //usually only one is active
		// const pistolSkill = char.GetSkillFromConstructor(Pistol);
		// // const rifleSkill = char.GetSkillFromConstructor(Rifle);
		// const sniperSkill = char.GetSkillFromConstructor(Sniper);
		// const smgSkill = char.GetSkillFromConstructor(Smg);
		// if (active) {
		// 	//only on inputbegan not inputended
		// 	pistolSkill?.Fire();
		// 	sniperSkill?.Fire();
		// 	smgSkill?.startShooting();
		// 	// rifleSkill?.startShooting();
		// } else {
		// 	smgSkill?.stopShooting();
		// 	// rifleSkill?.stopShooting();
		// }
	},
	[Action.AimGun]: (char, input, active) => {
		// const parrySkill = char.GetSkillFromConstructor(Parry);
		// if (parrySkill?.parrying) {
		// 	print("cant aim while parrying");
		// 	return;
		// }
		// const pistolSkill = char.GetSkillFromConstructor(Pistol);
		// const smgSkill = char.GetSkillFromConstructor(Smg);
		// // const rifleSkill = char.GetSkillFromConstructor(Rifle);
		// const sniperSkill = char.GetSkillFromConstructor(Sniper);
		// pistolSkill?.Aim(active);
		// smgSkill?.Aim(active);
		// // rifleSkill?.Aim(active);
		// sniperSkill?.Aim(active);
	},
	[Action.QuickReload]: (char, input, active) => {
		// if (!active) return;
		// const pistolSkill = char.GetSkillFromConstructor(Pistol);
		// const smgSkill = char.GetSkillFromConstructor(Smg);
		// if (smgSkill?.magOut) {
		// 	smgSkill.Reload();
		// }
	},
	[Action.CockGun]: (char, input, active) => {
		//auto pistols dont need cocking
	},
	[Action.TakeoutMagezine]: (char, input, active) => {
		// if (!active) return;
		// const pistolSkill = char.GetSkillFromConstructor(Pistol);
		// const smgSkill = char.GetSkillFromConstructor(Smg);
		// // const rifleSkill = char.GetSkillFromConstructor(Rifle);
		// const sniperSkill = char.GetSkillFromConstructor(Sniper);
		// pistolSkill?.takeoutInsertMag();
		// smgSkill?.takeoutInsertMag();
		// // rifleSkill?.takeoutInsertMag();
		// sniperSkill?.takeoutInsertMag();
	},
};
