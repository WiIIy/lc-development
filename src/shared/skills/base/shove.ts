////src/shared/skills/base/shove.ts
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { ref } from "@willy/jecs-utils";

import { beginPlayerAttack, endPlayerAttack, resolvePlayerHit } from "shared/utils/combat/playerCombat";
import { playSwing, preloadWeapon } from "shared/utils/combat/playerAnimations";
import { setPlayerAction } from "shared/utils/npc/attack/setPlayerAction";

@SkillDecorator
export class MeleeShove extends Skill {
	protected OnConstructClient(): void {
		const character = this.Player?.Character;
		if (character !== undefined) task.defer(() => preloadWeapon(character));
	}

	meleeShove() {
		const character = this.Player?.Character;
		if (character === undefined) return;
		playSwing(
			character,
			"shove",
			() => this.serverShoveStart(),
			() => this.serverShoveHit(),
			() => this.serverShoveFinish(),
		);
	}

	private getPlayerEntity() {
		// looked up when needed: it may not exist yet when the skill is constructed
		const entity = this.Player !== undefined ? ref.find(this.Player) : undefined;
		if (entity === undefined) warn("[MeleeShove] no ECS entity for this player");
		return entity;
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverShoveStart(): void {
		const playerEntity = this.getPlayerEntity();
		if (playerEntity === undefined) return;
		const weapon = beginPlayerAttack(playerEntity, "shove");
		if (weapon === undefined) return;
		this.ApplyCooldown(weapon.shove.cooldown);

	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverShoveHit(): void {
		const playerEntity = this.getPlayerEntity();
		const character = this.Player?.Character;
		if (playerEntity === undefined || character === undefined) return;
		resolvePlayerHit(playerEntity, character, "shove", []);
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverShoveFinish(): void {
		const playerEntity = this.getPlayerEntity();
		if (playerEntity !== undefined) endPlayerAttack(playerEntity, "shove");
	}
}
