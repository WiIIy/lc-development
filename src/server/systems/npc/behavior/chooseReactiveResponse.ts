//src/server/systems/npc/behavior/chooseReactiveResponse.ts
// Pure choice logic: "given this situation, what does the npc do". No state is written here.
import { Entity } from "@rbxts/jecs";
import {
	DEFAULT_RESPONSE_WEIGHT,
	DEFAULT_RESPONSES,
	MAX_RESPONSE_WEIGHT,
} from "shared/data/npcs/stats/combatDefaults";
import { actionRange, isCapable, pickWeighted } from "shared/utils/npc/attack/combatRules";

export type Situation = {
	movement: RelativeMotion;
	action: string; // target's actionState, "parrying" when it has the Parrying tag, "" if unknown
	distance: number;
};

export type Choice = { movement: SelfMovement; action: string };

type Candidate = Choice & { weight: number };

const closesDistance = (movement: SelfMovement) =>
	movement === "advance" || movement === "advanceleft" || movement === "advanceright";

/** the most specific matching rule wins, ties go to the one listed first */
function matchRule(rules: ReactiveRule[], situation: Situation): ReactiveRule | undefined {
	let best: ReactiveRule | undefined;
	let bestScore = -1;
	for (const rule of rules) {
		const [movement, action] = rule.when;
		if (movement !== "any" && movement !== situation.movement) continue;
		const wanted: string = action;
		if (wanted !== "any" && wanted !== situation.action) continue;
		const score = (movement !== "any" ? 1 : 0) + (wanted !== "any" ? 1 : 0);
		if (score > bestScore) {
			best = rule;
			bestScore = score;
		}
	}
	return best;
}

/** turns a response into something doable right now, or undefined */
function resolve(
	e: Entity,
	weapon: NpcWeapon,
	response: ReactiveResponse,
	situation: Situation,
	now: number,
): Candidate | undefined {
	const names: string[] = [];
	for (const action of response.actions) {
		if (action === "weaponMove") {
			for (const [name] of pairs(weapon.moves)) names.push(name as string);
		} else names.push(action);
	}

	const capable = names.filter(
		(action) =>
			isCapable(e, weapon, action, now) && (action !== "shove" || situation.action === "parrying"),
	);
	const reachable = capable.filter((action) => situation.distance <= actionRange(weapon, action));
	const weight = response.weight ?? DEFAULT_RESPONSE_WEIGHT;

	if (reachable.size() > 0) {
		return { movement: response.movement, action: reachable[math.random(0, reachable.size() - 1)], weight };
	}
	// too far to attack but the response closes in: keep walking, attack on a later decision
	if (capable.size() > 0 && closesDistance(response.movement)) {
		return { movement: response.movement, action: "idle", weight };
	}
	return undefined;
}

function resolveAll(
	e: Entity,
	weapon: NpcWeapon,
	responses: ReactiveResponse[],
	situation: Situation,
	now: number,
): Candidate[] {
	const result: Candidate[] = [];
	for (const response of responses) {
		const candidate = resolve(e, weapon, response, situation, now);
		if (candidate !== undefined) result.push(candidate);
	}
	return result;
}

/**
 * Weapon rule weights are shares out of 10. Whatever they don't claim goes to the default pool.
 * weight 10 = always. weight 7 = 70% rule, 30% default. Two responses adding to 10+ = only those two.
 */
export function chooseReactiveResponse(e: Entity, weapon: NpcWeapon, situation: Situation, now: number): Choice {
	const rule = matchRule(weapon.reactive?.rules ?? [], situation);
	if (rule !== undefined) {
		const candidates = resolveAll(e, weapon, rule.responses, situation, now);
		let total = 0;
		for (const c of candidates) total += c.weight;
		if (total > 0 && math.random() * MAX_RESPONSE_WEIGHT < total) {
			return pickWeighted(candidates, (c) => c.weight)!;
		}
	}
	const fallback = resolveAll(e, weapon, DEFAULT_RESPONSES, situation, now);
	return pickWeighted(fallback, (c) => c.weight) ?? { movement: "still", action: "idle" };
}
