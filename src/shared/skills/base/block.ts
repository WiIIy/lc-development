import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import Components from "shared/components/components";
import { ref } from "@willy/jecs-utils";
import { Entity } from "@rbxts/jecs";
import world from "shared/world";

@SkillDecorator
export class MeleeBlock extends Skill {
	playerEntity: Entity | undefined;

	protected OnStartClient(): void {
		AnimationUtils.preloadAnimations(this.Player!.Character!, [ANIMATION_IDS.actions.block]);
	}
	protected OnStartServer(): void {
		this.playerEntity = ref.find(this.Player!);
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
	protected serverMeleeBlockStart(): void {
		world.add(this.playerEntity!, Components.Parrying);
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverMeleeBlockEnd(): void {
		if (world.has(this.playerEntity!, Components.Parrying)) {
			world.remove(this.playerEntity!, Components.Parrying);
		}
	}
}
