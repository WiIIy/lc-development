import { Character } from "@rbxts/wcs";
import { Action } from "shared/data/profile/defaultKeybinds";

export const DroneHandlers: Partial<Record<Action, (char: Character, input: InputObject, active: boolean) => void>> = {
	[Action.DroneTurnOnCloseUp]: (char, input, active) => {
		// if (!active) return;
		// if (!active) return;
		// const droneSkill = char.GetSkillFromConstructor(Drone);
		// if (droneSkill) {
		// 	droneSkill.turnOnCameraFeed(); // LMB
		// }
	},
	[Action.DroneDeployPickUp]: (char, input, active) => {
		// if (!active) return;
		// const droneSkill = char.GetSkillFromConstructor(Drone);
		// if (droneSkill) {
		// 	droneSkill.deployOrPickup(); // F Key
		// }
	},
	[Action.DroneUnfocusFeed]: (char, input, active) => {
		// if (!active) return;
		// const droneSkill = char.GetSkillFromConstructor(Drone);
		// if (droneSkill && droneSkill.isViewingFeed) {
		// 	droneSkill.unfocusCameraFeed(); // X Key
		// }
	},
};
