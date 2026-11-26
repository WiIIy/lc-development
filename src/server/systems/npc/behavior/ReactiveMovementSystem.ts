// Replaces TestReactiveSystem. Owns engage/release and turns the brain's SelfMovement into MoveTo.
// Directions are relative to where the npc faces, so give reactive npcs Tracking + BodyTracking.
import { Entity, OnRemove, pair, Wildcard } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { DEFAULT_ENGAGE_RANGE, DEFAULT_RELEASE_RANGE } from "shared/data/npcs/stats/combatDefaults";
import { getNpcWeapon } from "shared/utils/npc/attack/getNpcWeapon";
import { flatDistance } from "shared/utils/npc/attack/combatRules";

const MIN_GAP = 4; // never advance closer than this
const STEP = 4; // studs ahead to aim MoveTo

// [forward, right]
const DIRECTIONS: Record<SelfMovement, [number, number]> = {
	still: [0, 0],
	advance: [1, 0],
	backtrack: [-1, 0],
	straferight: [0, 1],
	strafeleft: [0, -1],
	advanceright: [1, 1],
	advanceleft: [1, -1],
	backtrackright: [-1, 1],
	backtrackleft: [-1, -1],
};

const lostTarget = world
	.query(Components.CloseQuarters)
	.with(Components.Reactive)
	.without(pair(Components.Target, Wildcard))
	.cached();
const combatOff = world
	.query(Components.CloseQuarters)
	.with(Components.Reactive)
	.without(Components.MeleeAttacks)
	.cached();

export const ReactiveMovementSystem = {
	name: "ReactiveMovementSystem",
	system: () => {
		for (const [e] of lostTarget) world.remove(e, Components.CloseQuarters);
		for (const [e] of combatOff) world.remove(e, Components.CloseQuarters);

		for (const [e, transform, targetTransform, humanoid] of world
			.query(Components.Transform, Components.TargetTransform, Components.Humanoid)
			.with(Components.Reactive, Components.MeleeAttacks, pair(Components.Target, Wildcard))) {
			const behavior = getNpcWeapon(e)?.reactive;
			const position = transform.Position;
			const distance = flatDistance(position, targetTransform.Position);

			if (!world.has(e, Components.CloseQuarters)) {
				if (distance > (behavior?.engageRange ?? DEFAULT_ENGAGE_RANGE)) continue;
				world.add(e, Components.CloseQuarters); // PursuitGoalSystem already excludes this tag
				world.remove(e, Components.PathGoal);
			} else if (distance > (behavior?.releaseRange ?? DEFAULT_RELEASE_RANGE)) {
				world.remove(e, Components.CloseQuarters);
				continue;
			}

			let movement: SelfMovement = world.get(e, Components.ReactiveMovement) ?? "still";
			if (world.has(e, Components.Dead) || world.has(e, Components.Stunned) || world.has(e, Components.Parried)) {
				movement = "still";
			}

			let [forwardAmount, rightAmount] = DIRECTIONS[movement];
			if (forwardAmount > 0 && distance <= MIN_GAP) forwardAmount = 0;

			const look = transform.LookVector;
			const flatLook = new Vector3(look.X, 0, look.Z);
			if (flatLook.Magnitude < 0.01) continue;
			const forward = flatLook.Unit;
			const right = forward.Cross(Vector3.yAxis);
			const direction = forward.mul(forwardAmount).add(right.mul(rightAmount));

			humanoid.MoveTo(
				direction.Magnitude < 0.01 ? position : position.add(direction.Unit.mul(STEP)),
			);
		}
	},
};

world.set(Components.CloseQuarters, OnRemove, (e: Entity) => {
	if (!world.contains(e)) return;
	const root = world.get(e, Components.Basepart);
	const humanoid = world.get(e, Components.Humanoid);
	if (root && humanoid) humanoid.MoveTo(root.Position);
});
