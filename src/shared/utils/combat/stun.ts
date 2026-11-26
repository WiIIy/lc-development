// The only way to stun. Stuns never stack: an already stunned entity ignores new ones.
import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";

export function applyStun(e: Entity, duration: number, source: StunSource): boolean {
	if (!world.contains(e) || world.has(e, Components.Stunned) || world.has(e, Components.Dead)) return false;
	if (duration <= 0) {
		warn(`[applyStun] ignored a ${source} stun with duration ${duration} on ${e}`);
		return false;
	}
	world.set(e, Components.StunTimer, { duration, liftAt: os.clock() + duration, source });
	world.add(e, Components.Stunned);
	// cancel an npc's action right now, so its hit marker cannot fire later this frame
	if (!world.has(e, Components.Player)) world.remove(e, Components.Attacking);
	return true;
}
