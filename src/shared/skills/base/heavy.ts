//src/shared/skills/base/heavy.ts
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { ref } from "@willy/jecs-utils";
import assets from "shared/assets";
import { beginPlayerAttack, endPlayerAttack, resolvePlayerHit } from "shared/utils/combat/playerCombat";
import { playSwing, preloadWeapon } from "shared/utils/combat/playerAnimations";
import { setPlayerAction } from "shared/utils/npc/attack/setPlayerAction";

const FLINCH_ANIMATIONS = [
	assets["anims/character/npc/takehit/ow1.rbxm"],
	assets["anims/character/npc/takehit/ow2.rbxm"],
	assets["anims/character/npc/takehit/ow3.rbxm"],
];

@SkillDecorator
export class MeleeHeavy extends Skill {
	protected OnConstructClient(): void {
		const character = this.Player?.Character;
		if (character !== undefined) task.defer(() => preloadWeapon(character));
	}

	meleeHeavy() {
		const character = this.Player?.Character;
		if (character === undefined) return;
		playSwing(
			character,
			"heavy",
			() => this.serverHeavyStart(),
			() => this.serverHeavyHit(),
			() => this.serverHeavyFinish(),
		);
	}

	private getPlayerEntity() {
		// looked up when needed: it may not exist yet when the skill is constructed
		const entity = this.Player !== undefined ? ref.find(this.Player) : undefined;
		if (entity === undefined) warn("[MeleeHeavy] no ECS entity for this player");
		return entity;
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverHeavyStart(): void {
		const playerEntity = this.getPlayerEntity();
		if (playerEntity === undefined) return;
		const weapon = beginPlayerAttack(playerEntity, "heavy");
		if (weapon === undefined) return;
		this.ApplyCooldown(weapon.heavy.cooldown);
		setPlayerAction(playerEntity, "meleeheavy", weapon.heavy.cooldown); // npcs tracking action state read this
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverHeavyHit(): void {
		const playerEntity = this.getPlayerEntity();
		const character = this.Player?.Character;
		if (playerEntity === undefined || character === undefined) return;
		resolvePlayerHit(playerEntity, character, "heavy", FLINCH_ANIMATIONS);
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverHeavyFinish(): void {
		const playerEntity = this.getPlayerEntity();
		if (playerEntity !== undefined) endPlayerAttack(playerEntity, "heavy");
	}
}
