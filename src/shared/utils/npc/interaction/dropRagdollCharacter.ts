import { Workspace } from "@rbxts/services";
import { AnimationUtils } from "shared/utils/visual/animationUtil";

export function dropCarriedCharacter(target: Model, carrier: Model) {
	const carrierRoot = carrier.FindFirstChild("HumanoidRootPart") as BasePart;
	let targetRoot: BasePart | undefined = undefined;
	targetRoot = target.FindFirstChild("HumanoidRootPart") as BasePart;
	const targetHumanoid = target.FindFirstChild("Humanoid") as Humanoid | undefined;

	AnimationUtils.stopAnim(carrier, "carrying");
	AnimationUtils.stopAnim(carrier, "dragging1");
	AnimationUtils.stopAnim(carrier, "dragging2");
	AnimationUtils.stopAnim(target, "carried");
	AnimationUtils.stopAnim(target, "dragged");

	// print("drop by ", carrier, carrierRoot, target, targetRoot, targetHumanoid);

	if (!targetRoot) {
		const targetName = carrier.GetAttribute("carrying") as string;
		const targetModel = Workspace.FindFirstChild(targetName) as Model;
		targetRoot = targetModel.FindFirstChild("Torso") as BasePart;
	}

	// 1. Set the Humanoid state to Physics so it stops overriding limb CanCollide
	if (!carrierRoot || !targetRoot) {
		print("no carrier or targt root, carrier: ", carrierRoot, ", targetroot: ", targetRoot);
		return;
	}

	// 2. Add a Y-offset (e.g., 2 studs) to drop it safely ABOVE the ground
	targetRoot.CFrame = carrierRoot.CFrame.mul(new CFrame(0, 2, -3)).mul(CFrame.Angles(math.rad(90), 0, 0));

	target.GetDescendants().forEach((descendant) => {
		if (descendant.IsA("BasePart")) {
			descendant.CollisionGroup = "Default";
			descendant.CanCollide = true;
		} else if (descendant.IsA("Motor6D")) {
			// Do not disable the RootJoint. If the HumanoidRootPart falls into the void, the model dies.
			if (descendant.Name !== "RootJoint") {
				descendant.Enabled = false;
			}
		} else if (descendant.IsA("BallSocketConstraint")) {
			descendant.Enabled = true;
		} else if (descendant.IsA("Attachment") && descendant.Name === "DragAttachment1") {
			descendant.Destroy();
		}
	});

	carrierRoot.GetChildren().forEach((child) => {
		if (child.IsA("AlignPosition") || child.IsA("AlignOrientation")) {
			print("gone");
			child.Destroy();
		}
	});

	target.SetAttribute("carried", false);
	target.SetAttribute("dragged", false);
	carrier.SetAttribute("carrying", "");
}