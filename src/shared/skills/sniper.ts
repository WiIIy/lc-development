import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { Players, ReplicatedStorage, TweenService, UserInputService, Workspace } from "@rbxts/services";
import { BaseFirearmSkill } from "./basefirearmskill";
import { AnimationUtils } from "shared/utils/animationUtil";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";

//will probably have a different aiming mechanic

@SkillDecorator
export class Sniper extends BaseFirearmSkill {
	vmMagOutTrack?: AnimationTrack;
	insertBulletTrack?: AnimationTrack;
	FOV_ZOOM_AMOUNT = 50;
	tweenInfo = new TweenInfo(0.2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, 0, false, 0);
	defaultFov: number = 70;
	defaultMouseSensitivity: number = 0;

	takeoutMagMarker = {
		out: () => {
			print("event");
			this.vmMagOutTrack?.AdjustSpeed(0);
			// this.viewmodelTrack?.AdjustSpeed(0);
			this.magOut = true;
		},
	};

	insertBulletMarker = {
		stop: () => {
			print("stop");
			this.insertBulletTrack?.AdjustSpeed(0);
		},
	};

	protected OnStartServer(): void {
		super.OnStartServer();
	}

	protected OnStartClient(): void {
		super.OnStartClient();
		this.defaultFov = Workspace.CurrentCamera!.FieldOfView;
		this.defaultMouseSensitivity = UserInputService.MouseDeltaSensitivity;
	}

	Fire() {
		// print("D")
		const mouse = Players.LocalPlayer.GetMouse();
		const targetPos = mouse.Hit.Position;
		this.attemptFire(targetPos);
	}

	Reload() {}

	Aim(active: boolean) {
		super.Aim(active);

		//rmb start
		if (active) {
			TweenService.Create(Workspace.CurrentCamera!, this.tweenInfo, {
				FieldOfView: this.defaultFov - this.FOV_ZOOM_AMOUNT,
			}).Play();

			UserInputService.MouseDeltaSensitivity = 0.5;
		} else {
			//rmb end
			TweenService.Create(Workspace.CurrentCamera!, this.tweenInfo, { FieldOfView: this.defaultFov }).Play();
			UserInputService.MouseDeltaSensitivity = this.defaultMouseSensitivity;
		}
	}

	private handleInput() {
		const mouse = Players.LocalPlayer.GetMouse();
		const targetPos = mouse.Hit.Position;

		// Call the simplified fire method in Base
		this.attemptFire(targetPos);
	}

	protected OnConstructClient(): void {
		super.OnConstructClient();
		this.Destroyed.Connect(() => {
			Workspace.CurrentCamera!.FieldOfView = 70;
		});
	}

	protected OnConstructServer(): void {
		super.OnConstructServer();
	}
}
