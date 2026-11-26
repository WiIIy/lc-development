import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { meleeCast } from "./meleeCast";

export type MeleeHitResult = "miss" | "parried" | "hit";

export function registerMeleeHit(e: Entity, moveName: string, move: WeaponMove): MeleeHitResult {
	const contact = meleeCast(e, move.blockcast);
	if (contact === undefined) return "miss";
	if (world.has(contact.target, Components.Parrying)) return "parried";

	const health = world.get(contact.target, Components.Health);
	if (health !== undefined) {
		world.set(contact.target, Components.Health, {
			current: math.max(0, health.current - move.damage),
			max: health.max,
		});
	}
	contact.humanoid.TakeDamage(move.damage);
	print(`[${moveName}] hit ${contact.model.Name} for ${move.damage}`);

	if (math.random() < move.bleedChance) {
		//TODO(components): apply Bleeding
	}
	if (math.random() < move.fractureChance) {
		//TODO(components): apply Fracture
	}
	return "hit";
}
