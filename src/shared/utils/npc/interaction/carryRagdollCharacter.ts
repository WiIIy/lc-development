import Make from "@rbxts/make";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { AnimationUtils } from "shared/utils/visual/animationUtil";

export function carryRagdolledCharacter(target: Model, carrier: Model) {
	if (target.GetAttribute("ragdolled") === false || target.GetAttribute("ragdolled") === undefined) return;

	const targetRoot = target.FindFirstChild("Torso") as BasePart;
	const carrierRoot = carrier.FindFirstChild("HumanoidRootPart") as BasePart;

	if (!targetRoot || !carrierRoot) return;

	targetRoot.Anchored = false;

	const targetTorsoAttachment = target.FindFirstChild("Torso")?.FindFirstChild("BodyFrontAttachment") as Attachment;
	const carrierLeftCollarAttachment = carrier
		.FindFirstChild("Torso")
		?.FindFirstChild("LeftCollarAttachment") as Attachment;

	// Position over the shoulder (fireman carry)
	targetRoot.CFrame = carrierRoot.CFrame.mul(new CFrame(-0.5, 1.5, 0)).mul(
		CFrame.Angles(math.rad(-90), 0, math.rad(180)),
	);

	Make("AlignPosition", {
		RigidityEnabled: true,
		Responsiveness: 200,
		Attachment0: targetTorsoAttachment,
		Attachment1: carrierLeftCollarAttachment,
		Parent: carrierRoot,
	});

	targetTorsoAttachment.CFrame = new CFrame(0, 0, 0).mul(CFrame.Angles(math.rad(-90), 0, math.rad(150)));

	Make("AlignOrientation", {
		RigidityEnabled: true,
		Responsiveness: 200,
		Attachment0: targetTorsoAttachment,
		Attachment1: carrierLeftCollarAttachment,
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

	AnimationUtils.loadAnim(target, "carried", ANIMATION_IDS.noitem.carried);
	AnimationUtils.loadAnim(carrier, "carrying", ANIMATION_IDS.noitem.carrying);
	target.SetAttribute("carried", true);
	carrier.SetAttribute("carrying", target.Name);
}
