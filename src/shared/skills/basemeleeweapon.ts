import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";
import { ReplicatedStorage, Workspace } from "@rbxts/services";
import world from "shared/world";
import { ref } from "@rbxts/jecs-utils";
import Components from "shared/components/components";
import { Entity, pair, Wildcard } from "@rbxts/jecs";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AnimationUtils } from "shared/utils/animationUtil";
import { MELEE_WEAPON_STATS } from "shared/data/MeleeWeaponSettings";
import { mouseRaycast } from "shared/utils/clientutils/mouseRaycast";
import { breakLocalGlass } from "shared/utils/clientutils/breakLocalGlass";

//TODO, add lhit and hhit Sounds to handle of template model

@SkillDecorator
export class MeleeWeapon extends Skill {
	viewmodel: Model | undefined;
	meleeWeaponString: string | undefined;
	stats: typeof MELEE_WEAPON_STATS[keyof typeof MELEE_WEAPON_STATS] | undefined;

	vmAnimationSet: typeof ANIMATION_IDS.viewmodel[keyof typeof ANIMATION_IDS.viewmodel] | undefined;
	charAnimationSet: typeof ANIMATION_IDS.item[keyof typeof ANIMATION_IDS.item] | undefined;

	lightMarker = {
		hit: () => {
			if (!this.stats) {
				print("melee missing stats data");
				return;
			}

			const result = mouseRaycast(this.stats?.range);
			if (result && result.Instance.Parent && result.Instance.Parent.FindFirstChild("Humanoid")) {
				const hum = result.Instance.Parent.FindFirstChild("Humanoid") as Humanoid;
				this.damageHumanoid(this.stats.LightAttackDamage, hum);
			}
		},
	};
	heavyMarker = {
		hit: () => {
			if (!this.stats) {
				print("melee missing stats data");
				return;
			}

			const result = mouseRaycast(this.stats?.range);
			if (result && result.Instance.Parent && result.Instance.Parent.FindFirstChild("Humanoid")) {
				const hum = result.Instance.Parent.FindFirstChild("Humanoid") as Humanoid;
				this.damageHumanoid(this.stats.HeavyAttackDamage, hum);
			}

			//glass check
			if (this.meleeWeaponString === "Sledgehammer" || this.meleeWeaponString === "Fireaxe") {
				const origin = this.Player!.Character!.FindFirstChild("Torso") as BasePart;
				if (
					result &&
					result.Instance &&
					result.Instance.Parent &&
					result.Instance.Parent.Name === "Glass" &&
					result.Instance.Parent.IsA("Model")
				) {
					breakLocalGlass(result.Instance.Parent, origin.Position, result.Position);
				}
			}
		},
	};

	// start methods fire automatically upon the skill being added to the player
	// they are reserved for skill setup like preloading animations and stats
	protected OnStartClient(): void {
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.WaitForChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}

		const player = this.Character.Player;
		if (player) {
			const playerEntity = ref.find(player);
			const name = world.get(playerEntity!, pair(Components.CurrentlyEquipped, Wildcard)) ?? "None";
			this.meleeWeaponString = name;
			this.stats = MELEE_WEAPON_STATS[this.meleeWeaponString as keyof typeof MELEE_WEAPON_STATS];
			if (!this.stats) {
				print("no stats in MELEE_WEAPON_STATS check again");
			}
		}

		const animationSet = ANIMATION_IDS.viewmodel[this.meleeWeaponString as keyof typeof ANIMATION_IDS.viewmodel];
		if (animationSet) {
			this.vmAnimationSet = animationSet;
		} else {
			print("no animation set for viewmodel:", this.meleeWeaponString);
			return;
		}

		if ("lightattack" in animationSet) {
			AnimationUtils.preloadAnimations(this.viewmodel, [animationSet.lightattack]);
		}
		if ("heavyattack" in animationSet) {
			AnimationUtils.preloadAnimations(this.viewmodel, [animationSet.heavyattack]);
		}
	}

	protected OnStartServer(): void {
		const player = this.Character.Player;
		if (player) {
			const playerEntity = ref.find(player);
			const name = world.get(playerEntity!, pair(Components.CurrentlyEquipped, Wildcard));

			this.meleeWeaponString = name;
			const animationSet = ANIMATION_IDS.item[this.meleeWeaponString as keyof typeof ANIMATION_IDS.item];
			this.stats = MELEE_WEAPON_STATS[this.meleeWeaponString as keyof typeof MELEE_WEAPON_STATS];

			if (animationSet) {
				this.charAnimationSet = animationSet;
			} else {
				print("no animation set for character");
				return;
			}

			if ("lightattack" in this.charAnimationSet) {
				AnimationUtils.preloadAnimations(this.Player?.Character as Model, [this.charAnimationSet.lightattack]);
			}
			if ("heavyattack" in this.charAnimationSet) {
				AnimationUtils.preloadAnimations(this.Player?.Character as Model, [this.charAnimationSet.heavyattack]);
			}
		}
	}

	private ensureInitialized(): boolean {
		// 1. If we already have everything, we are good
		// print(this.viewmodel, this.stats, this.vmAnimationSet)
		if (this.viewmodel && this.stats && this.vmAnimationSet) {
			return true;
		}

		const player = this.Character.Player;
		if (!player) return false;

		// 2. Try to find Viewmodel again if missing
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.FindFirstChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}

		// 3. Try to find Stats again if missing
		// This handles the case where Jecs replication arrived AFTER OnStartClient
		if (!this.stats || this.meleeWeaponString === undefined) {
			const playerEntity = ref.find(player);
			if (playerEntity !== undefined) {
				const name = world.get(playerEntity, pair(Components.CurrentlyEquipped, Wildcard));
				if (name !== undefined) {
					this.meleeWeaponString = name;
					this.stats = MELEE_WEAPON_STATS[this.meleeWeaponString as keyof typeof MELEE_WEAPON_STATS];

					// Also refresh animation set
					const animationSet =
						ANIMATION_IDS.viewmodel[this.meleeWeaponString as keyof typeof ANIMATION_IDS.viewmodel];

					if (animationSet) {
						this.vmAnimationSet = animationSet;
					} else {
						print("no animation set for viewmodel");
						return false;
					}

					if ("lightattack" in animationSet) {
						AnimationUtils.preloadAnimations(this.viewmodel, [animationSet.lightattack]);
					}
					if ("heavyattack" in animationSet) {
						AnimationUtils.preloadAnimations(this.viewmodel, [animationSet.heavyattack]);
					}
				}
			}
		}

		return !!(this.viewmodel && this.stats && this.vmAnimationSet);
	}

	//
	//
	//
	//  light attack
	//
	//
	//

	lightAttack() {
		if (!this.ensureInitialized()) {
			print("MeleeWeapon: Waiting for data/viewmodel...");
			return;
		}
		print("yeah the dude lighted");
		if (!this.Player) return;

		const playerEntity = ref.find(this.Player);
		if (playerEntity !== undefined) {
			const stamina = world.get(playerEntity, Components.Stamina);
			const staminaCost = this.stats?.LightAttackStaminaCost as number;

			if (stamina && stamina.current < staminaCost) {
				print("Not enough stamina!");
				return;
			}
		}

		if (!this.stats || !this.viewmodel || !this.vmAnimationSet || !("lightattack" in this.vmAnimationSet)) {
			print(
				"MISSING DATA | melee stats:",
				this.stats,
				" | viewmodel: ",
				this.viewmodel,
				" animSet: ",
				this.vmAnimationSet,
				"or no lightattack anim yet",
			);
			return;
		}

		AnimationUtils.loadAnim(
			this.viewmodel,
			"lightattack",
			this.vmAnimationSet.lightattack,
			0,
			false,
			this.lightMarker,
		);

		this.serverLightAttack();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverLightAttack(): void {
		print("attacking");
		if (!this.Player) return;

		const playerEntity = ref.find(this.Player);

		if (playerEntity !== undefined) {
			const stamina = world.get(playerEntity, Components.Stamina);

			const staminaCost = this.stats?.LightAttackStaminaCost as number;

			if (stamina) {
				const newCurrent = math.max(0, stamina.current - staminaCost);

				world.set(playerEntity, Components.Stamina, {
					current: newCurrent,
					max: stamina.max,
				});
			}
		}

		if (!this.charAnimationSet || !("lightattack" in this.charAnimationSet)) {
			print("charAnimSet missing animations yo");
			return;
		}

		AnimationUtils.loadAnim(this.Player?.Character as Model, "lightattack", this.charAnimationSet.lightattack);
	}

	//
	//
	//
	//  heavy attack
	//
	//
	//

	heavyAttack() {
		if (!this.ensureInitialized()) {
			print("MeleeWeapon: Waiting for data/viewmodel...");
			return;
		}
		print("yeah the dude heavied");
		if (!this.Player) return;

		const playerEntity = ref.find(this.Player);
		if (playerEntity !== undefined) {
			const stamina = world.get(playerEntity, Components.Stamina);
			const staminaCost = this.stats?.HeavyAttackStaminaCost as number;

			if (stamina && stamina.current < staminaCost) {
				print("Not enough stamina!");
				return;
			}
		}

		if (!this.stats || !this.viewmodel || !this.vmAnimationSet || !("heavyattack" in this.vmAnimationSet)) {
			print(
				"MISSING DATA | melee stats:",
				this.stats,
				" | viewmodel: ",
				this.viewmodel,
				" animSet: ",
				this.vmAnimationSet,
				"or no heavyattack anim yet",
			);
			return;
		}

		AnimationUtils.loadAnim(
			this.viewmodel,
			"lightattack",
			this.vmAnimationSet.heavyattack,
			0,
			false,
			this.heavyMarker,
		);

		this.serverHeavyAttack();
	}

	//blocking maybe not just for melee weapons?
	startBlock() {
		print("dude is blocking");
		this.serverStartBlock();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverHeavyAttack(): void {
		print("dude heavied");
		if (!this.Player) return;

		const playerEntity = ref.find(this.Player);

		if (playerEntity !== undefined) {
			const stamina = world.get(playerEntity, Components.Stamina);

			const staminaCost = this.stats?.HeavyAttackStaminaCost as number;

			if (stamina) {
				const newCurrent = math.max(0, stamina.current - staminaCost);

				world.set(playerEntity, Components.Stamina, {
					current: newCurrent,
					max: stamina.max,
				});
			}
		}

		if (!this.charAnimationSet || !("heavyattack" in this.charAnimationSet)) {
			print("charAnimSet missing animations yo");
			return;
		}

		AnimationUtils.loadAnim(this.Player?.Character as Model, "heavyattack", this.charAnimationSet.heavyattack);
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverStartBlock(): void {
		print("dude blocked");
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected damageHumanoid(dmg: number, humanoid: Humanoid) {
		humanoid.TakeDamage(dmg);
	}

	protected OnConstructClient(): void {
		this.Destroyed.Connect(() => {
			const viewmodel = Workspace.CurrentCamera?.WaitForChild("BaseViewmodel") as Model;
			AnimationUtils.clearAllAnimations(viewmodel, 0.2, ["carrying"]);
		});
	}

	protected OnConstructServer(): void {
		this.Destroyed.Connect(() => {
			// AnimationUtils.clearAllAnimations(this.Player?.Character as Model, 0.2);
			//already handled by inventoryservice
		});
	}
}
