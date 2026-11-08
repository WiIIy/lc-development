import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components/components";
import { OnAdd, OnRemove } from "@rbxts/replecs/out/jecs";

const DEADZONE = math.rad(1); // body ignores target within this angle
const TURN_RATE = 24; // exponential smoothing per second, higher = snappier
const MAX_TURN_SPEED = math.rad(540); // hard cap, rad/s

const yawOf = (cf: CFrame) => math.atan2(-cf.LookVector.X, -cf.LookVector.Z);
const ROOT_C0 = new CFrame(0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);

// wrap to [-pi, pi] so it never takes the long way around
const wrapAngle = (a: number) => math.atan2(math.sin(a), math.cos(a));

export const BodyTrackingSystem = {
	name: "BodyTrackingSystem",
	system: () => {
		const dt = scheduler.getDeltaTime();
		const alpha = 1 - math.exp(-TURN_RATE * dt); // same feel at any framerate

		for (const [e, root, joint, tt] of world
			.query(Components.Basepart, Components.RootJoint, Components.TargetTransform)
			.with(Components.Tracking, Components.BodyTracking)) {
			const Local = root.CFrame.VectorToObjectSpace(tt.Position.sub(root.Position));
			const flat = new Vector3(Local.X, 0, Local.Z);
			if (flat.Magnitude < 0.05) continue;

			const yaw = math.atan2(-flat.X, -flat.Z); // relative to the root, so no wrap logic needed
			const goal = ROOT_C0.mul(CFrame.Angles(0, 0, yaw)); // RootJoint's C0 basis is rotated like the neck's, so yaw is on Z. Flip the sign if it turns the wrong way
			joint.C0 = joint.C0.Lerp(goal, alpha);
		}
	},
};

world.set(Components.BodyTracking, OnAdd, (e) => {
	const humanoid = world.get(e, Components.Humanoid);
	if (humanoid) humanoid.AutoRotate = false; // we own facing now
});

world.set(Components.BodyTracking, OnRemove, (e) => {
	const humanoid = world.get(e, Components.Humanoid);
	if (humanoid) humanoid.AutoRotate = true;
});
