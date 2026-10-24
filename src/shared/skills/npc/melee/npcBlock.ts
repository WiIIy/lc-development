import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";

@SkillDecorator
export class NpcMeleeBlock extends Skill {
	protected OnStartServer(): void {
		AnimationUtils.preloadAnimations(this.Character.Humanoid.Parent as Model, [ANIMATION_IDS.actions.block]);
	}

	meleeBlockStart() {
		AnimationUtils.loadAnim(this.Player!.Character! as Model, "block", ANIMATION_IDS.actions.block, 0.1, true);
	}

	meleeBlockEnd() {
		AnimationUtils.stopAnim(this.Player!.Character! as Model, "block");
	}
}
