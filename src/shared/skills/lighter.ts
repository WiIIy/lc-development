import { CollectionService, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { createFirePool } from "./throw";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { enableDisableParticlesLights } from "shared/utils/visual/toggleParticlesNLights";

@SkillDecorator
export class Lighter extends Skill {
	viewmodel: typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel | undefined;
	characterLighter: Model | undefined;
	viewmodelLighter: Model | undefined;
	on: boolean = false;

	private oilConn?: RBXScriptConnection;

	lighterMarker = {
		click: () => {
			if (RunService.IsServer()) {
				const openSound = this.characterLighter
					?.FindFirstChild("handle")
					?.FindFirstChild("zippo_open") as Sound;
				openSound.Play();
			}
		},

		light: () => {
			if (RunService.IsServer()) {
				if (!this.characterLighter) return;
				this.on = true;
				enableDisableParticlesLights(this.characterLighter, true);

				const lightSound = this.characterLighter?.FindFirstChild("handle")?.FindFirstChild("light") as Sound;
				lightSound.Play();

				this.disableCharacterParticlesOnClient();
				this.oilConn = RunService.Heartbeat.Connect(() => this.checkForOil());
			}

			if (RunService.IsClient()) {
				if (!this.viewmodelLighter) return;
				this.on = true;
				enableDisableParticlesLights(this.viewmodelLighter, true);
			}
		},
	};

	protected OnStartClient(): void {
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.FindFirstChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}

		this.viewmodelLighter = this.viewmodel.FindFirstChild("Lighter") as Model;

		AnimationUtils.preloadAnimations(this.viewmodel, [
			ANIMATION_IDS.viewmodel.Lighter.lighting,
			ANIMATION_IDS.viewmodel.Lighter.lighting2,
			ANIMATION_IDS.viewmodel.Lighter.idling,
			ANIMATION_IDS.viewmodel.Lighter.idling_on,
		]);
	}

	protected OnStartServer(): void {
		AnimationUtils.preloadAnimations(this.Player!.Character!, [
			ANIMATION_IDS.item.Lighter.lighting,
			ANIMATION_IDS.item.Lighter.lighting2,
			ANIMATION_IDS.item.Lighter.idling,
			ANIMATION_IDS.item.Lighter.idling_on,
		]);

		this.characterLighter = this.Player!.Character!.FindFirstChild("Lighter") as Model;
	}

	light() {
		if (this.on) {
			this.on = false; //turn off
			AnimationUtils.stopAnim(this.viewmodel!, "on_idle");
			this.serverLight(true);
			enableDisableParticlesLights(this.viewmodelLighter!, false);
			return;
		}
		//turn on
		// this.on = true;
		AnimationUtils.loadAnim(this.viewmodel!, "on_idle", ANIMATION_IDS.viewmodel.Lighter.idling_on, 0, true);
		AnimationUtils.loadAnim(
			this.viewmodel!,
			"light",
			ANIMATION_IDS.viewmodel.Lighter.lighting2,
			0,
			false,
			this.lighterMarker,
		);
		this.serverLight(false);
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverLight(turnOff: boolean) {
		if (turnOff) {
			this.on = false;

			AnimationUtils.stopAnim(this.Player!.Character!, "on_idle");
			enableDisableParticlesLights(this.characterLighter!, false);

			this.oilConn?.Disconnect();
			this.oilConn = undefined;
			return;
		}

		// start lighting sequence (but NOT on yet)
		AnimationUtils.loadAnim(
			this.Player!.Character!,
			"light",
			ANIMATION_IDS.item.Lighter.lighting2,
			0,
			false,
			this.lighterMarker,
		);
	}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	disableCharacterParticlesOnClient() {
		this.characterLighter = this.Player!.Character!.FindFirstChild("Lighter") as Model;
		enableDisableParticlesLights(this.characterLighter!, false);
	}

	private checkForOil() {
		if (!this.characterLighter) return;

		//dont use model.getpivot()
		const ooh = this.Player!.Character!.FindFirstChild("Lighter")?.FindFirstChild("handle") as BasePart;
		const lighterPos = ooh.Position;

		const overlapParams = new OverlapParams();
		overlapParams.FilterType = Enum.RaycastFilterType.Include;
		overlapParams.FilterDescendantsInstances = CollectionService.GetTagged("OilPuddle");

		const oilPuddlesNearby = Workspace.GetPartBoundsInRadius(lighterPos, 10, overlapParams);

		for (const part of oilPuddlesNearby) {
			CollectionService.RemoveTag(part, "OilPuddle");

			const pos = part.Position;
			const normal = (part.GetAttribute("SurfaceNormal") as Vector3) ?? new Vector3(0, 1, 0);

			part.Destroy();
			createFirePool(pos, normal, 15);
		}
	}

	protected OnConstructServer(): void {
		this.Destroyed.Connect(() => {
			this.on = false;
			this.oilConn?.Disconnect();
			this.oilConn = undefined;
		});
	}

	protected OnConstructClient(): void {
		this.Destroyed.Connect(() => {
			const viewmodel = Workspace.CurrentCamera?.WaitForChild("BaseViewmodel") as Model;
			AnimationUtils.clearAllAnimations(viewmodel, 0.2, ["carrying"]);
		});
	}
}
