import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";

@SkillDecorator
export class MeleeBlock extends Skill {
	protected OnStartClient(): void {
		print("preloading");
		AnimationUtils.preloadAnimations(this.Player!.Character!, [ANIMATION_IDS.actions.block]);
	}

	meleeBlockStart() {
		AnimationUtils.loadAnim(this.Player!.Character! as Model, "block", ANIMATION_IDS.actions.block, 0.1, true);
		this.serverMeleeBlockStart();
	}

	meleeBlockEnd() {
		AnimationUtils.stopAnim(this.Player!.Character! as Model, "block");
		this.serverMeleeBlockEnd();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverMeleeBlockStart(): void {}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverMeleeBlockEnd(): void {}
}
