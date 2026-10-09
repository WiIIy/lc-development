//
//
//
//
//
// DEPRECATED, USE BASSEMELEEWEAPON.ts
//
//
//
//
//
//
//
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import world from "shared/world";
import { ref } from "@rbxts/jecs-utils";
import Components from "shared/components/components";
import { MELEE_WEAPON_STATS } from "shared/data/MeleeWeaponSettings";
import { mouseRaycast } from "shared/utils/clientutils/mouseRaycast";
import { Workspace } from "@rbxts/services";
import { AnimationUtils } from "shared/utils/animationUtil";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";

@SkillDecorator
export class LightAttack extends Skill {
	private viewmodelTrack?: AnimationTrack;
	private characterTrack?: AnimationTrack;

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	protected SyncWeaponClient(weaponName: string) {
		const viewmodel = Workspace.CurrentCamera?.WaitForChild("BaseViewmodel") as Model;
		const meleeWeaponAnimKey = weaponName as keyof typeof ANIMATION_IDS.viewmodel;

		const animations = ANIMATION_IDS.viewmodel[meleeWeaponAnimKey];
		if (meleeWeaponAnimKey && animations && "lightattack" in animations) {
			if (!this.viewmodelTrack) {
				const onMarker = (marker: string) => {
					if (marker === "hit") {
						this.viewmodelTrack?.AdjustSpeed(0);
					}
				};
				AnimationUtils.preloadAnimations(viewmodel, [animations.lightattack]);
				this.viewmodelTrack = AnimationUtils.loadAnim(viewmodel, "lightattack", animations.lightattack);
			} else {
				AnimationUtils.loadAnim(viewmodel, "lightattack", animations.lightattack);
			}
		}
	}

	protected OnStartServer() {
		const player = this.Character.Player;
		if (player) {
			const playerEntity = ref.find(player);
			const meleeEntity = world.target(playerEntity!, Components.CurrentlyEquipped);
			const itemModel = world.get(meleeEntity!, Components.ItemModel);

			const name = itemModel?.baseModel.Name ?? "None";

			this.SyncWeaponClient(name);

			const stats = MELEE_WEAPON_STATS[name as keyof typeof MELEE_WEAPON_STATS];
			if (stats) {
				this.doRaycast(stats.range, stats.LightAttackDamage);
			}
			this.playCharacterAnimation(this.Character.Player.Character!, name);
		} else {
			//this an npc
			const npcEntity = ref.find(this.Character.Instance);
			const meleeEntity = world.target(npcEntity!, Components.CurrentlyEquipped);
			const itemModel = world.get(meleeEntity!, Components.ItemModel);
			const name = itemModel?.baseModel.Name ?? "None";

			this.playCharacterAnimation(this.Character.Instance! as Model, name);
		}
	}

	protected OnStartClient(): void {}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	protected doRaycast(len: number, dmg: number) {
		const result = mouseRaycast(len);
		if (result && result.Instance.Parent && result.Instance.Parent.FindFirstChild("Humanoid")) {
			const hum = result.Instance.Parent.FindFirstChild("Humanoid") as Humanoid;
			this.damageHumanoid(dmg, hum);
		}
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected damageHumanoid(dmg: number, humanoid: Humanoid) {
		humanoid.TakeDamage(dmg);
	}

	private playCharacterAnimation(model: Model, name: string) {
		const animations = ANIMATION_IDS.item[name as keyof typeof ANIMATION_IDS.item];

		if (animations && "lightattack" in animations) {
			const animId = (animations as Record<string, string>).lightattack;

			if (!this.characterTrack) {
				AnimationUtils.preloadAnimations(model, [animId]);
			}
			// Assigning to this.characterTrack handles both initial load and updates
			this.characterTrack = AnimationUtils.loadAnim(model, "lightattack", animId);
		}
	} //yaoi
}
