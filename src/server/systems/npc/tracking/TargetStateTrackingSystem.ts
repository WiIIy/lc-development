//src/server/systems/npc/tracking/TargetStateTrackingSystem.ts

import { pair, Wildcard } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";

// every field of PlayerBehaviorState. If you add a field to that type, add it here too.
const STATE_KEYS = ["movementState", "environmentState", "bodyState", "speedState", "actionState"] as const;

const targetLost = world.query(Components.TargetState).without(pair(Components.Target, Wildcard)).cached();
const trackingOff = world.query(Components.TargetState).without(Components.TrackTargetActionState).cached();

// run after TargetTransformTrackingSystem (PostSimulation)
export const TargetStateTrackingSystem = {
	name: "TargetStateTrackingSystem",
	system: () => {
		for (const [e] of world.query(pair(Components.Target, Wildcard)).with(Components.TrackTargetActionState)) {
			const target = world.target(e, Components.Target);
			if (target === undefined) continue;

			const behavior = world.get(target, Components.PlayerBehavior);
			if (behavior === undefined) continue; // the client hasn't reported a state yet

			const previous = world.get(e, Components.TargetState);

			let changed = false;
			for (const key of STATE_KEYS) {
				const before = previous?.[key];
				if (before === behavior[key]) continue;

				changed = true;
				print(`target player ${key} changed from ${before ?? "none"} -> ${behavior[key]}`);
			}
			if (!changed) continue;

			// store a copy, not the player's own table
			world.set(e, Components.TargetState, {
				movementState: behavior.movementState,
				environmentState: behavior.environmentState,
				bodyState: behavior.bodyState,
				speedState: behavior.speedState,
				actionState: behavior.actionState,
			});
		}
	},
};

// run in PostUpdate next to TargetTransformCleanupSystem
export const TargetStateCleanupSystem = {
	name: "TargetStateCleanupSystem",
	system: () => {
		for (const [e] of targetLost) world.remove(e, Components.TargetState);
		for (const [e] of trackingOff) world.remove(e, Components.TargetState);
	},
};