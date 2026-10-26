import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components/components";

const NECK_C0 = new CFrame(0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);

//this is for neck tracking. body tracking is different. i think
export const SightTrackingSystem = {
	name: "SightTrackingSystem",
	system: () => {
		for (const [e, selfTransform, targetTransform, neckJoint] of world
			.query(Components.Transform, Components.TargetTransform, Components.NeckJoint)
			.with(Components.Tracking, Components.SightTracking)) {
			const selfPos = selfTransform.Position;
			const targetPos = targetTransform.Position;

			const movementDelta = selfPos.sub(targetPos);
			if (math.max(math.abs(movementDelta.X), math.abs(movementDelta.Y), math.abs(movementDelta.Z)) < 0.01)
				continue;

			// Calculate directional vectors relative to current orientation
			const dir = targetPos.sub(selfPos).Unit;
			const localLook = selfTransform.VectorToObjectSpace(dir);

			// Calculate BOTH Yaw and Pitch for head tracking
			const rawYaw = math.atan2(-localLook.X, -localLook.Z);
			const pitch = math.clamp(math.asin(math.clamp(localLook.Y, -1, 1)), -math.pi / 4, math.pi / 4);

			// Clamp neck yaw so head doesn't snap backwards 180 degrees
			const targetYaw = math.clamp(rawYaw, -math.pi / 3, math.pi / 3);

			// --- Neck Rotation ---
			// Re-applied targetYaw here so the head tracks the target ahead of the body lerp
			const goalNeckC0 = NECK_C0.mul(CFrame.Angles(-pitch, 0, targetYaw));
			neckJoint.C0 = neckJoint.C0.Lerp(goalNeckC0, math.clamp(10 * scheduler.getDeltaTime(), 0, 1));
		}
	},
};

world.query(Components.Target);
