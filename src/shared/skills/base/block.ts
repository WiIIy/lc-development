//src/shared/skills/base/block.ts
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { ref } from "@willy/jecs-utils";
import { startPlayerBlock, stopPlayerBlock } from "shared/utils/combat/playerCombat";
import { playBlock, stopBlock } from "shared/utils/combat/playerAnimations";

@SkillDecorator
export class MeleeBlock extends Skill {
	meleeBlockStart() {
		const character = this.Player?.Character;
		if (character !== undefined) playBlock(character, () => this.serverBlockStart());
	}

	meleeBlockEnd() {
		const character = this.Player?.Character;
		if (character !== undefined && stopBlock(character)) this.serverBlockEnd();
	}

	private getPlayerEntity() {
		const entity = this.Player !== undefined ? ref.find(this.Player) : undefined;
		print(entity, ref.find(this.Player!));
		if (entity === undefined) warn("[MeleeBlock] no ECS entity for this player");
		return entity;
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverBlockStart(): void {
		const playerEntity = this.getPlayerEntity();
		if (playerEntity === undefined) return;
		const accepted = startPlayerBlock(playerEntity, () => this.clientBlockBroken());
		if (accepted === undefined) this.clientBlockBroken(); // refused: drop the predicted pose
	}

	@Message({ Type: "Event", Destination: "Server" })
	protected serverBlockEnd(): void {
		const playerEntity = this.getPlayerEntity();
		if (playerEntity !== undefined) stopPlayerBlock(playerEntity);
	}

	@Message({ Type: "Event", Destination: "Client" })
	protected clientBlockBroken(): void {
		const character = this.Player?.Character;
		if (character !== undefined) stopBlock(character);
	}
}
