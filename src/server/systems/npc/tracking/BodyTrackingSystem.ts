import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components/components";
import { OnAdd, OnRemove } from "@rbxts/replecs/out/jecs";
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
		for (const [e, rootPart, align, targetTransform] of world
			.query(Components.Basepart, Components.BodyAligner, Components.TargetTransform)
			.with(Components.Tracking, Components.BodyTracking)) {
			// physics moved the body, so keep Transform in sync for SightTracking
			world.set(e, Components.Transform, rootPart.CFrame);

			const toTarget = targetTransform.Position.sub(rootPart.Position);
			const flat = new Vector3(toTarget.X, 0, toTarget.Z);
			if (flat.Magnitude < 0.05) continue;

			const currentYaw = yawOf(rootPart.CFrame);
			const desiredYaw = math.atan2(-flat.X, -flat.Z);
			if (math.abs(wrapAngle(desiredYaw - currentYaw)) < DEADZONE) continue; // head handles small offsets

			align.CFrame = CFrame.Angles(0, desiredYaw, 0); // yaw-only goal keeps it upright
		}
	},
};

//reset root cf
world.set(Components.BodyTracking, OnAdd, (e) => {
	const root = world.get(e, Components.Basepart);
	const humanoid = world.get(e, Components.Humanoid);
	if (!root) return;

	const att = new Instance("Attachment");
	att.Name = "BodyTrackAttachment";
	att.Parent = root;

	const align = new Instance("AlignOrientation");
	align.Mode = Enum.OrientationAlignmentMode.OneAttachment;
	align.Attachment0 = att;
	align.RigidityEnabled = false;
	align.MaxTorque = math.huge;
	align.MaxAngularVelocity = MAX_TURN_SPEED;
	align.Responsiveness = 20;
	align.CFrame = root.CFrame.Rotation; // start from current facing
	align.Parent = root;

	if (humanoid) humanoid.AutoRotate = false;
	world.set(e, Components.BodyAligner, align);
});

world.set(Components.BodyTracking, OnRemove, (e) => {
	const align = world.get(e, Components.BodyAligner);
	const humanoid = world.get(e, Components.Humanoid);

	align?.Attachment0?.Destroy();
	align?.Destroy();
	if (humanoid) humanoid.AutoRotate = true;
	if (world.contains(e)) world.remove(e, Components.BodyAligner);
});
