import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { mouseRaycast } from "shared/utils/input/mouseRaycast";
import assets from "shared/assets";

@SkillDecorator
export class MeleeLight extends Skill {
	enemyFlinchAnims = [
		assets["anims/character/npc/takehit/ow1.rbxm"],
		assets["anims/character/npc/takehit/ow2.rbxm"],
		assets["anims/character/npc/takehit/ow3.rbxm"],
	];

	protected OnStartClient(): void {
		AnimationUtils.preloadAnimations(this.Player!.Character!, [ANIMATION_IDS.actions.light]);
	}

	meleeLight() {
		AnimationUtils.loadAnim(this.Player!.Character! as Model, "light", ANIMATION_IDS.actions.light);
		const hit = mouseRaycast(10);
		if (hit !== undefined && hit.Instance !== undefined) {
			if (
				hit.Instance.Parent !== undefined &&
				hit.Instance.Parent.IsA("Model") &&
				hit.Instance.Parent.FindFirstChild("Humanoid") //otherwise it tries to load anims every model even without animators
			) {
				AnimationUtils.randomizeAnim(hit.Instance.Parent, "ow1", this.enemyFlinchAnims, 0.15);
			}

			if (
				hit.Instance.Parent?.Parent !== undefined &&
				hit.Instance.Parent.Parent.IsA("Model") &&
				hit.Instance.Parent.Parent.FindFirstChild("Humanoid")
			) {
				AnimationUtils.randomizeAnim(hit.Instance.Parent.Parent, "ow1", this.enemyFlinchAnims, 0.15);
			}
			// print(hit.Instance.Parent);
			// print(assets["anims/character/npc/takehit/ow1.rbxm"]);
			// print(assets["anims/character/npc/takehit/ow1.rbxm"]);
			// task.wait(0.2);
		}

		this.serverMeleeLight();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverMeleeLight(): void {
		this.ApplyCooldown(0.5);
	}
}
