import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components/components";

const NECK_C0 = new CFrame(0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);
const HEAD_SMOOTH = 4;
const MAX_YAW = math.pi / 3;
const MAX_PITCH = math.pi / 4;

const yawOf = (v: Vector3) => math.atan2(-v.X, -v.Z);
const wrapAngle = (a: number) => math.atan2(math.sin(a), math.cos(a));

//this is for neck tracking. body tracking is different. i think
export const SightTrackingSystem = {
    name: "SightTrackingSystem",
    system: () => {
        const alpha = 1 - math.exp(-HEAD_SMOOTH * scheduler.getDeltaTime());

        for (const [e, selfTransform, targetTransform, neckJoint] of world
            .query(Components.Transform, Components.TargetTransform, Components.NeckJoint)
            .with(Components.Tracking, Components.SightTracking)) {
            const head = neckJoint.Part1;
            if (!head) continue;

            const offset = targetTransform.Position.sub(selfTransform.Position);
            if (offset.Magnitude < 0.01) continue;
            const dir = offset.Unit;

            // current head state, read from the rig itself (world space)
            const headLook = head.CFrame.LookVector;
            const headYaw = yawOf(headLook);
            const headPitch = math.asin(math.clamp(headLook.Y, -1, 1));

            // where it should be (world space)
            const goalYaw = yawOf(dir);
            const goalPitch = math.clamp(math.asin(math.clamp(dir.Y, -1, 1)), -MAX_PITCH, MAX_PITCH);

            // smooth in world space, then convert to body-relative
            const newYaw = headYaw + wrapAngle(goalYaw - headYaw) * alpha;
            const newPitch = headPitch + (goalPitch - headPitch) * alpha;
            const relYaw = math.clamp(wrapAngle(newYaw - yawOf(selfTransform.LookVector)), -MAX_YAW, MAX_YAW);

            neckJoint.C0 = NECK_C0.mul(CFrame.Angles(-newPitch, 0, relYaw));
        }
    },
};
