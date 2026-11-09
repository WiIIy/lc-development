import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";

// R6 RootJoint rest C0 (same convention BodyTrackingSystem uses).
// Rotating C0 by CFrame.Angles(0, 0, yaw) twists the torso about the HRP's up axis; +yaw = turn left.
export const ROOT_C0 = new CFrame(0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);
const ROOT_C0_INV = ROOT_C0.Inverse();

export const FACING_COS = math.cos(math.rad(8));

export const flat = (v: Vector3) => new Vector3(v.X, 0, v.Z);

// where the visible body faces. Torso when there's a RootJoint (that's what Transform tracks), HRP otherwise
export function bodyFacing(root: BasePart, joint?: Motor6D): Vector3 {
	const part = joint?.Part1 ?? root;
	const look = flat(part.CFrame.LookVector);
	return look.Magnitude > 0.001 ? look.Unit : new Vector3(0, 0, -1);
}

// move the joint's yaw onto the root: same visual facing, zero offset.
// call this before anything that walks, because Humanoid auto-rotate turns the HRP, not the twist
export function releaseBody(root: BasePart, joint: Motor6D | undefined) {
	if (joint === undefined) return;
	const [, , yaw] = ROOT_C0_INV.mul(joint.C0).ToEulerAnglesXYZ();
	if (math.abs(yaw) < 1e-3) return;
	root.CFrame = root.CFrame.mul(CFrame.Angles(0, yaw, 0));
	joint.C0 = ROOT_C0;
}

// smooth turn toward a world-space direction. returns true once the body faces it.
// with a RootJoint it twists the joint (HRP stays put), without one it falls back to rotating the HRP
export function turnBody(root: BasePart, joint: Motor6D | undefined, dir: Vector3, rate: number, dt: number): boolean {
	const want = flat(dir);
	if (want.Magnitude < 0.001) return true;
	const unit = want.Unit;
	const alpha = 1 - math.exp(-rate * dt); // framerate independent

	if (joint === undefined) {
		const cf = root.CFrame;
		const p = cf.Position;
		const goal = CFrame.lookAt(p, p.add(unit)).Rotation;
		root.CFrame = cf.Rotation.Lerp(goal, alpha).add(p);
	} else {
		// yaw is measured from the HRP, because the joint twist is relative to it
		const Local = root.CFrame.VectorToObjectSpace(unit);
		const yaw = math.atan2(-Local.X, -Local.Z);
		joint.C0 = joint.C0.Lerp(ROOT_C0.mul(CFrame.Angles(0, 0, yaw)), alpha);
	}

	return bodyFacing(root, joint).Dot(unit) > FACING_COS;
}

// true while an idle behavior is deliberately holding the torso twisted.
// BodyTrackingSystem checks this so its "no look point -> release" doesn't undo the pose every frame
export function bodyPosed(e: Entity): boolean {
	if (world.get(e, Components.MemoryState)?.phase === "Turn") return true;
	return world.get(e, Components.WallLook)?.posing === true;
}
