import Make from "@rbxts/make";
import { promiseR6 } from "@rbxts/promise-character";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { INTERACTABLE_CHARACTERS } from "shared/data/world/npcs";
import { AnimationUtils } from "../../visual/animationUtil";

export async function ragdollCharacter(model: Model) {
	const rigR6 = await promiseR6(model);

	const waistCenterAttachment = rigR6.Torso.WaistCenterAttachment;
	rigR6.Humanoid.PlatformStand = true;
	rigR6.Humanoid.ChangeState("Physics");

	const waistRightAttachment = waistCenterAttachment.Clone();
	waistRightAttachment.Name = "WaistRightAttachment";
	waistRightAttachment.Position = new Vector3(0.5, -1, 0);
	waistRightAttachment.Parent = rigR6.Torso;

	const waistLeftAttachment = waistCenterAttachment.Clone();
	waistLeftAttachment.Name = "WaistLeftAttachment";
	waistLeftAttachment.Position = new Vector3(-0.5, -1, 0);
	waistLeftAttachment.Parent = rigR6.Torso;

	const leftFootAttachment = rigR6["Left Leg"].LeftFootAttachment;
	const leftThighAttachment = leftFootAttachment.Clone();
	leftThighAttachment.Name = "LeftThighAttachment";
	leftThighAttachment.Parent = rigR6["Left Leg"];
	leftThighAttachment.Position = new Vector3(0, 1, 0);

	const rightFootAttachment = rigR6["Right Leg"].RightFootAttachment;
	const rightThighAttachment = rightFootAttachment.Clone();
	rightThighAttachment.Name = "RightThighAttachment";
	rightThighAttachment.Parent = rigR6["Right Leg"];
	rightThighAttachment.Position = new Vector3(0, 1, 0);

	const faceCenterAttachment = rigR6.Head.FaceCenterAttachment;
	const headBottomAttachment = faceCenterAttachment.Clone();
	headBottomAttachment.Name = "HeadBottomAttachment";
	headBottomAttachment.Parent = rigR6.Head;
	headBottomAttachment.Position = new Vector3(0, -0.5, 0);

	model.GetChildren().forEach((child) => {
		if (child.IsA("BasePart")) {
			child.CanCollide = true;
		}
	});

	const waist2rleg = Make("BallSocketConstraint", {
		Enabled: true,
		Attachment0: waistRightAttachment,
		Attachment1: rightThighAttachment,
		Parent: rigR6.Torso,

		LimitsEnabled: true,
		UpperAngle: 75,

		TwistLimitsEnabled: true,
		TwistLowerAngle: -30,
		TwistUpperAngle: 30,
	});
	const waist2lleg = Make("BallSocketConstraint", {
		Enabled: true,
		Attachment0: waistLeftAttachment,
		Attachment1: leftThighAttachment,
		Parent: rigR6.Torso,

		LimitsEnabled: true,
		UpperAngle: 75,

		TwistLimitsEnabled: true,
		TwistLowerAngle: -30,
		TwistUpperAngle: 30,
	});

	const torso2rarm = Make("BallSocketConstraint", {
		Enabled: true,
		Attachment0: rigR6.Torso.RightCollarAttachment,
		Attachment1: rigR6["Right Arm"].RightShoulderAttachment,
		Parent: rigR6.Torso,

		LimitsEnabled: true,
		UpperAngle: 100,

		TwistLimitsEnabled: true,
		TwistLowerAngle: -60,
		TwistUpperAngle: 60,
	});
	const torso2larm = Make("BallSocketConstraint", {
		Enabled: true,
		Attachment0: rigR6.Torso.LeftCollarAttachment,
		Attachment1: rigR6["Left Arm"].LeftShoulderAttachment,
		Parent: rigR6.Torso,

		LimitsEnabled: true,
		UpperAngle: 100,

		TwistLimitsEnabled: true,
		TwistLowerAngle: -60,
		TwistUpperAngle: 60,
	});
	const torso2head = Make("BallSocketConstraint", {
		Enabled: true,
		Attachment0: rigR6.Torso.NeckAttachment,
		Attachment1: headBottomAttachment,
		Parent: rigR6.Torso,

		LimitsEnabled: true,
		UpperAngle: 38,

		TwistLimitsEnabled: true,
		TwistLowerAngle: -30,
		TwistUpperAngle: 30,
	});

	model.GetDescendants().forEach((descendant) => {
		if (descendant.IsA("Motor6D")) {
			descendant.Enabled = false;
		}
		if (descendant.Name === "HumanoidRootPart" && descendant.IsA("BasePart")) {
			descendant.CanCollide = false;
		}
	});

	//disable interaction cause they are DEAD
	if (model.GetAttribute("dialogue") !== undefined) {
		model.SetAttribute("dialogue", undefined);
	}
	if (INTERACTABLE_CHARACTERS.includes(model.Name)) {
		model.Name = model.Name + "dead";
	}

	print("ragdoll done");
	AnimationUtils.preloadAnimations(model, [ANIMATION_IDS.noitem.carried]);
	model.SetAttribute("ragdolled", true);
}