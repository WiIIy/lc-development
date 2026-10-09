import { ref } from "@rbxts/jecs-utils";
import { Workspace, ReplicatedStorage } from "@rbxts/services";
import { HoldableSkill, Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AnimationUtils } from "shared/utils/animationUtil";
import { Entity, pair, Wildcard } from "@rbxts/jecs";
import Components from "shared/components/components";
import world from "shared/world";

@SkillDecorator
export class Parry extends Skill {
	viewmodel: Model | undefined;
	public parrying?: boolean = false;
	itemViewmodelTracks: typeof ANIMATION_IDS.viewmodel[keyof typeof ANIMATION_IDS.viewmodel] | undefined;
	itemCharTracks: typeof ANIMATION_IDS.item[keyof typeof ANIMATION_IDS.item] | undefined;

	vmParryTrack: AnimationTrack | undefined;
	charParryingTrack: AnimationTrack | undefined;
	currentitem: string | undefined;

	protected OnStartClient(): void {
		const playerEntity = ref.find(this.Player!);

		//parry anim depends on currentitem. this skill gets destroyed and re-requipped everytime you change item
		this.currentitem = world.get(playerEntity!, pair(Components.CurrentlyEquipped, Wildcard));

		this.itemViewmodelTracks = ANIMATION_IDS.viewmodel[this.currentitem as keyof typeof ANIMATION_IDS.viewmodel];
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.WaitForChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}

		if (this.itemViewmodelTracks && "parrying" in this.itemViewmodelTracks) {
			AnimationUtils.preloadAnimations(this.viewmodel, [this.itemViewmodelTracks.parrying]);
		}
	}

	protected OnStartServer(): void {
		const playerEntity = ref.find(this.Player!);

		this.currentitem = world.get(playerEntity!, pair(Components.CurrentlyEquipped, Wildcard));
		this.itemCharTracks = ANIMATION_IDS.item[this.currentitem as keyof typeof ANIMATION_IDS.item];

		if (this.itemCharTracks && "parrying" in this.itemCharTracks) {
			AnimationUtils.preloadAnimations(this.Player!.Character!, [this.itemCharTracks.parrying]);
		}
	}

	startParry() {
		if (this.itemViewmodelTracks && "parrying" in this.itemViewmodelTracks) {
			this.parrying = true;
			this.changeServerParryingState(true);
			this.vmParryTrack = AnimationUtils.loadAnim(
				this.viewmodel as Model,
				"parry",
				this.itemViewmodelTracks.parrying,
			);
			// print("start parrying, ", this.vmParryTrack?.Priority, this.vmParryTrack?.Name, this.currentitem);
		} else {
			print("item lacking a parry track, can't parry :/");
			return;
		}
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	changeServerParryingState(state: boolean) {
		this.parrying = state;

		if (this.itemCharTracks && "parrying" in this.itemCharTracks) {
			// print(this.parrying);
			if (this.parrying) {
				this.charParryingTrack = AnimationUtils.loadAnim(
					this.Player!.Character! as Model,
					"parry",
					this.itemCharTracks.parrying,
				);
			} else {
				this.charParryingTrack?.Stop();
			}
		}
	}

	stopParry() {
		this.parrying = false;
		this.changeServerParryingState(false);
		// print("stop parrying");
		this.vmParryTrack?.Stop();
	}

	protected OnConstructClient(): void {
		this.Destroyed.Connect(() => {
			this.parrying = false;
			this.vmParryTrack?.Stop();
		});
	}

	protected OnConstructServer(): void {
		this.Destroyed.Connect(() => {
			this.parrying = false;
			this.charParryingTrack?.Stop();
		});
	}
}
