import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { CollectionService, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { ASSET_ID_PREFIX, AUDIO_PATH } from "shared/data/ImageIDs";
import CameraShaker from "@rbxts/camera-shaker";
// import { shakePlayerScreen } from "shared/utils/skillclientutils";
import { leftRightInst } from "shared/utils/cameraShakes";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AnimationUtil, AnimationUtils } from "shared/utils/animationUtil";
import { antlerDebuggerDisplaying } from "shared/atoms";

@SkillDecorator
export class Antler extends Skill {
	public toggleDebugger(isOpen: boolean) {
		if (isOpen) {
			print("Antler debugger opened");
			antlerDebuggerDisplaying(true);
		} else {
			print("Antler debugger closed");
			antlerDebuggerDisplaying(false);
		}
	}
}
