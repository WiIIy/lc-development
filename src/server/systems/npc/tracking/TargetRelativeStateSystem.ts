//src/server/systems/npc/tracking/TargetRelativeStateSystem.ts

// Enabled by Components.TrackTargetRelativeState (tag).
// Describes how the TARGETED player moves relative to THIS npc, so the npc can tell whether the player is coming
// for it. Uses Transform (positions) and Basepart (velocity) of both the npc and the player. Orientation is ignored.
//
// The label comes from the PLAYER's own velocity (intent). It does not count the npc's own walking: an npc that
// walks up to a standing player does not make that player "advancing". closureSpeed does include the npc's motion
// (the true rate the gap is shrinking) for later use, e.g. time until the player is in reach.
//
// Needs in components.ts:
//   static TrackTargetRelativeState = world.entity(); // tag
//   static TargetRelativeState = component<TargetRelativeState>();
// Needs in the global d.ts:
//   type RelativeMotion = "advancing" | "retreating" | "strafingright" | "strafingleft" | "still";
//   type TargetRelativeState = {
//   	motion: RelativeMotion;
//   	distance: number; // studs, flat (XZ)
//   	approachSpeed: number; // studs/s, + = the player moves toward the npc, - = away
//   	sideSpeed: number; // studs/s, + = toward the npc's right, - = toward its left (the npc's point of view)
//   	closureSpeed: number; // studs/s, + = the gap is shrinking (counts both bodies' motion)
//   };

import { pair, Wildcard } from "@rbxts/jecs";
import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components";

const SMOOTH_TIME = 0.12; // seconds. Higher = steadier labels, slower reactions
const MIN_DISTANCE = 0.5; // closer than this the npc-to-player axis is meaningless
const STILL_ENTER = 1.2; // studs/s: slower than this counts as standing still
const STILL_EXIT = 1.8; // studs/s: must exceed this to stop being "still" (hysteresis)
// share of the player's speed that points along the npc-player line, as cos(angle to that line)
const ENTER_FRACTION = math.cos(math.rad(65)); // within ~65 degrees of the line = advancing/retreating, so a diagonal run still counts
const KEEP_FRACTION = math.cos(math.rad(80)); // once advancing/retreating, stays until the angle passes ~80 degrees

const targetLost = world.query(Components.TargetRelativeState).without(pair(Components.Target, Wildcard)).cached();
const trackingOff = world.query(Components.TargetRelativeState).without(Components.TrackTargetRelativeState).cached();

const flat = (v: Vector3) => new Vector3(v.X, 0, v.Z);

function classify(current: RelativeMotion | undefined, approach: number, side: number): RelativeMotion {
	const speed = math.sqrt(approach * approach + side * side);
	if (speed < (current === "still" ? STILL_EXIT : STILL_ENTER)) return "still";

	const toward = approach / speed; // 1 = straight at the npc, -1 = straight away, 0 = pure sidestep

	if (toward >= (current === "advancing" ? KEEP_FRACTION : ENTER_FRACTION)) return "advancing";
	if (-toward >= (current === "retreating" ? KEEP_FRACTION : ENTER_FRACTION)) return "retreating";
	return side >= 0 ? "strafingright" : "strafingleft";
}

// run in PostSimulation after TransformSystem and TargetTransformTrackingSystem
export const TargetRelativeStateSystem = {
	name: "TargetRelativeStateSystem",
	system: () => {
		const alpha = 1 - math.exp(-scheduler.getDeltaTime() / SMOOTH_TIME);

		for (const [e, transform, root] of world
			.query(Components.Transform, Components.Basepart)
			.with(Components.TrackTargetRelativeState, pair(Components.Target, Wildcard))) {
			const target = world.target(e, Components.Target);
			if (target === undefined) continue;

			const targetTransform = world.get(target, Components.Transform);
			const targetRoot = world.get(target, Components.Basepart);
			if (targetTransform === undefined || targetRoot === undefined) continue;

			const offset = flat(targetTransform.Position.sub(transform.Position));
			const distance = offset.Magnitude;
			if (distance < MIN_DISTANCE) continue;

			const axis = offset.div(distance); // npc -> player
			const rightOfNpc = axis.Cross(Vector3.yAxis); // the npc's right while it faces the player
			const playerVelocity = flat(targetRoot.AssemblyLinearVelocity);
			const npcVelocity = flat(root.AssemblyLinearVelocity);

			const approach = -playerVelocity.Dot(axis);
			const side = playerVelocity.Dot(rightOfNpc);
			const closure = -playerVelocity.sub(npcVelocity).Dot(axis);

			const state = world.get(e, Components.TargetRelativeState);
			if (state === undefined) {
				const motion = classify(undefined, approach, side);
				print(`target player relative motion changed from none -> ${motion}`);
				world.set(e, Components.TargetRelativeState, {
					motion,
					distance,
					approachSpeed: approach,
					sideSpeed: side,
					closureSpeed: closure,
				});
				continue;
			}

			// smooth in place, so one noisy frame can't flip the label
			state.distance = distance;
			state.approachSpeed += (approach - state.approachSpeed) * alpha;
			state.sideSpeed += (side - state.sideSpeed) * alpha;
			state.closureSpeed += (closure - state.closureSpeed) * alpha;

			const motion = classify(state.motion, state.approachSpeed, state.sideSpeed);
			if (motion !== state.motion) {
				print(`target player relative motion changed from ${state.motion} -> ${motion}`);
				state.motion = motion;
			}
		}
	},
};

// run in PostUpdate next to the other cleanup systems
export const TargetRelativeStateCleanupSystem = {
	name: "TargetRelativeStateCleanupSystem",
	system: () => {
		for (const [e] of targetLost) world.remove(e, Components.TargetRelativeState);
		for (const [e] of trackingOff) world.remove(e, Components.TargetRelativeState);
	},
};