import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";

@SkillDecorator
export class MeleeHeavy extends Skill {
	protected OnStartClient(): void {
		AnimationUtils.preloadAnimations(this.Player!.Character!, [ANIMATION_IDS.actions.heavy]);
	}

	meleeHeavy() {
		print("yeah the dude heavied");
		AnimationUtils.loadAnim(this.Player!.Character! as Model, "light", ANIMATION_IDS.actions.heavy);
		this.serverMeleeHeavy();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverMeleeHeavy(): void {
		print("dude heavied");
	}
}
