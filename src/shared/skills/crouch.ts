import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { CollectionService, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { AnimationUtils } from "shared/utils/visual/animationUtil";

@SkillDecorator
export class Crouch extends Skill {
	currentCrouchLegsTrack: AnimationTrack | undefined; //separated due to differing anim priorities, legs are "Idle" to override core walk anim
	currentCrouchArmsTrack: AnimationTrack | undefined; //arms are set to "Core" to not override arm movement anims
	lArmCollidePart: BasePart | undefined;
	rArmCollidePart: BasePart | undefined;
	head: BasePart | undefined;
	public crouching: boolean = false;
	walkSpeed = 16;
	crouchSpeed = 8;

	OnStartClient() {
		AnimationUtils.preloadAnimations(this.Player!.Character!, [
			ANIMATION_IDS.character.crouching_legs,
			ANIMATION_IDS.character.crouching_arms,
		]);
		this.lArmCollidePart = this.Player!.Character!.FindFirstChild("Left Arm Collide Part") as BasePart;
		this.rArmCollidePart = this.Player!.Character!.FindFirstChild("Right Arm Collide Part") as BasePart;
		this.head = this.Player!.Character!.FindFirstChild("Head") as BasePart;
	}

	StartCrouch() {
		const hum = this.Player!.Character!.FindFirstChild("Humanoid") as Humanoid;

		this.crouching = true;
		this.currentCrouchLegsTrack = AnimationUtils.loadAnim(
			this.Player!.Character!,
			"crouch",
			ANIMATION_IDS.character.crouching_legs,
			0.1,
			true,
		);
		this.currentCrouchArmsTrack = AnimationUtils.loadAnim(
			this.Player!.Character!,
			"crouch",
			ANIMATION_IDS.character.crouching_arms,
			0.1,
			true,
		);

		if (this.lArmCollidePart && this.rArmCollidePart && this.head) {
			this.lArmCollidePart.CanCollide = false;
			this.rArmCollidePart.CanCollide = false;
			this.head.CanCollide = false;
		}

		hum.WalkSpeed = this.crouchSpeed;
	}

	StopCrouch() {
		this.crouching = false;
		this.currentCrouchLegsTrack?.Stop();
		this.currentCrouchLegsTrack = undefined;
		this.currentCrouchArmsTrack?.Stop();
		this.currentCrouchArmsTrack = undefined;

		if (this.lArmCollidePart && this.rArmCollidePart && this.head) {
			this.lArmCollidePart.CanCollide = true;
			this.rArmCollidePart.CanCollide = true;
			this.head.CanCollide = true;
		}

		const hum = this.Player!.Character!.FindFirstChild("Humanoid") as Humanoid;
		hum.WalkSpeed = this.walkSpeed;
	}
}
