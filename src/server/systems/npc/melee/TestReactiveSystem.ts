//src/server/systems/npc/melee/TestReactiveSystem.ts

import { OnAdd, OnRemove, pair, Wildcard } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";

const CQC_ENTER = 8; // studs: inside this the test behavior takes over movement
const CQC_EXIT = 10; // studs: beyond this it hands movement back to pathfinding (hysteresis so it doesn't flap)
const MIN_GAP = 4; // studs: when advancing, never close in past this
const STEP = 4; // studs: how far ahead of itself the npc aims its MoveTo each frame
// -1 = npc strafes to the OPPOSITE side (they circle each other, a duel). 1 = SAME side (npc slides parallel)
const STRAFE_RESPONSE = -1;

const flat = (v: Vector3) => new Vector3(v.X, 0, v.Z);

const targetLost = world
	.query(Components.CloseQuarters)
	.with(Components.TestReactive)
	.without(pair(Components.Target, Wildcard))
	.cached();

// undefined = stand still
function chooseDirection(
	motion: RelativeMotion,
	distance: number,
	axis: Vector3,
	rightOfNpc: Vector3,
): Vector3 | undefined {
	if (motion === "advancing") return axis.mul(-1); // backtrack: away from the player
	if (motion === "retreating") return distance > MIN_GAP ? axis : undefined; // advance: toward the player
	if (motion === "strafingright") return rightOfNpc.mul(STRAFE_RESPONSE);
	if (motion === "strafingleft") return rightOfNpc.mul(-STRAFE_RESPONSE);
	return undefined; // still
}

export const TestReactiveSystem = {
	name: "TestReactiveSystem",
	system: () => {
		for (const [e, transform, targetTransform, relative, humanoid] of world
			.query(
				Components.Transform,
				Components.TargetTransform,
				Components.TargetRelativeState,
				Components.Humanoid,
			)
			.with(Components.TestReactive, pair(Components.Target, Wildcard))) {
			// engage / release with hysteresis
			if (!world.has(e, Components.CloseQuarters)) {
				if (relative.distance > CQC_ENTER) continue;
				world.add(e, Components.CloseQuarters);
				world.remove(e, Components.PathGoal); // PathGoalClearSystem drops the old path, pursuit is excluded while engaged
			} else if (relative.distance > CQC_EXIT) {
				world.remove(e, Components.CloseQuarters); // the hook stops it, pursuit takes over again
				continue;
			}

			const pos = transform.Position;
			if (world.has(e, Components.Dead) || world.has(e, Components.Stunned) || world.has(e, Components.Parried)) {
				humanoid.MoveTo(pos);
				continue;
			}

			const offset = flat(targetTransform.Position.sub(pos));
			if (offset.Magnitude < 0.01) continue;
			const axis = offset.Unit; // npc -> player
			const rightOfNpc = axis.Cross(Vector3.yAxis); // npc's right while it faces the player

			const direction = chooseDirection(relative.motion, relative.distance, axis, rightOfNpc);
			// MoveTo every frame (the same primitive the path follower uses), so there is no Move/MoveTo conflict
			humanoid.MoveTo(direction === undefined ? pos : pos.add(direction.mul(STEP)));
		}
	},
};

// the npc lost its target while engaged: release it (the hook below stops the walk)
export const TestReactiveCleanupSystem = {
	name: "TestReactiveCleanupSystem",
	system: () => {
		for (const [e] of targetLost) world.remove(e, Components.CloseQuarters);
	},
};

// the test needs the relative tracker, so adding the tag adds it
world.set(Components.TestReactive, OnAdd, (e) => {
	world.add(e, Components.TrackTargetRelativeState);
});

// tag removed: give movement back
world.set(Components.TestReactive, OnRemove, (e) => {
	if (world.contains(e)) world.remove(e, Components.CloseQuarters);
});

// however engagement ends, stop the npc where it stands
world.set(Components.CloseQuarters, OnRemove, (e) => {
	if (!world.contains(e)) return;
	const root = world.get(e, Components.Basepart);
	const humanoid = world.get(e, Components.Humanoid);
	if (root && humanoid) humanoid.MoveTo(root.Position);
});
