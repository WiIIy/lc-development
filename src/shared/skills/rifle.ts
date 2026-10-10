// import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
// import { ContextActionService, Debris, Players, ReplicatedStorage, Workspace } from "@rbxts/services";
// import { BaseFirearmSkill } from "./basefirearmskill";
// import { AnimationUtils } from "shared/utils/visual/animationUtil";
// import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";

// @SkillDecorator
// export class Rifle extends BaseFirearmSkill {
// 	vmMagOutTrack?: AnimationTrack;
// 	insertBulletTrack?: AnimationTrack;

// 	takeoutMagMarker = {
// 		out: () => {
// 			print("event");
// 			this.vmMagOutTrack?.AdjustSpeed(0);
// 			// this.viewmodelTrack?.AdjustSpeed(0);
// 			this.magOut = true;
// 		},
// 	};

// 	insertBulletMarker = {
// 		stop: () => {
// 			print("stop");
// 			this.insertBulletTrack?.AdjustSpeed(0);
// 		},
// 	};

// 	protected OnStartServer(): void {
// 		super.OnStartServer();
// 	}

// 	protected OnStartClient(): void {
// 		super.OnStartClient();
// 	}

// 	Fire() {}

// 	TakeoutMag() {
// 		print("out");
// 		if (this.vmAnimationSet !==undefined && "magout" in this.vmAnimationSet) {
// 			this.vmMagOutTrack = AnimationUtils.loadAnim(
// 				this.viewmodel as Model,
// 				"magout",
// 				this.vmAnimationSet.magout,
// 				0,
// 				false,
// 				this.takeoutMagMarker,
// 			);
// 		}
// 	}

// 	InsertMag() {
// 		print("insertMag");
// 		this.insertBulletMarker.stop();
// 		this.vmMagOutTrack?.AdjustSpeed(1);
// 		this.magOut = false;
// 	}

// 	Reload() {}

// 	protected OnDestroyClient(): void {
// 		// Cleanup input when unequipped
// 		ContextActionService.UnbindAction("FirePistol");
// 	}

// 	private handleInput() {
// 		const mouse = Players.LocalPlayer.GetMouse();
// 		const targetPos = mouse.Hit.Position;

// 		// Call the simplified fire method in Base
// 		this.attemptFire(targetPos);
// 	}

// 	protected OnConstructClient(): void {
// 		super.OnConstructClient();
// 	}

// 	protected OnConstructServer(): void {
// 		super.OnConstructServer();
// 	}
// }
