import Make from "@rbxts/make";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { AnimationUtils } from "shared/utils/visual/animationUtil";

export function dragRagdolledCharacter(target: Model, carrier: Model) {
	if (target.GetAttribute("ragdolled") === false || target.GetAttribute("ragdolled") === undefined) return;

	const targetRoot = target.FindFirstChild("Torso") as BasePart;
	const carrierRoot = carrier.FindFirstChild("HumanoidRootPart") as BasePart;
	const bodyFrontAttachment = carrier.FindFirstChild("Torso")?.FindFirstChild("BodyFrontAttachment") as Attachment;

	if (!targetRoot || !carrierRoot) return;

	targetRoot.Anchored = false;

	const targetLeftShoulderAttachment = target
		.FindFirstChild("Torso")
		?.FindFirstChild("LeftCollarAttachment") as Attachment;
	// const carrierLeftArmAttachment = carrier
	// 	.FindFirstChild("Left Arm")
	// 	?.FindFirstChild("LeftGripAttachment") as Attachment;

	// Position over the shoulder (fireman carry)
	targetRoot.CFrame = carrierRoot.CFrame.mul(new CFrame(-1, 1, 0)).mul(CFrame.Angles(math.rad(0), 0, math.rad(0)));

	const offsetAttachment = targetLeftShoulderAttachment.Clone();
	offsetAttachment.Position = offsetAttachment.Position.add(new Vector3(1, 0.3, 0)); //raise the target up by a stud
	offsetAttachment.Parent = targetRoot;

	Make("AlignPosition", {
		RigidityEnabled: true,
		Responsiveness: 200,
		Attachment0: offsetAttachment,
		Attachment1: bodyFrontAttachment,
		Parent: carrierRoot,
	});

	// targetLeftShoulderAttachment.CFrame = new CFrame(0, 0, 0).mul(CFrame.Angles(math.rad(0), 0, math.rad(0)));

	Make("AlignOrientation", {
		RigidityEnabled: true,
		Responsiveness: 200,
		Attachment0: targetLeftShoulderAttachment,
		Attachment1: bodyFrontAttachment,
		Parent: carrierRoot,
	});

	//disabled physics
	target.GetDescendants().forEach((descendant) => {
		if (descendant.IsA("BasePart")) {
			descendant.CollisionGroup = "viewmodel";
			descendant.CanCollide = false;
		} else if (descendant.IsA("BallSocketConstraint")) {
			descendant.Enabled = false;
		} else if (descendant.IsA("Motor6D")) {
			descendant.Enabled = true;
		}
	});

	AnimationUtils.loadAnim(target, "dragged", ANIMATION_IDS.noitem.dragged);
	AnimationUtils.loadAnim(carrier, "dragging1", ANIMATION_IDS.noitem.dragging1);
	AnimationUtils.loadAnim(carrier, "dragging2", ANIMATION_IDS.noitem.dragging2);
	target.SetAttribute("dragged", true);
	carrier.SetAttribute("carrying", target.Name);
}