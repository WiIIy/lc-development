// Rules BOTH brains and the executor obey. A rule that lives here cannot drift between the two behaviors.
import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { BASE_MELEE_RANGE } from "shared/data/npcs/stats/combatDefaults";

export function canParry(e: Entity, weapon: NpcWeapon, now: number): boolean {
	const behavior = weapon.parryBehavior;
	if (behavior === undefined) return false;
	const state = world.get(e, Components.ParryState);
	if (state === undefined) return true;
	if (state.streak >= (behavior.stacking ? 2 : 1)) return false; // must do something else first
	const chaining = state.streak > 0 && now <= state.chainUntil;
	return chaining || now >= state.readyAt;
}

/** weapon capability and cooldowns only. Range is separate */
export function isCapable(e: Entity, weapon: NpcWeapon, action: string, now: number): boolean {
	if (action === "idle") return true;
	if (action === "parry") return canParry(e, weapon, now);
	if (action === "shove") return weapon.shoveBehavior !== undefined;
	return weapon.moves[action] !== undefined;
}

export function actionRange(weapon: NpcWeapon, action: string): number {
	if (action === "idle") return math.huge;
	if (action === "parry") return weapon.parryBehavior?.range ?? BASE_MELEE_RANGE;
	if (action === "shove") return weapon.shoveBehavior?.range ?? BASE_MELEE_RANGE;
	return weapon.moves[action]?.range ?? BASE_MELEE_RANGE;
}

export function flatDistance(a: Vector3, b: Vector3): number {
	return new Vector3(a.X - b.X, 0, a.Z - b.Z).Magnitude;
}

/** alive, able to act, and not already doing or about to do something */
export function isFree(e: Entity, now: number): boolean {
	if (
		world.has(e, Components.Attacking) ||
		world.has(e, Components.ActionRequest) ||
		world.has(e, Components.Dead) ||
		world.has(e, Components.Stunned) ||
		world.has(e, Components.Parried)
	) {
		return false;
	}
	return now >= (world.get(e, Components.ActionLockedUntil) ?? 0);
}

export function pickWeighted<T>(entries: T[], weightOf: (entry: T) => number): T | undefined {
	let total = 0;
	for (const entry of entries) total += weightOf(entry);
	if (total <= 0) return undefined;
	let roll = math.random() * total;
	for (const entry of entries) {
		roll -= weightOf(entry);
		if (roll < 0) return entry;
	}
	return entries[entries.size() - 1];
}
