import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { ref } from "@willy/jecs-utils";
import { Entity } from "@rbxts/jecs";
import { announceThreat } from "shared/utils/npc/attack/predictiveParry";
import world from "shared/world";
import Components from "shared/components";
import { setPlayerAction } from "shared/utils/npc/attack/setPlayerAction";

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
		const track = AnimationUtils.loadAnim(this.Player!.Character! as Model, "light", ANIMATION_IDS.actions.heavy);
		this.serverMeleeHeavy();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverMeleeHeavy(): void {
		this.ApplyCooldown(0.7);
		if (this.playerEntity === undefined) return;
		setPlayerAction(this.playerEntity, "meleeheavy", 0.7); // tune to the heavy animation's length
		announceThreat(this.playerEntity, "heavy", 0.25); // set the second number to your heavy's hit-marker time
	}
}
