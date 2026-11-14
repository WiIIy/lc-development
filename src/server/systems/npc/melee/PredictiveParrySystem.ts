// -> next to ParrySystem.ts (melee/PredictiveParrySystem.ts)
//
// PREDICTIVE parrying: the npc reacts to the swings of whoever it is targeting.
//   announceThreat (attacker's swing starts) -> IncomingThreat on the npc
//   -> PredictiveParrySystem (decides once per swing) -> ParryTimeline -> ParryExecutionSystem (in ParrySystem.ts)
//
// Enabled by Components.PredictiveParrying. If an npc also has RandomParrying, predictive wins:
// RandomParrySystem excludes PredictiveParrying in its query, and the random stack chain checks for it too.
//
// Tuning (ParryProfile): reactionTime  = how long after a swing starts before the npc can respond
//                        timingError   = +/- seconds of aim error around the hit
//                        baseChance    = chance a swing it could react to is actually parried (0 = never)
//                        windowDuration= how long the window stays open
//                        range         = only swings this close are noticed
//                        recovery / successRecovery / interruptsCombo / fadeIn / stunTime work as for random
// parriesPerMinute, rollInterval, holdMin and holdMax are RANDOM only and ignored here.
// Stacking: ParryStackable still applies. Without it the npc must attack between parries.

import { OnRemove } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";
import {
	debugParry,
	fmt,
	getParryProfile,
	maxParryStreak,
	scheduleParry,
} from "shared/utils/npc/attack/parryUtils";
import { planParryWindow } from "shared/utils/npc/attack/predictiveParry";

const THREAT_GRACE = 0.25; // keep a threat around this long past its hit time

//expires threats whose hit time has passed
export const PredictiveParryHousekeepingSystem = {
	name: "PredictiveParryHousekeepingSystem",
	system: () => {
		const now = os.clock();
		for (const [e, threat] of world.query(Components.IncomingThreat)) {
			if (now > threat.hitAt + THREAT_GRACE) world.remove(e, Components.IncomingThreat);
		}
	},
};

//decides each incoming swing exactly once (Threat.handled), then hands the parry to ParryExecutionSystem.
//A threat that arrives while the npc is busy (mid-parry, recovering, stunned) is NOT decided, it waits: if the npc
//frees up before the hit lands it can still react, otherwise the threat expires. That is what makes recovery a
//real punish window.
export const PredictiveParrySystem = {
	name: "PredictiveParrySystem",
	system: () => {
		const now = os.clock();

		for (const [e, threat] of world
			.query(Components.IncomingThreat)
			.with(Components.PredictiveParrying)
			.without(Components.ParryTimeline, Components.Dead, Components.Stunned, Components.Parried)) {
			if (threat.handled) continue;
			threat.handled = true; //decided from here on, whatever the outcome

			const profile = getParryProfile(e);
			const tag = `${e} vs ${threat.moveName}`;

			if (profile.baseChance <= 0) continue; //this npc/weapon never parries

			if (!profile.interruptsCombo && (world.has(e, Components.AttackOngoing) || world.has(e, Components.QueuedAttacks))) {
				debugParry(`${tag}: mid-combo (interruptsCombo is false), no parry`);
				continue;
			}

			const streak = world.get(e, Components.ParryStreak) ?? 0;
			if (streak >= maxParryStreak(e)) {
				debugParry(`${tag}: must attack before parrying again (max ${maxParryStreak(e)} in a row)`);
				continue;
			}

			const openAt = planParryWindow(threat, profile, now);
			if (openAt === undefined) {
				debugParry(`${tag}: too slow, reactionTime ${fmt(profile.reactionTime)}s is longer than the windup`);
				continue;
			}

			const roll = math.random();
			if (roll >= profile.baseChance) {
				debugParry(`${tag}: rolled ${fmt(roll)} (needs < ${fmt(profile.baseChance)}), no parry`);
				continue;
			}

			if (!scheduleParry(e, openAt, profile, profile.windowDuration)) continue; //no blockAnim, already warned

			world.set(e, Components.ParryStreak, streak + 1);
			debugParry(
				`${tag}: window opens in ${fmt(openAt - now)}s, hit lands in ${fmt(threat.hitAt - now)}s (parry ${streak + 1} of ${maxParryStreak(e)})`,
			);
		}
	},
};

//toggled off mid-fight: forget any swing it was about to react to
world.set(Components.PredictiveParrying, OnRemove, (e) => {
	if (world.contains(e)) world.remove(e, Components.IncomingThreat);
});