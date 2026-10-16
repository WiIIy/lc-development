import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";

@SkillDecorator
export class MeleeShove extends Skill {
	protected OnStartClient(): void {
		print("preloading");
		AnimationUtils.preloadAnimations(this.Player!.Character!, [ANIMATION_IDS.actions.shove]);
	}

	meleeShove() {
		AnimationUtils.loadAnim(this.Player!.Character! as Model, "light", ANIMATION_IDS.actions.shove);
		this.serverMeleeShove();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverMeleeShove(): void {}
}
