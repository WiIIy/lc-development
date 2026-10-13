import { Controller, OnRender, OnStart } from "@flamework/core";
import { Players, Workspace } from "@rbxts/services";
import { RemoteEvents } from "client/network";
import { isAiming } from "shared/sharedAtoms";

const player = Players.LocalPlayer;
const camera = Workspace.CurrentCamera;

// Config
const MAX_PITCH_DEG = 80;
const MAX_PITCH_RAD = math.rad(MAX_PITCH_DEG);
const SMOOTHNESS = 0.2;
const REPLICATION_RATE = 0.1;

let lastSentTime = 0;

// Store original CFrames
let originalNeckC0: CFrame | undefined;
let originalRightShoulderC0: CFrame | undefined;
let originalLeftShoulderC0: CFrame | undefined;

// Store calculated rotation axes
let rightShoulderPitchAxis: Vector3 | undefined;
let leftShoulderPitchAxis: Vector3 | undefined;

function resetCharacterCache() {
	originalNeckC0 = undefined;
	originalRightShoulderC0 = undefined;
	originalLeftShoulderC0 = undefined;
	rightShoulderPitchAxis = undefined;
	leftShoulderPitchAxis = undefined;
}

@Controller({})
export class HeadMovementController implements OnStart, OnRender {
	onStart(): void {
		player.CharacterRemoving.Connect(resetCharacterCache);
	}

	onRender(dt: number): void {
		lastSentTime += dt;
		const character = player.Character;
		if (!character || !camera) return;

		const humanoid = character.FindFirstChildOfClass("Humanoid");
		if (!humanoid || humanoid.Health <= 0) return;

		const rootPart = character.FindFirstChild("HumanoidRootPart") as BasePart;
		const torso = character.FindFirstChild("Torso") || character.FindFirstChild("UpperTorso");

		if (rootPart && torso) {
			const neck = (torso.FindFirstChild("Neck") ||
				character.FindFirstChild("Head")?.FindFirstChild("Neck")) as Motor6D;

			const rightShoulder = torso.FindFirstChild("Right Shoulder") as Motor6D;
			const leftShoulder = torso.FindFirstChild("Left Shoulder") as Motor6D;

			if (!neck || !rightShoulder || !leftShoulder) return;

			// Initialization
			if (!originalNeckC0) originalNeckC0 = neck.C0;
			if (!originalRightShoulderC0) {
				originalRightShoulderC0 = rightShoulder.C0;
				rightShoulderPitchAxis = originalRightShoulderC0.VectorToObjectSpace(Vector3.xAxis);
			}
			if (!originalLeftShoulderC0) {
				originalLeftShoulderC0 = leftShoulder.C0;
				leftShoulderPitchAxis = originalLeftShoulderC0.VectorToObjectSpace(Vector3.xAxis);
			}

			// Calculate Look Direction
			const cameraLook = camera.CFrame.LookVector;
			const flatLook = new Vector3(cameraLook.X, 0, cameraLook.Z);

			// Rotate entire character body horizontally to match camera direction
			if (!humanoid.Sit && !humanoid.SeatPart && flatLook.Magnitude > 0.001) {
				humanoid.AutoRotate = false;
				const targetBodyRot = new CFrame(rootPart.Position, rootPart.Position.add(flatLook));
				rootPart.CFrame = rootPart.CFrame.Lerp(targetBodyRot, SMOOTHNESS);
			}

			const localLook = rootPart.CFrame.VectorToObjectSpace(cameraLook);
			const pitch = math.asin(math.clamp(localLook.Y, -1, 1));
			const clampedPitch = math.clamp(pitch, -MAX_PITCH_RAD, MAX_PITCH_RAD);

			// Neck only rotates vertically (pitch), yaw and roll remain 0
			const neckRotation = CFrame.Angles(-clampedPitch, 0, 0);
			const targetNeckCFrame = originalNeckC0!.mul(neckRotation);
			neck.C0 = neck.C0.Lerp(targetNeckCFrame, SMOOTHNESS);

			// Arm pitch logic
			let armPitch = 0;
			if (isAiming()) {
				armPitch = pitch; // No pitch limit when aiming
			} else {
				armPitch = clampedPitch < 0 ? math.max(clampedPitch, -90) : 0;
			}

			const rightRotation = CFrame.fromAxisAngle(rightShoulderPitchAxis!, armPitch);
			const leftRotation = CFrame.fromAxisAngle(leftShoulderPitchAxis!, armPitch);

			const targetRightC0 = originalRightShoulderC0!.mul(rightRotation);
			const targetLeftC0 = originalLeftShoulderC0!.mul(leftRotation);

			rightShoulder.C0 = rightShoulder.C0.Lerp(targetRightC0, SMOOTHNESS);
			leftShoulder.C0 = leftShoulder.C0.Lerp(targetLeftC0, SMOOTHNESS);

			// Replication
			if (lastSentTime >= REPLICATION_RATE) {
				lastSentTime = 0;
				RemoteEvents.neckMovement.fire(targetNeckCFrame, targetRightC0, targetLeftC0);
			}
		}
	}
}
