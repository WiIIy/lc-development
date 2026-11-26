// REACTIVE: watches the target, decides one response, executes it immediately. No combos, no queue.
// Decisions are rolled on a situation change, after an action, or every DECISION_INTERVAL.
// Never per frame: that would turn a 30% chance into a certainty within a few frames.
import { Entity, OnAdd, OnRemove, pair, Wildcard } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { DECISION_INTERVAL, DEFAULT_REACTION_TIME } from "shared/data/npcs/stats/combatDefaults";
import { getNpcWeapon } from "shared/utils/npc/attack/getNpcWeapon";
import { flatDistance, isFree } from "shared/utils/npc/attack/combatRules";
import { chooseReactiveResponse } from "./chooseReactiveResponse";

const combatOff = world.query(Components.ReactiveDecision).without(Components.MeleeAttacks).cached();
const lostTarget = world.query(Components.ReactiveDecision).without(pair(Components.Target, Wildcard)).cached();
const disengaged = world.query(Components.ReactiveDecision).without(Components.CloseQuarters).cached();

function forget(e: Entity) {
	world.remove(e, Components.ReactiveDecision);
	world.remove(e, Components.ReactiveMovement);
}

function reactionTime(weapon: NpcWeapon, action: string): number {
	if (action === "parrying" && weapon.shoveBehavior) return weapon.shoveBehavior.reactionTime;
	return weapon.parryBehavior?.reactionTime ?? DEFAULT_REACTION_TIME;
}

export const ReactiveBrainSystem = {
	name: "ReactiveBrainSystem",
	system: () => {
		const now = os.clock();
		for (const [e] of combatOff) forget(e);
		for (const [e] of lostTarget) forget(e);
		for (const [e] of disengaged) forget(e);

		// CloseQuarters (set by ReactiveMovementSystem) = engaged. Until then pathfinding approaches
		for (const [e, transform, targetTransform] of world
			.query(Components.Transform, Components.TargetTransform)
			.with(Components.Reactive, Components.CloseQuarters, Components.MeleeAttacks, pair(Components.Target, Wildcard))) {
			const weapon = getNpcWeapon(e);
			const target = world.target(e, Components.Target);
			if (weapon === undefined || target === undefined) continue;

			const movement = world.get(e, Components.TargetRelativeState)?.motion ?? "still";
			// the Parrying tag is authoritative, otherwise use the tracked action state
			const action: string = world.has(target, Components.Parrying)
				? "parrying"
				: (world.get(e, Components.TargetState)?.actionState ?? "");
			const key = `${movement}|${action}`;

			let memory = world.get(e, Components.ReactiveDecision);
			if (memory === undefined || memory.weaponId !== weapon.id) {
				memory = {
					weaponId: weapon.id,
					seenKey: key,
					seenSince: now,
					decidedKey: "",
					decideAgainAt: 0,
					wasActing: false,
				};
				world.set(e, Components.ReactiveDecision, memory);
			}
			if (memory.seenKey !== key) {
				memory.seenKey = key;
				memory.seenSince = now;
			}

			if (world.has(e, Components.Attacking)) {
				memory.wasActing = true; // committed. Movement keeps following the last decision
				continue;
			}
			if (memory.wasActing) {
				memory.wasActing = false;
				memory.decideAgainAt = 0;
			}

			if (!isFree(e, now)) continue;
			if (now - memory.seenSince < reactionTime(weapon, action)) continue; // not perceived yet
			if (memory.decidedKey === key && now < memory.decideAgainAt) continue;

			const choice = chooseReactiveResponse(
				e,
				weapon,
				{ movement, action, distance: flatDistance(transform.Position, targetTransform.Position) },
				now,
			);
			memory.decidedKey = key;
			memory.decideAgainAt = now + DECISION_INTERVAL[0] + math.random() * (DECISION_INTERVAL[1] - DECISION_INTERVAL[0]);

			world.set(e, Components.ReactiveMovement, choice.movement);
			if (choice.action !== "idle") world.set(e, Components.ActionRequest, { action: choice.action });
		}
	},
};

// the tag pulls in the trackers it needs, and takes back only the ones it added
world.set(Components.Reactive, OnAdd, (e: Entity) => {
	const grants = {
		relative: !world.has(e, Components.TrackTargetRelativeState),
		action: !world.has(e, Components.TrackTargetActionState),
	};
	world.set(e, Components.ReactiveGrants, grants);
	if (grants.relative) world.add(e, Components.TrackTargetRelativeState);
	if (grants.action) world.add(e, Components.TrackTargetActionState);
});

world.set(Components.Reactive, OnRemove, (e: Entity) => {
	if (!world.contains(e)) return;
	const grants = world.get(e, Components.ReactiveGrants);
	if (grants?.relative) world.remove(e, Components.TrackTargetRelativeState);
	if (grants?.action) world.remove(e, Components.TrackTargetActionState);
	world.remove(e, Components.ReactiveGrants);
	world.remove(e, Components.CloseQuarters); // hook in ReactiveMovementSystem stops the walk
	forget(e);
});
