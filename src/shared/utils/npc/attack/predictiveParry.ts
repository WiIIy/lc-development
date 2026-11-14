// -> shared/utils/npc/attack/predictiveParry.ts
// PREDICTIVE strategy helpers. Random parrying ignores threats completely.
// Flow: a swing starts -> announceThreat/announceSwing writes IncomingThreat on npcs targeting the attacker
//       -> PredictiveParrySystem (decide) calls planParryWindow + scheduleParry -> ParryExecutionSystem opens the window.

import { pair } from "@rbxts/jecs";
import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";
import { getParryProfile } from "./parryUtils";

const HISTORY_CAP = 12;
const FACING_DOT = 0.3; // attacker must roughly face the npc (~72 degree cone) for a swing to count as a threat

/** CALL THIS when an attacker's swing animation starts. `windup` = seconds until its "hit" marker.
 *  Always records the swing in the attacker's history. Only npcs that are TARGETING this attacker AND use
 *  predictive parrying get an IncomingThreat. */
export function announceThreat(attacker: Entity, moveName: string, windup: number): void {
	const attackerTransform = world.get(attacker, Components.Transform);
	print(attackerTransform)
	if (attackerTransform === undefined) return;

	const now = os.clock();
	const hitAt = now + windup;

	const history: AttackRecord[] = world.get(attacker, Components.AttackHistory) ?? [];
	history.push({ move: moveName, startedAt: now, hitAt });
	if (history.size() > HISTORY_CAP) history.remove(0);
	world.set(attacker, Components.AttackHistory, history);

	const attackerPos = attackerTransform.Position;
	const attackerLook = attackerTransform.LookVector;
	print(attackerPos)

	for (const [npc, transform] of world
		.query(Components.Transform)
		.with(pair(Components.Target, attacker), Components.PredictiveParrying)) {
			print("DOES THIS RUN AT ALL??,",npc)
		const profile = getParryProfile(npc);
		const toNpc = transform.Position.sub(attackerPos);
		const dist = toNpc.Magnitude;
		if (dist > profile.range) continue;
		if (dist > 0.001 && attackerLook.Dot(toNpc.Unit) < FACING_DOT) continue; // swinging somewhere else

		world.set(npc, Components.IncomingThreat, { attacker, moveName, startedAt: now, hitAt, handled: false });
	}
}

/** WHEN should a timed window open? Returns undefined if the npc can't react before the hit lands.
 *  The window is aimed at the hit but never opens before the npc has had reactionTime to notice. */
export function planParryWindow(threat: Threat, profile: ParryProfile, now: number): number | undefined {
	const earliest = math.max(now, threat.startedAt + profile.reactionTime);
	if (earliest > threat.hitAt) return undefined;

	const jitter = (math.random() * 2 - 1) * profile.timingError;
	const aimed = threat.hitAt - profile.windowDuration / 2 + jitter;
	return math.max(aimed, earliest);
}

/** convenience for npc move callbacks: reads `windup` from the move's data and announces the swing.
 *  A move with no `windup` is invisible to predictive parrying (it can't be reacted to). */
export function announceSwing(attacker: Entity, moveName: string, weaponData: NpcMeleeWeapon): void {
	const windup = weaponData.moves?.[moveName]?.windup;
	if (windup === undefined) return;
	announceThreat(attacker, moveName, windup);
}