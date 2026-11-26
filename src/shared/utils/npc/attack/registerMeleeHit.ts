import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { castAtTarget } from "./castAtTarget";
import { rollStatusEffects } from "shared/utils/combat/damage";
import { onPlayerParried } from "shared/utils/combat/playerCombat";

export type MeleeHitResult = "miss" | "parried" | "hit";

export function registerMeleeHit(e: Entity, moveName: string, move: WeaponMove): MeleeHitResult {
	const contact = castAtTarget(e, move.blockcast);
	if (contact === undefined) return "miss";
	if (world.has(contact.target, Components.Parrying)) {
		onPlayerParried(contact.target, e); // stuns the npc
		return "parried";
	}

	const health = world.get(contact.target, Components.Health);
	if (health !== undefined) {
		world.set(contact.target, Components.Health, {
			current: math.max(0, health.current - move.damage),
			max: health.max,
		});
	}
	contact.humanoid.TakeDamage(move.damage);
	print(`[${moveName}] hit ${contact.model.Name} for ${move.damage}`);
	rollStatusEffects(contact.target, move, contact.part.Name);
	return "hit";
}
