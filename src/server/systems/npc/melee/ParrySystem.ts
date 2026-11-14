// -> next to your attack systems (melee/ParrySystem.ts)
//
// RANDOM parrying: an npc that HAS A TARGET rolls every rollInterval seconds while idle.
//   RandomParrySystem -> ParryTimeline -> ParryExecutionSystem
// It never looks at what the player is doing.
//
// Control board tags:  RandomParrying  = can parry at all
//                      ParryStackable  = may parry twice in a row before it must attack (default: once)
//
// State components: ParryTimeline (busy), Parrying (window open), ParryCooldown (roll gate, then spacing),
//                   ParryStreak (parries since last attack, reset when AttackOngoing is added)

import { Entity, OnAdd, OnRemove, pair, Wildcard } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";
import {
	DEBUG_PARRY,
	cancelAttack,
	debugParry,
	fmt,
	getParryAnimation,
	getParryProfile,
	maxParryStreak,
	playParryPose,
	startRandomParry,
	stopParryPose,
} from "shared/utils/npc/attack/parryUtils";

const DIAGNOSTIC_INTERVAL = 2; // seconds between "why isn't it parrying" prints
let lastDiagnostic = 0;

//expires finished cooldowns / roll gates (random strategy only; predictive threat expiry lives in PredictiveParrySystem.ts)
export const ParryHousekeepingSystem = {
	name: "ParryHousekeepingSystem",
	system: () => {
		const now = os.clock();

		for (const [e, readyAt] of world.query(Components.ParryCooldown)) {
			if (now >= readyAt) world.remove(e, Components.ParryCooldown);
		}
	},
};

//debug only: lists every RandomParrying npc and which gate is currently stopping it from rolling.
//keep in sync with the gates in RandomParrySystem
function explainIdle(now: number): void {
	if (!DEBUG_PARRY || now - lastDiagnostic < DIAGNOSTIC_INTERVAL) return;
	lastDiagnostic = now;

	for (const [e] of world.query(Components.RandomParrying).without(Components.PredictiveParrying)) {
		const why: string[] = [];
		const profile = getParryProfile(e);
		const transform = world.get(e, Components.Transform);
		const targetTransform = world.get(e, Components.TargetTransform);

		if (world.target(e, Components.Target) === undefined) why.push("no target");
		if (targetTransform === undefined) why.push("no TargetTransform");
		if (transform !== undefined && targetTransform !== undefined) {
			const dist = transform.Position.sub(targetTransform.Position).Magnitude;
			if (dist > profile.range) why.push(`target out of range (${fmt(dist)} > ${profile.range})`);
		}
		if (world.has(e, Components.ParryTimeline)) why.push("mid-parry");
		const readyAt = world.get(e, Components.ParryCooldown);
		if (readyAt !== undefined) why.push(`waiting ${fmt(readyAt - now)}s before the next roll`);
		if (profile.parriesPerMinute <= 0) why.push("parriesPerMinute is 0");
		if (!profile.interruptsCombo && (world.has(e, Components.AttackOngoing) || world.has(e, Components.QueuedAttacks))) {
			why.push("mid-combo (interruptsCombo is false)");
		}
		if ((world.get(e, Components.ParryStreak) ?? 0) >= maxParryStreak(e)) {
			why.push(`must attack before parrying again (max ${maxParryStreak(e)} in a row)`);
		}
		if (world.has(e, Components.Dead) || world.has(e, Components.Stunned) || world.has(e, Components.Parried)) {
			why.push("dead/stunned/parried");
		}
		if (getParryAnimation(e) === undefined) why.push("weapon has no blockAnim");

		debugParry(`${e} ${why.size() > 0 ? "blocked by: " + why.join(", ") : "ready to roll"}`);
	}
}

//An idle npc with a target rolls once per rollInterval. A successful roll holds the parry for a random
//holdMin..holdMax seconds and blocks the next roll for one spacing period (60 / parriesPerMinute, +/-25%).
//Without ParryStackable the npc must attack once after each parry. With it, it may parry twice first.
//With interruptsCombo = false (default) it never parries while a combo is running.
export const RandomParrySystem = {
	name: "RandomParrySystem",
	system: () => {
		const now = os.clock();
		explainIdle(now);

		for (const [e, transform, targetTransform] of world
			.query(Components.Transform, Components.TargetTransform)
			.with(Components.RandomParrying, pair(Components.Target, Wildcard)) //only npcs that are targeting someone
			.without(
				Components.PredictiveParrying, //predictive owns the decision when present
				Components.ParryTimeline, //already parrying / recovering
				Components.ParryCooldown, //spacing after a parry, or the wait between rolls
				Components.Dead,
				Components.Stunned,
				Components.Parried,
			)) {
			const profile = getParryProfile(e);

			if (profile.parriesPerMinute <= 0) continue; //this weapon never parries
			if (!profile.interruptsCombo && (world.has(e, Components.AttackOngoing) || world.has(e, Components.QueuedAttacks))) {
				continue;
			}
			//parrying someone across the map looks silly
			if (transform.Position.sub(targetTransform.Position).Magnitude > profile.range) continue;
			if ((world.get(e, Components.ParryStreak) ?? 0) >= maxParryStreak(e)) continue;

			//a failed roll waits rollInterval. ParryCooldown doubles as the roll gate
			world.set(e, Components.ParryCooldown, now + profile.rollInterval);
			const roll = math.random();
			if (roll >= profile.baseChance) {
				debugParry(`${e} rolled ${fmt(roll)} (needs < ${fmt(profile.baseChance)}): no parry`);
				continue;
			}

			//on success this overwrites the roll gate with the longer spacing cooldown
			startRandomParry(e, now, profile);
		}
	},
};

//ParryStackable: when a parry's recovery ends, maybe go straight into a second one. This has to be decided here
//(before AttackSystem gets a turn), otherwise the npc always starts an attack in the gap and the streak resets.
function tryChain(e: Entity, now: number, profile: ParryProfile): boolean {
	if (!world.has(e, Components.ParryStackable)) return false;
	if (!world.has(e, Components.RandomParrying)) return false;
	if (world.has(e, Components.PredictiveParrying)) return false; //predictive has priority, it never chains blindly
	if ((world.get(e, Components.ParryStreak) ?? 0) >= maxParryStreak(e)) return false;
	if (world.has(e, Components.Dead) || world.has(e, Components.Stunned) || world.has(e, Components.Parried)) return false;
	if (world.target(e, Components.Target) === undefined) return false;

	const transform = world.get(e, Components.Transform);
	const targetTransform = world.get(e, Components.TargetTransform);
	if (transform === undefined || targetTransform === undefined) return false;
	if (transform.Position.sub(targetTransform.Position).Magnitude > profile.range) return false;

	if (math.random() >= profile.baseChance) return false;
	return startRandomParry(e, now, profile); //replaces the timeline with a fresh "scheduled" one
}

//walks every parry through scheduled -> active -> recovery -> (maybe chain) -> done. Strategy-agnostic.
export const ParryExecutionSystem = {
	name: "ParryExecutionSystem",
	system: () => {
		const now = os.clock();

		for (const [e, timeline] of world.query(Components.ParryTimeline)) {
			if (world.has(e, Components.Dead)) {
				stopParryPose(e, timeline.profile.fadeOut); //a looped pose never stops by itself
				world.remove(e, Components.ParryTimeline); //hook clears Parrying
				continue;
			}
			if (now < timeline.phaseEnds) continue;
			const profile = timeline.profile;

			if (timeline.phase === "scheduled") {
				//the window opens: drop whatever we were doing (this is the mid-combo break)
				cancelAttack(e);

				//the pose is the visible parry: single looped frame, fades in, held until stopParryPose
				const animationId = getParryAnimation(e);
				if (animationId !== undefined) playParryPose(e, animationId, profile.fadeIn);

				world.add(e, Components.Parrying); //the on state registerMeleeHit / player hits check
				timeline.phase = "active";
				timeline.phaseEnds = now + timeline.windowDuration;
				debugParry(`${e} parry window open for ${fmt(timeline.windowDuration)}s`);
			} else if (timeline.phase === "active") {
				//hold ran out without catching a hit (a catch goes through resolveParry instead): pay the full recovery
				world.remove(e, Components.Parrying);
				stopParryPose(e, profile.fadeOut); //dropping the pose is the visual cue that the npc is open again
				timeline.phase = "recovery";
				timeline.phaseEnds = now + profile.recovery;
				debugParry(`${e} parry ended, recovering for ${fmt(profile.recovery)}s`);
			} else {
				//recovery over: chain a second parry if allowed, otherwise attacks are allowed again
				if (!tryChain(e, now, profile)) world.remove(e, Components.ParryTimeline);
			}
		}
	},
};

//attacking is what lets an npc parry again: any new move resets the in-a-row counter
world.set(Components.AttackOngoing, OnAdd, (e) => {
	world.remove(e, Components.ParryStreak);
});

//if anything yanks the timeline out from under us (death, cleanup), never leave the npc stuck in the on state
world.set(Components.ParryTimeline, OnRemove, (e) => {
	if (!world.contains(e)) return;
	const timeline = world.get(e, Components.ParryTimeline);
	stopParryPose(e, timeline !== undefined ? timeline.profile.fadeOut : 0.1); //best effort, depends on when jecs fires the hook
	world.remove(e, Components.Parrying);
});