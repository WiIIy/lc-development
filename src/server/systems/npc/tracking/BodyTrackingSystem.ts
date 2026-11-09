import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components/components";
import { OnAdd, OnRemove } from "@rbxts/replecs/out/jecs";
import { getLookPoint } from "../utils/lookPoint";

const TURN_RATE = 24;
const ROOT_C0 = new CFrame(0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);
const ROOT_C0_INV = ROOT_C0.Inverse();

// move the joint's yaw onto the root: same visual facing, zero offset
function release(root: BasePart, joint: Motor6D) {
	const [, , yaw] = ROOT_C0_INV.mul(joint.C0).ToEulerAnglesXYZ();
	if (math.abs(yaw) < 1e-3) return;
	root.CFrame = root.CFrame.mul(CFrame.Angles(0, yaw, 0)); // flip yaw's sign here if your C0 sign is flipped
	joint.C0 = ROOT_C0;
}

export const BodyTrackingSystem = {
	name: "BodyTrackingSystem",
	system: () => {
		const alpha = 1 - math.exp(-TURN_RATE * scheduler.getDeltaTime());

		for (const [e, root, joint] of world
			.query(Components.Basepart, Components.RootJoint)
			.with(Components.Tracking, Components.BodyTracking)) {
			const humanoid = world.get(e, Components.Humanoid);
			const look = getLookPoint(e);

			if (look === undefined) {
				release(root, joint);
				if (humanoid && !humanoid.AutoRotate) humanoid.AutoRotate = true; // walk facing is normal again
				continue;
			}

			if (humanoid && humanoid.AutoRotate) humanoid.AutoRotate = false;

			const Local = root.CFrame.VectorToObjectSpace(look.sub(root.Position));
			const flat = new Vector3(Local.X, 0, Local.Z);
			if (flat.Magnitude < 0.05) continue;

			const yaw = math.atan2(-flat.X, -flat.Z);
			const goal = ROOT_C0.mul(CFrame.Angles(0, 0, yaw));
			joint.C0 = joint.C0.Lerp(goal, alpha);
		}
	},
};

world.set(Components.BodyTracking, OnAdd, (e) => {
	const humanoid = world.get(e, Components.Humanoid);
	if (humanoid) humanoid.AutoRotate = false; // we own facing now
});

world.set(Components.BodyTracking, OnRemove, (e) => {
	const root = world.get(e, Components.Basepart);
	const joint = world.get(e, Components.RootJoint);
	if (root && joint) release(root, joint);
	const humanoid = world.get(e, Components.Humanoid);
	if (humanoid) humanoid.AutoRotate = true;
});
