import world from "shared/world";
import Components from "shared/components/components";
import { Service, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { ref } from "@willy/jecs-utils";
import { RemoteEvents } from "server/network";
import { THROWABLE_SETTINGS } from "shared/data/items/stats/throwableStats";
import { ServerContext } from "shared/ServerContext";
import { ragdollCharacter } from "shared/utils/npc/interaction/ragdollCharacter";
import { processGlassShatter } from "shared/utils/visual/processGlassShatter";
import { checkStatusEffectType } from "shared/utils/visual/checkStatusEffectType";
import { MELEE_SETTINGS } from "shared/data/items/stats/meleeStats";
import { FIREARM_SETTINGS } from "shared/data/items/stats/gunStats";

function getWeaponNameFromStats(stats: DamageRequest["weaponStats"]): string | undefined {
	if (!stats) return undefined;

	for (const [name, entry] of pairs(MELEE_SETTINGS)) {
		if (entry === stats) {
			return name as string;
		}
	}

	for (const [name, entry] of pairs(FIREARM_SETTINGS)) {
		if (entry === stats) {
			return name as string;
		}
	}

	for (const [name, entry] of pairs(THROWABLE_SETTINGS)) {
		if (entry === stats) {
			return name as string;
		}
	}

	return undefined;
}

@Service({})
export class DamageService implements OnStart {
	constructor() {
		ServerContext.DamageService = this;
	}

	onStart() {
		RemoteEvents.shatterGlass.connect((plr, model, origin, hitPosition) => {
			model.FindFirstChild("Fake1")?.Destroy(); //utilizing the fact that transparent things dont show through the glass material to hide the shards
			model.FindFirstChild("Fake2")?.Destroy(); ///the two fake baseparts (front n back) are to conceal the shards inside. they have cancollide false
			processGlassShatter(model, hitPosition, origin);
			if (model.Parent && model.Parent.Name === "Mirror") {
				const wall = model.Parent.FindFirstChild("WallInvis") as BasePart; //once the mirror is shattered, you only see the wall and no reflection
				wall.Transparency = 0;
			}
		});
	}

	public processHitToPlayer(request: DamageRequest) {
		const { targetModel, hitPart, baseDamage, damageType, weaponStats, duration, hitPosition, origin } = request;

		const humanoid = targetModel.FindFirstAncestorOfClass("Humanoid");
		const player = Players.GetPlayerFromCharacter(targetModel) as Player;
		const playerEntity = ref.find(player);

		if (!humanoid || playerEntity === undefined) {
			print("no humanoid no player entity found");
			return;
		}

		if (humanoid.BreakJointsOnDeath === true) {
			humanoid.BreakJointsOnDeath = false;
		}

		if (humanoid.Health <= 0) {
			if (humanoid.Parent!.GetAttribute("ragdolled") === undefined) {
				ragdollCharacter(humanoid.Parent as Model);
			}
		}

		humanoid.TakeDamage(baseDamage);
	}

	public processHit(request: DamageRequest) {
		const { targetModel, hitPart, baseDamage, damageType, weaponStats, duration, hitPosition, origin } = request;

		const humanoid = targetModel.FindFirstChildOfClass("Humanoid");
		const targetEntity = ref.get(targetModel);

		if (!humanoid || targetEntity === undefined) {
			return;
		}

		// 1. Apply Base Damage
		humanoid.TakeDamage(baseDamage);

		if (humanoid.BreakJointsOnDeath === true) {
			humanoid.BreakJointsOnDeath = false;
		}

		if (humanoid.Health <= 0) {
			if (humanoid.Parent!.GetAttribute("ragdolled") === undefined) {
				ragdollCharacter(humanoid.Parent as Model);
			}
		}

		// 2. Resolve Debuffs
		const currentDebuffs = world.get(targetEntity, Components.ActiveStatusEffects) || [];
		let debuffsModified = false;
		const partName = hitPart.Name as BodyPart;
		const weaponName = getWeaponNameFromStats(weaponStats);
		// print(weaponName);

		// print("A");
		if (weaponName === "Knife" && partName === "Head") {
			// print("B");
			// Apply Blindness on Knife Headshot
			world.set(targetEntity, Components.HasBlindness, { eye: "both" });
		}

		if (weaponStats) {
			// Fracture Logic
			if ("InflictFractureChance" in weaponStats) {
				const enemyUnlucky = math.random() <= weaponStats.InflictFractureChance;

				if (enemyUnlucky) {
					print("inflicted fracture on enemy's ", partName);
					currentDebuffs.push({
						id: "Fracture",
						bodyPart: partName,
						startTime: os.time(),
						type: checkStatusEffectType("Fracture"),
					});
					debuffsModified = true;
				}
			}

			// Bleeding Logic
			if ("InflictBleedingChance" in weaponStats) {
				const enemyUnlucky = math.random() <= weaponStats.InflictBleedingChance;

				if (enemyUnlucky) {
					print("inflicted bleeding on enemy's ", partName);
					currentDebuffs.push({
						id: "Bleed",
						bodyPart: partName,
						startTime: os.time(),
						type: checkStatusEffectType("Bleed"),
					});
					debuffsModified = true;
				}
			}

			// Concussion / Vegetable Logic (Headshots)
			if (partName === "Head") {
				if (damageType === "Blunt" && math.random() <= 0.4) {
					print("inflicted concussion on enemy");
					currentDebuffs.push({
						id: "Concussion",
						bodyPart: partName,
						startTime: os.time(),
						type: checkStatusEffectType("Concussion"),
					});
					debuffsModified = true;
				} else if (weaponStats === MELEE_SETTINGS.Lobotomizer) {
					print("enemy is now a vegetable");
					currentDebuffs.push({
						id: "Vegetable",
						bodyPart: partName,
						startTime: os.time(),
						type: checkStatusEffectType("Vegetable"),
					});
					debuffsModified = true;
					world.add(targetEntity, Components.IsVegetable);
				}
			}
		}

		// 3. Update ECS State if modified
		if (debuffsModified) {
			world.set(targetEntity, Components.ActiveStatusEffects, currentDebuffs);
		}
	}
}
