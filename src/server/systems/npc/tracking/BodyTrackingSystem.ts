import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components/components";
import { OnRemove } from "@rbxts/replecs/out/jecs";
import { ref } from "@willy/jecs-utils";

const DEADZONE = math.rad(15); // body ignores target within this angle
const TURN_GAIN = 6; // rad/s of turn per rad of excess angle
const MAX_TURN_SPEED = math.rad(240); // hard cap, rad/s

const yawOf = (cf: CFrame) => math.atan2(-cf.LookVector.X, -cf.LookVector.Z);

// wrap to [-pi, pi] so it never takes the long way around
const wrapAngle = (a: number) => math.atan2(math.sin(a), math.cos(a));

export const BodyTrackingSystem = {
	name: "BodyTrackingSystem",
	system: () => {
		const dt = scheduler.getDeltaTime();

		for (const [e, rootPart, selfTransform, targetTransform] of world
			.query(Components.Basepart, Components.Transform, Components.TargetTransform)
			.with(Components.Tracking, Components.BodyTracking)) {
			const pos = rootPart.Position;
			const toTarget = targetTransform.Position.sub(pos);
			const flat = new Vector3(toTarget.X, 0, toTarget.Z);
			if (flat.Magnitude < 0.05) continue; // directly above/below, yaw undefined

			const currentYaw = yawOf(rootPart.CFrame);
			const desiredYaw = math.atan2(-flat.X, -flat.Z);
			const delta = wrapAngle(desiredYaw - currentYaw);

			const excess = math.max(0, math.abs(delta) - DEADZONE);
			const speed = math.min(excess * TURN_GAIN, MAX_TURN_SPEED);
			const step = math.sign(delta) * math.min(speed * dt, math.abs(delta));

			// yaw-only rebuild = upright, no tilt carried over
			const newCf = new CFrame(pos).mul(CFrame.Angles(0, currentYaw + step, 0));
			rootPart.CFrame = newCf;
			world.set(e, Components.Transform, newCf); // so SightTracking sees the new facing this frame
		}
	},
};

//reset root cf
world.set(Components.BodyTracking, OnRemove, (e) => {
	const root = world.get(e, Components.Basepart);
	if (!root || !root.Parent) return; // instance already destroyed

	// Upright at the current facing: keeps yaw, drops any pitch/roll
	const upright = new CFrame(root.Position).mul(CFrame.Angles(0, yawOf(root.CFrame), 0));
	root.CFrame = upright;

	if (world.contains(e)) world.set(e, Components.Transform, upright);
});
