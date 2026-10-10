import { Character, Skill, SkillDecorator } from "@rbxts/wcs";
import { Workspace } from "@rbxts/services";
import { Parry } from "../parry";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { NPC_SETTINGS } from "shared/data/npcs/enemyTypes";
import { AnimationUtils } from "shared/utils/visual/animationUtil";

@SkillDecorator
export class NPCMeleeWeapon extends Skill {
	activeTarget: Model | undefined;
	npcSettings: typeof NPC_SETTINGS[keyof typeof NPC_SETTINGS] | undefined;
	characterName: string = "baseballBat"; // Default
	characterModel: Model | undefined;

	private isAttacking = false;
	private currentTrack: AnimationTrack | undefined;

	public OnStartServer() {
		// 1. Load Settings based on the character name (e.g., "sab" or default "baseballBat")
		const key = this.characterName.lower() as keyof typeof NPC_SETTINGS;
		this.npcSettings = NPC_SETTINGS[key] || NPC_SETTINGS.baseballBat;
		print(`NPC Weapon Initialized for: ${this.characterName} with range: ${this.npcSettings.attackRange}`);
	}

	// --- Marker Logic (Called when animation reaches "hit" event) ---
	lightMarker = {
		hit: () => {
			this.processHit(this.npcSettings?.lightDamage || 10);
		},
	};

	heavyMarker = {
		hit: () => {
			this.processHit(this.npcSettings?.heavyDamage || 20);
		},
	};

	// --- Core Hit Processing ---
	private processHit(damage: number) {
		if (!this.activeTarget || !this.checkPlayerInRange()) return;

		// 1. Get Target WCS Character to check for skills (like Parry)

		const targetChar = Character.GetCharacterFromInstance(this.activeTarget);
		if (!targetChar) return;
		const parrySkill = targetChar.GetSkillFromConstructor(Parry);

		// 2. Check for Parry
		if (parrySkill && parrySkill.parrying) {
			// Player parried!
			// TODO: Add stun logic here for the NPC (e.g., play stun anim, pause AI)
			print("Attack Parried!");
			return;
		}

		// 3. Deal Damage (Fallback to Humanoid if WCS damage isn't set up)
		const humanoid = this.activeTarget.FindFirstChild("Humanoid") as Humanoid;
		if (humanoid) {
			humanoid.TakeDamage(damage);
			print(`Hit ${this.activeTarget.Name} for ${damage} damage.`);
		}
	}

	// --- Utility Checks ---

	checkPlayerInRange(): boolean {
		if (!this.activeTarget || !this.npcSettings) return false;

		const myRoot = this.characterModel!.PrimaryPart;
		const targetRoot = this.activeTarget.PrimaryPart;

		if (!myRoot || !targetRoot) return false;

		const dist = myRoot.Position.sub(targetRoot.Position).Magnitude;
		return dist <= this.npcSettings.attackRange;
	}

	// --- Actions ---

	public attemptLightAttack() {
		// print("Attempt");
		if (this.isAttacking) return;
		this.isAttacking = true;

		let animId = "";
		if (this.characterName === "sab") {
			animId = ANIMATION_IDS.combatnpc.sab.lightattack; // Example path
		} else {
			animId = ANIMATION_IDS.item.Baseballbat.lightattack; // Example path
		}

		if (!animId) {
			warn("No light attack animation found for", this.characterName);
			this.isAttacking = false;
			return;
		}

		AnimationUtils.loadAnim(this.characterModel as Model, "lightAttack", animId, 0, false, this.lightMarker)
		this.isAttacking = false;
	}

	// public attemptHeavyAttack() {
	// 	if (this.isAttacking) return;
	// 	this.isAttacking = true;

	// 	let animId = "";
	// 	if (this.characterName === "sab") {
	// 		animId = ANIMATION_IDS.combatnpc.sab.heavyAttack;
	// 	} else {
	// 		animId = ANIMATION_IDS.item.baseballBat.heavyAttack;
	// 	}

	// 	if (!animId) {
	// 		this.isAttacking = false;
	// 		return;
	// 	}

	// 	this.playAttackAnimation(animId, this.heavyMarker);
	// }

	// Optional: Use raycast for more precise hit detection than distance
	raycastToPlayer(): boolean {
		if (!this.activeTarget || !this.activeTarget.PrimaryPart) return false;

		const origin = this.Character.Player!.Character!.PrimaryPart!.Position;
		const targetPos = this.activeTarget.PrimaryPart.Position;
		const direction = targetPos.sub(origin);

		const raycastParams = new RaycastParams();
		raycastParams.FilterDescendantsInstances = [this.Character.Instance];
		raycastParams.FilterType = Enum.RaycastFilterType.Exclude;

		const result = Workspace.Raycast(origin, direction.Unit.mul(this.npcSettings!.attackRange), raycastParams);

		if (result && result.Instance.IsDescendantOf(this.activeTarget)) {
			return true;
		}
		return false;
	}
}
