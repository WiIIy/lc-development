import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";

@SkillDecorator
export class MeleeLight extends Skill {
	protected OnStartClient(): void {
		print("preloading");
		AnimationUtils.preloadAnimations(this.Player!.Character!, [ANIMATION_IDS.actions.light]);
	}

	meleeLight() {
		print("yeah the dude lighted");
		AnimationUtils.loadAnim(this.Player!.Character! as Model, "light", ANIMATION_IDS.actions.light);
		this.serverMeleeLight();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverMeleeLight(): void {
		print("dude lighted");
	}
}
