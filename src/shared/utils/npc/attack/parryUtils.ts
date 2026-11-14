// -> shared/utils/npc/attack/parryUtils.ts
// Shared parry mechanics used by every strategy (random now, predictive later).
// Types (ParryProfile, ParryTimeline...) are global, tuning data is in ./parryConfig.

import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";
import { getWeaponData } from "shared/utils/npc/attack/getWeaponData";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { DEFAULT_PARRY_PROFILE } from "./parryConfig";

export const DEBUG_PARRY = true; // prints decisions and (every 2s) why an idle npc is NOT parrying
export function debugParry(message: string): void {
	if (DEBUG_PARRY) print(`[parry] ${message}`);
}
export const fmt = (n: number) => string.format("%.2f", n);

const PARRY_ANIM = "parry"; // AnimationUtils type name: loadAnim starts the looped pose, stopAnim(model, PARRY_ANIM) ends it

//the pose is what telegraphs a parry to the player. With no blockAnim an npc would parry invisibly, which is
//unfair, so by default an npc whose weapon has no blockAnim never parries. Set false while prototyping.
const REQUIRE_PARRY_ANIMATION = true;
const warnedMissingPose = new Set<Entity>();

function getModel(e: Entity): Model | undefined {
	const parent = world.get(e, Components.Basepart)?.Parent;
	return parent !== undefined && parent.IsA("Model") ? parent : undefined;
}

/** resolution order (later wins): defaults < weapon data `parry` < the entity's own ParryConfig. */
export function getParryProfile(e: Entity): ParryProfile {
	const weaponParry = getWeaponData(e)?.parry;
	const own = world.get(e, Components.ParryConfig);
	return { ...DEFAULT_PARRY_PROFILE, ...(weaponParry ?? {}), ...(own ?? {}) };
}

/** the parry pose belongs to the equipped weapon (weapon data `blockAnim`). Single frame, played looped. */
export function getParryAnimation(e: Entity): string | undefined {
	return getWeaponData(e)?.blockAnim;
}

/** starts the looped pose with a fade-in. It keeps playing until stopParryPose is called */
export function playParryPose(e: Entity, animationId: string, fadeIn: number): void {
	const model = getModel(e);
	if (model === undefined) return;
	AnimationUtils.loadAnim(model, PARRY_ANIM, animationId, fadeIn, true);
}

export function stopParryPose(e: Entity, fadeOut: number): void {
	const model = getModel(e);
	if (model === undefined) return;
	AnimationUtils.stopAnim(model, PARRY_ANIM, undefined, fadeOut);
}

/** how many parries an npc may chain before it must attack. Tag present = 2, absent = 1. No data stored. */
export function maxParryStreak(e: Entity): number {
	return world.has(e, Components.ParryStackable) ? 2 : 1;
}

/** every strategy ends up here. ParryExecutionSystem does the rest.
 *  `windowDuration` = how long the Parrying tag stays on once the window opens.
 *  Returns false when the parry could not be scheduled (no blockAnim on the equipped weapon). */
export function scheduleParry(e: Entity, openAt: number, profile: ParryProfile, windowDuration: number): boolean {
	if (getParryAnimation(e) === undefined && REQUIRE_PARRY_ANIMATION) {
		if (!warnedMissingPose.has(e)) {
			warnedMissingPose.add(e);
			warn(`parry skipped: entity ${e} has no blockAnim on its equipped weapon`);
		}
		return false;
	}

	world.set(e, Components.ParryTimeline, {
		phase: "scheduled",
		phaseEnds: openAt,
		profile,
		windowDuration,
	});
	return true;
}

/** RANDOM strategy: picks a hold time, schedules the parry, sets the spacing cooldown and bumps the streak.
 *  Used both by the roll in RandomParrySystem and by the stack chain at the end of recovery. */
export function startRandomParry(e: Entity, now: number, profile: ParryProfile): boolean {
	const hold = profile.holdMin + math.random() * (profile.holdMax - profile.holdMin);
	if (!scheduleParry(e, now, profile, hold)) return false;

	//spacing: no new roll until one average period has passed, measured from when this parry STARTED,
	//with +/-25% jitter so it is not a metronome
	const period = (60 / profile.parriesPerMinute) * (0.75 + math.random() * 0.5);
	world.set(e, Components.ParryCooldown, now + period);

	const streak = (world.get(e, Components.ParryStreak) ?? 0) + 1;
	world.set(e, Components.ParryStreak, streak);
	debugParry(
		`${e} parrying for ${fmt(hold)}s (parry ${streak} of ${maxParryStreak(e)} before it must attack, next roll in ${fmt(period)}s)`,
	);
	return true;
}

/** breaks off whatever attack/combo the npc is doing. Order matters: QueuedAttacks first so AttackOngoing's
 *  OnRemove hook doesn't re-add it (same rule as loseTarget). Removing QueuedAttacks starts MovesetDelay. */
export function cancelAttack(e: Entity): void {
	world.remove(e, Components.QueuedAttacks);
	world.remove(e, Components.ExecuteAttack);
	world.remove(e, Components.AttackOngoing);

	const track = world.get(e, Components.AttackTrack);
	if (track !== undefined) {
		track.Stop(); //otherwise the "hit" marker still fires and the swing lands through the parry
		world.remove(e, Components.AttackTrack);
	}
}

/** CALL THIS wherever an attacker's hit lands on a defender that has the Parrying tag.
 *  Returns true if the hit was parried (caller should then skip damage). A caught hit ends the hold early. */
export function resolveParry(defender: Entity, attacker: Entity): boolean {
	const timeline = world.get(defender, Components.ParryTimeline);
	if (timeline === undefined || timeline.phase !== "active") return false;

	world.remove(defender, Components.Parrying);
	stopParryPose(defender, timeline.profile.fadeOut);
	//success skips the long whiff recovery
	timeline.phase = "recovery";
	timeline.phaseEnds = os.clock() + timeline.profile.successRecovery;

	world.add(attacker, Components.Parried);
	task.delay(timeline.profile.stunTime, () => {
		if (world.contains(attacker)) world.remove(attacker, Components.Parried);
	});
	return true;
}