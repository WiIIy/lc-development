import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";

@SkillDecorator
export class NpcMeleeLight extends Skill {
	protected OnStartServer(): void {
		AnimationUtils.preloadAnimations(this.Character.Humanoid.Parent as Model, [ANIMATION_IDS.actions.light]);
	}

	protected serverMeleeLight(): void {
		print("dude lighted");
	}
}
