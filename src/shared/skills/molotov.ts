import { Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { hotbarLocked } from "shared/atoms";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { ItemAssets, ItemContainer } from "shared/data/InventoryState";
import {
	THROWABLE_SETTINGS,
	ThrowableBehavior,
	ThrowablCaster,
	THROWABLE_CONTAINER,
} from "shared/data/ThrowableSettings";
import { ServerContext } from "shared/ServerContext";
import { AnimationUtils } from "shared/utils/animationUtil";
import { enableDisableParticlesLights } from "shared/utils/enableDisableParticlesLights";
import { getPlayersCururentlyHeldItem } from "shared/utils/getPlayersCurrentlyHeldItemm";
import { sayMonologue } from "shared/utils/sayMonologue";

@SkillDecorator
export class Molotov extends Skill {
	lighterModelTemplate: Model = ItemContainer.LighterL as BaseItemModel;
	viewmodel: typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel | undefined;

	lighterAnimIdsVm = ANIMATION_IDS.viewmodel.Lighter;
	molotovAnimIdsVm = ANIMATION_IDS.viewmodel.Molotov;
	lighterAnimIdsChar = ANIMATION_IDS.item.Lighter;
	molotovAnimIdsChar = ANIMATION_IDS.item.Molotov;

	charLightingTrack: AnimationTrack | undefined;
	vmLightingTrack: AnimationTrack | undefined;

	charMolotovLightingTrack: AnimationTrack | undefined;
	vmMolotovLightingTrack: AnimationTrack | undefined;

	charMolotovWindingTtrack: AnimationTrack | undefined;
	vmMolotovWindingTrack: AnimationTrack | undefined;

	characterMolotov: Model | undefined;
	viewmodelMolotov: Model | undefined;

	characterLighter: Model | undefined;
	viewmodelLighter: Model | undefined;

	molotovIsLit: boolean = false;
	beingWind: boolean = false;
	windStartTime: number = 0;
	// holding: boolean = false;

	lighterMarker = {
		light: () => {
			if (RunService.IsServer()) {
				if (!this.characterLighter) {
					print("no char lighter"); //prints on the client, intended
					return;
				}

				print("enable lights char"); //doesnt print
				enableDisableParticlesLights(this.characterLighter, true);
				this.disableCharacterParticlesOnClient();
				if (this.characterMolotov) {
					task.delay(0.2, () => {
						enableDisableParticlesLights(this.characterMolotov!, true);
						this.molotovIsLit = true;
						this.disableCharacterParticlesOnClient();
					});
				}
			}

			if (RunService.IsClient()) {
				if (!this.viewmodelLighter) {
					print("no vm lighter"); //prints on the server, intended
					return;
				}

				if (this.viewmodelMolotov) {
					task.delay(0.1, () => {
						enableDisableParticlesLights(this.viewmodelMolotov!, true);
						hotbarLocked(true);
						this.molotovIsLit = true;
					});
				}
			}
		},
	};

	windMarker = {
		hold: () => {
			if (RunService.IsServer()) {
				this.charMolotovWindingTtrack?.AdjustSpeed(0);
			}

			if (RunService.IsClient()) {
				print("wind");
				this.vmMolotovWindingTrack?.AdjustSpeed(0);
			}
		},
	};

	protected OnStartClient(): void {
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.WaitForChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}

		AnimationUtils.preloadAnimations(this.viewmodel, [
			this.lighterAnimIdsVm.lighting,
			this.molotovAnimIdsVm.lighting,
			this.molotovAnimIdsVm.winding,
			this.molotovAnimIdsVm.throwing,
		]);

		this.clientExecuteServerCode();
	}

	protected OnStartServer(): void {
		AnimationUtils.preloadAnimations(this.Player!.Character!, [
			this.lighterAnimIdsChar.lighting,
			this.molotovAnimIdsChar.winding,
			this.molotovAnimIdsChar.throwing,
		]);
		this.serverExecuteClientCode();
	}

	light() {
		if (this.molotovIsLit) return;
		if (!this.viewmodel) return;
		if (this.vmLightingTrack) return; //already lighting
		//check inventory for lighter item or equipped skill for "Firebug"
		//if not, say
		sayMonologue("Need a lighter...");
		//else
		this.weldLighterToViewmodel();
		this.serverLight();

		this.viewmodelMolotov = this.viewmodel.FindFirstChild("Molotov") as Model;

		this.vmLightingTrack = AnimationUtils.loadAnim(
			this.viewmodel,
			"vmLight",
			ANIMATION_IDS.viewmodel.Lighter.lighting,
			0,
			false,
			this.lighterMarker,
		);
		//nudge molotov near fire
		this.vmMolotovLightingTrack = AnimationUtils.loadAnim(
			this.viewmodel,
			"vmLight",
			ANIMATION_IDS.viewmodel.Molotov.lighting,
			0.4,
			true,
		);
		this.vmLightingTrack?.Stopped.Connect(() => {
			this.viewmodelLighter?.Destroy();
			this.viewmodelLighter = undefined;
			this.vmMolotovLightingTrack?.Stop();
		});
	}

	wind() {
		if (!this.viewmodel) return;
		this.beingWind = true;
		this.windStartTime = os.clock();
		this.serverWind();
		this.vmMolotovWindingTrack = AnimationUtils.loadAnim(
			this.viewmodel,
			"winding",
			ANIMATION_IDS.viewmodel.Molotov.winding,
			0,
			false,
			this.windMarker,
		);
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverWind() {
		this.charMolotovWindingTtrack = AnimationUtils.loadAnim(
			this.Player!.Character!,
			"winding",
			ANIMATION_IDS.item.Molotov.winding,
			0,
			false,
			this.windMarker,
		);
	}

	throw() {
		if (!this.beingWind) return;
		this.vmMolotovWindingTrack = undefined;
		hotbarLocked(false);
		this.beingWind = false;

		const holdDuration = os.clock() - this.windStartTime;

		AnimationUtils.loadAnim(this.viewmodel!, "throw", ANIMATION_IDS.viewmodel.Molotov.throwing, 0, false);

		// Calculate force multiplier (0.5x force for tap, up to 1.5x force for 4 seconds)
		const minForce = 0.4;
		const maxForce = 0.9;

		const t = math.clamp(holdDuration / 2, 0, 1);
		const forceMultiplier = minForce + t * (maxForce - minForce);
		const mouse = Players.LocalPlayer.GetMouse();
		const targetPos = mouse.Hit.Position;
		const char = Players.LocalPlayer.Character;
		const head = char?.FindFirstChild("Head") as BasePart;
		const origin = head ? head.Position : Workspace.CurrentCamera!.CFrame.Position;

		// Clean up viewmodel molotov locally immediately so it looks responsive
		if (this.viewmodelMolotov) {
			this.viewmodelMolotov.Destroy();
			this.viewmodelMolotov = undefined;
		}

		this.serverThrow(origin, targetPos, forceMultiplier);
	}

	@Message({ Type: "Event", Destination: "Server" })
	serverThrow(origin: Vector3, targetPos: Vector3, forceMultiplier: number) {
		this.projectileThrowVisuals(origin, targetPos, forceMultiplier);
		this.charMolotovWindingTtrack = undefined;

		AnimationUtils.loadAnim(this.Player!.Character!, "throw", ANIMATION_IDS.item.Molotov.throwing, 0, false);

		// Clean up character molotov on the server
		if (this.characterMolotov) {
			this.characterMolotov.Destroy();
			this.characterMolotov = undefined;
			this.molotovIsLit = false;
		}

		const invService = ServerContext.InventoryService;
		if (!invService) {
			return;
		}
		const slotToClear = invService.getCurrentHotbarSlot(this.Player!);

		task.delay(0.2, () => {
			if (slotToClear !== undefined) {
				invService?.removeItemFromProfile(this.Player!, slotToClear);
				this.Character.GetSkillFromConstructor(Molotov)?.Destroy();
			}
		});
	}

	private projectileThrowVisuals(origin: Vector3, targetPosition: Vector3, forceMultiplier: number) {
		const player = this.Character.Player;
		if (!player) return;

		const settings = THROWABLE_SETTINGS.Molotov;

		// Use the ItemAssets pattern you used in throw.ts
		// For the sake of this code, assuming ItemAssets["Molotov"] exists
		const projectileTemplate = ItemAssets["Molotov"]! as BaseItemModel;
		const projectile = projectileTemplate.Clone();

		if (projectile.FindFirstChild("viewmodelweld")) projectile.viewmodelweld.Destroy();
		if (projectile.FindFirstChild("characterweld")) projectile.characterweld.Destroy();
		if (!projectile.PrimaryPart && projectile.FindFirstChild("handle")) {
			projectile.PrimaryPart = projectile.handle;
		}

		const castParams = new RaycastParams();
		castParams.FilterType = Enum.RaycastFilterType.Exclude;
		castParams.FilterDescendantsInstances = [player.Character!, projectile];

		ThrowableBehavior.RaycastParams = castParams;
		ThrowableBehavior.MaxDistance = settings.MAX_DISTANCE;
		ThrowableBehavior.Acceleration = settings.GRAVITY;
		ThrowableBehavior.CosmeticBulletContainer = undefined;
		ThrowableBehavior.CosmeticBulletTemplate = undefined;

		const direction = targetPosition.sub(origin).Unit;

		// Apply the force multiplier to the velocity
		const finalVelocity = settings.VELOCITY * forceMultiplier;

		const activeCast = ThrowablCaster.Fire(origin, direction, direction.mul(finalVelocity), ThrowableBehavior);

		activeCast.UserData = {
			projectile: projectile,
			throwable: "Molotov",
			settings: settings,
			char: this.Player?.Character,
		};
		projectile.Parent = THROWABLE_CONTAINER;

		projectile.PivotTo(CFrame.lookAt(origin, origin.add(direction)).mul(settings.ROTATION_OFFSET));
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverLight() {
		this.weldLighterToCharacter();
		this.characterMolotov = this.Player!.Character!.FindFirstChild("Molotov") as Model;

		this.charLightingTrack = AnimationUtils.loadAnim(
			this.Player!.Character!,
			"charLight",
			ANIMATION_IDS.item.Lighter.lighting,
			0,
			false,
			this.lighterMarker,
		);
		this.charLightingTrack?.Stopped.Connect(() => {
			this.characterLighter?.Destroy();
			this.characterLighter = undefined;
		});
		this.disableCharacterParticlesOnClient();
	}

	weldLighterToCharacter() {
		const characterLighter = this.lighterModelTemplate.Clone() as BaseItemModel;
		this.characterLighter = characterLighter;
		const lArm = this.Player!.Character!.WaitForChild("Left Arm") as BasePart;
		if (!lArm) return;
		characterLighter.Parent = this.Player!.Character!;
		characterLighter.characterweld.Part0 = lArm;
		characterLighter.characterweld.Part1 = characterLighter.handle;
	}

	weldLighterToViewmodel() {
		if (!this.viewmodel) return;
		const viewmodelLighter = this.lighterModelTemplate.Clone() as BaseItemModel;
		this.viewmodelLighter = viewmodelLighter;
		viewmodelLighter.Parent = this.viewmodel;
		viewmodelLighter.viewmodelweld.Part0 = this.viewmodel.LeftArmLower;
		viewmodelLighter.viewmodelweld.Part1 = viewmodelLighter.handle;
	}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	disableCharacterParticlesOnClient() {
		this.characterLighter = this.Player!.Character!.FindFirstChild("LighterL") as Model;
		this.characterMolotov = this.Player!.Character!.FindFirstChild("Molotov") as Model;
		enableDisableParticlesLights(this.characterLighter!, false);
		enableDisableParticlesLights(this.characterMolotov!, false);
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	clientExecuteServerCode() {}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	serverExecuteClientCode() {}

	protected OnConstructClient(): void {
		this.Destroyed.Connect(() => {
			const viewmodel = Workspace.CurrentCamera?.WaitForChild("BaseViewmodel") as Model;
			this.vmMolotovWindingTrack?.Stop();
			this.vmLightingTrack?.Stop();
			AnimationUtils.clearAllAnimations(viewmodel, 0.2, ["carrying"]);
		});
	}

	protected OnConstructServer(): void {
		this.Destroyed.Connect(() => {
			// AnimationUtils.clearAllAnimations(this.Player?.Character as Model, 0.2);
		});
	}
}
