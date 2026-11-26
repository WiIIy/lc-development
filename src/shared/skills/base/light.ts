//src/shared/skills/base/light.ts
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
export class MeleeLight extends Skill {
	protected OnConstructClient(): void {
		const character = this.Player?.Character;
		if (character !== undefined) task.defer(() => preloadWeapon(character));
	}

	meleeLight() {
		const character = this.Player?.Character;
		if (character === undefined) return;
		playSwing(
			character,
			"light",
			() => this.serverLightStart(),
			() => this.serverLightHit(),
			() => this.serverLightFinish(),
		);
	}

	private getPlayerEntity() {
		// looked up when needed: it may not exist yet when the skill is constructed
		const entity = this.Player !== undefined ? ref.find(this.Player) : undefined;
		if (entity === undefined) warn("[MeleeLight] no ECS entity for this player");
		return entity;
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverLightStart(): void {
		const playerEntity = this.getPlayerEntity();
		if (playerEntity === undefined) return;
		const weapon = beginPlayerAttack(playerEntity, "light");
		if (weapon === undefined) return;
		this.ApplyCooldown(weapon.light.cooldown);
		setPlayerAction(playerEntity, "meleelight", weapon.light.cooldown); // npcs tracking action state read this
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverLightHit(): void {
		const playerEntity = this.getPlayerEntity();
		const character = this.Player?.Character;
		if (playerEntity === undefined || character === undefined) return;
		resolvePlayerHit(playerEntity, character, "light", FLINCH_ANIMATIONS);
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverLightFinish(): void {
		const playerEntity = this.getPlayerEntity();
		if (playerEntity !== undefined) endPlayerAttack(playerEntity, "light");
	}
}
