import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { ref } from "@willy/jecs-utils";
import { Entity } from "@rbxts/jecs";
import { announceThreat } from "shared/utils/npc/attack/predictiveParry";

@SkillDecorator
export class MeleeHeavy extends Skill {
	playerEntity: Entity | undefined;

	protected OnStartClient(): void {
		AnimationUtils.preloadAnimations(this.Player!.Character!, [ANIMATION_IDS.actions.heavy]);
	}

	protected OnStartServer(): void {
		this.playerEntity = ref.find(this.Player!);
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
		if (this.playerEntity !== undefined) {
			announceThreat(this.playerEntity, "light", 0.25);
		}
	}
}
