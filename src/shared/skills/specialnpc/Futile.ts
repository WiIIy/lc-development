import { ref } from "@rbxts/jecs-utils";
import Make from "@rbxts/make";
import { PathfindingService, Players, RunService, TweenService, Workspace } from "@rbxts/services";
import { Character, Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { enemyList } from "shared/atoms";
import { Components } from "shared/components/components";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AnimationUtil, AnimationUtils } from "shared/utils/animationUtil";
import { getCoverSpotsInRadius } from "shared/utils/getValidCoverSpots";
import world from "shared/world";

const FUTILE_ASSETS = {
	MOUTH: {
		none: "",
		grin: "rbxassetid://80358751871142",
		bigger_grin: "rbxassetid://135630337063103",
	},
	IRIS: {
		normal: "rbxassetid://140674469542748",
		wide: "rbxassetid://114248346030623",
		joy: "rbxassetid://83894076808550",
	},
	PUPIL_SIZE: {
		normal: new Vector3(0.011, 0.07, 0.42),
		small: new Vector3(0.011, 0.05, 0.365),
	},
	NORMAL_PUPIL_OFFSETS: {
		right: new Vector3(-0, -0.045, 0.12),
		left: new Vector3(0, 0.065, -0.115),
		center: new Vector3(0, 0, 0),
		top: new Vector3(0, 0.04, 0.04),
		down: new Vector3(0, -0.035, -0.03),
	},
	WIDE_PUPIL_OFFSETS: {
		right: new Vector3(0.147, -0.05, -0.061),
		left: new Vector3(-0.157, 0.06, 0.066),
		center: new Vector3(0, 0, 0),
		top: new Vector3(0.004, 0.09, -0.001),
		down: new Vector3(0.004, -0.08, -0.001),
	},
};

@SkillDecorator
export class Futile extends Skill {
	pupil: BasePart | undefined;
	iris: BasePart | undefined;
	mouth: BasePart | undefined;
	irisDecal: Decal | undefined;
	mouthDecal: Decal | undefined;

	pupilJoint: Motor6D | undefined;
	irisJoint: Motor6D | undefined;
	mouthJoint: Motor6D | undefined;

	// Rig State
	protected torso: BasePart | undefined;
	protected head: BasePart | undefined;
	protected neck: Motor6D | undefined;

	currentIrisType: "Normal" | "Wide" | undefined;

	// Original CFrames for Lerping
	protected originalNeckC0: CFrame | undefined;
	protected originalPupilC0: CFrame | undefined;

	// Connections
	protected trackConnection: RBXScriptConnection | undefined;

	protected OnStartServer(): void {
		const model = this.Character.Humanoid.Parent as Model;

		this.torso = (model.FindFirstChild("Torso") as BasePart) || (model.FindFirstChild("UpperTorso") as BasePart);
		this.head = model.FindFirstChild("Head") as BasePart;

		const pupil = model.FindFirstChild("Pupil") as BasePart;
		const iris = model.FindFirstChild("Iris") as BasePart;
		const mouth = model.FindFirstChild("Mouth") as BasePart;

		const pupilWeld = this.head?.FindFirstChild("Pupil") as Motor6D;
		const irisWeld = this.head?.FindFirstChild("Iris") as Motor6D;
		const mouthWeld = this.head?.FindFirstChild("Mouth") as Motor6D;

		this.irisDecal = iris.FindFirstChild("Decal") as Decal;
		this.mouthDecal = mouth.FindFirstChild("Decal") as Decal;

		this.currentIrisType = "Normal";

		this.pupil = pupil;
		this.iris = iris;
		this.mouth = mouth;

		this.pupilJoint = pupilWeld;
		this.irisJoint = irisWeld;
		this.mouthJoint = mouthWeld;

		if (this.torso && this.head) {
			this.neck = (this.torso.FindFirstChild("Neck") as Motor6D) || (this.head.FindFirstChild("Neck") as Motor6D);
			if (this.neck) {
				this.originalNeckC0 = this.neck.C0;
			}
		}

		if (this.pupilJoint) {
			this.originalPupilC0 = this.pupilJoint.C0;
		}
	}

	startTrackingClosestPlayer() {
		this.stopTrackingClosestPlayer(); // Clear existing loops

		this.trackConnection = RunService.Heartbeat.Connect((dt) => {
			if (
				!this.torso ||
				!this.head ||
				!this.neck ||
				!this.originalNeckC0 ||
				!this.pupilJoint ||
				!this.originalPupilC0
			)
				return;

			// 1. Find Closest Player
			let closestPlayer: Model | undefined;
			let minDistance = math.huge;
			const myPos = this.torso.Position;

			for (const player of Players.GetPlayers()) {
				const char = player.Character;
				if (char && char.PrimaryPart) {
					const dist = char.PrimaryPart.Position.sub(myPos).Magnitude;
					if (dist < minDistance) {
						minDistance = dist;
						closestPlayer = char;
					}
				}
			}

			// If no player, return face/neck to neutral states
			if (!closestPlayer || !closestPlayer.PrimaryPart) {
				this.neck.C0 = this.neck.C0.Lerp(this.originalNeckC0, 5 * dt);
				this.pupilJoint.C0 = this.pupilJoint.C0.Lerp(this.originalPupilC0, 10 * dt);
				return;
			}

			const targetPos = closestPlayer.PrimaryPart.Position;

			// 2. Neck Turning Logic (Torso Relative)
			const torsoLocalDir = this.torso.CFrame.PointToObjectSpace(targetPos).Unit;
			const torsoYaw = math.atan2(-torsoLocalDir.X, -torsoLocalDir.Z);
			const torsoPitch = math.asin(math.clamp(torsoLocalDir.Y, -1, 1));

			const DEADZONE_ANGLE = math.rad(45);
			const MAX_NECK_YAW = math.rad(70);
			const MAX_NECK_PITCH = math.rad(40);

			let targetNeckYaw = 0;
			let targetNeckPitch = 0;

			// If outside the 45-degree cone, snap the target angles to track the player
			if (math.abs(torsoYaw) > DEADZONE_ANGLE) {
				targetNeckYaw = math.clamp(torsoYaw, -MAX_NECK_YAW, MAX_NECK_YAW);
				targetNeckPitch = math.clamp(torsoPitch, -MAX_NECK_PITCH, MAX_NECK_PITCH);
			}

			const goalNeckC0 = this.originalNeckC0.mul(CFrame.Angles(-targetNeckPitch, 0, targetNeckYaw));
			this.neck.C0 = this.neck.C0.Lerp(goalNeckC0, 5 * dt);

			// 3. Pupil Tracking Logic (Head Relative)
			// We calculate relative to the HEAD so the pupil returns to center naturally if the neck is tracking
			const headLocalDir = this.head.CFrame.PointToObjectSpace(targetPos).Unit;
			const headYaw = math.atan2(-headLocalDir.X, -headLocalDir.Z);
			const headPitch = math.asin(math.clamp(headLocalDir.Y, -1, 1));

			const MAX_EYE_YAW = math.rad(50);
			const MAX_EYE_PITCH = math.rad(40);

			// Map angles to a scale of -1 to 1 for the offset multipliers
			const yawRatio = math.clamp(headYaw / MAX_EYE_YAW, -1, 1);
			const pitchRatio = math.clamp(headPitch / MAX_EYE_PITCH, -1, 1);

			let targetPupilOffset = FUTILE_ASSETS.NORMAL_PUPIL_OFFSETS.center;

			// Apply horizontal offsets
			if (yawRatio > 0) {
				// Target is Left
				targetPupilOffset = targetPupilOffset.add(FUTILE_ASSETS.NORMAL_PUPIL_OFFSETS.left.mul(yawRatio));
			} else {
				// Target is Right
				targetPupilOffset = targetPupilOffset.add(FUTILE_ASSETS.NORMAL_PUPIL_OFFSETS.right.mul(-yawRatio));
			}

			// Apply vertical offsets
			if (pitchRatio > 0) {
				// Target is Up
				targetPupilOffset = targetPupilOffset.add(FUTILE_ASSETS.NORMAL_PUPIL_OFFSETS.top.mul(pitchRatio));
			} else {
				// Target is Down
				targetPupilOffset = targetPupilOffset.add(FUTILE_ASSETS.NORMAL_PUPIL_OFFSETS.down.mul(-pitchRatio));
			}

			// Apply translation to the original pupil C0
			const goalPupilC0 = this.originalPupilC0.mul(new CFrame(targetPupilOffset));
			this.pupilJoint.C0 = this.pupilJoint.C0.Lerp(goalPupilC0, 12 * dt);
		});
	}

	stopTrackingClosestPlayer() {
		if (this.trackConnection) {
			this.trackConnection.Disconnect();
			this.trackConnection = undefined;
		}
	}

	shrinkPupil() {
		if (!this.pupil) {
			print("The futile has no pupil");
			return;
		}
		this.pupil.Size = FUTILE_ASSETS.PUPIL_SIZE.small;
	}

	normalPupil() {
		if (!this.pupil) {
			print("The futile has no pupil");
			return;
		}
		this.pupil.Size = FUTILE_ASSETS.PUPIL_SIZE.normal;
	}

	grinMouth() {
		if (!this.mouthDecal) {
			print("The futile has no mouth and he must scream");
			return;
		}
		this.mouthDecal.Texture = FUTILE_ASSETS.MOUTH.grin;
	}

	wideIris() {
		if (!this.irisDecal) {
			print("The futile has no iris");
			return;
		}
		this.currentIrisType = "Wide";
		this.irisDecal.Texture = FUTILE_ASSETS.IRIS.wide;
	}

	normalIris() {
		if (!this.irisDecal) {
			print("The futile has no iris");
			return;
		}
		this.currentIrisType = "Normal";
		this.irisDecal.Texture = FUTILE_ASSETS.IRIS.normal;
	}
}
