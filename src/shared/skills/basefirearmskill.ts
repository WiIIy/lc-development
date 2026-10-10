//basefirearmskill gives firearms basic behaviors such as:
// aiming
// shooting
// climb/recoil
// bullet hole
// vfx

import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { Debris, HttpService, Players, ReplicatedStorage, RunService, TweenService, Workspace } from "@rbxts/services";
import { ClientContext } from "shared/ClientContext";
import { Entity, pair, Wildcard } from "@rbxts/jecs";
import Components from "shared/components/components";
import world from "shared/world";
import { ref } from "@willy/jecs-utils";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { FirearmCaster, FIREARM_SETTINGS, FirearmBehavior, BULLET_CONTAINER, RANDOM_CASING_DIRECTION } from "shared/data/items/stats/gunStats";
import { ServerContext } from "shared/ServerContext";
import { isAiming } from "shared/sharedAtoms";
import { getPlayersCururentlyHeldItem } from "shared/utils/ecs/getHeldItem";
import { mouseRaycast } from "shared/utils/input/mouseRaycast";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { breakLocalGlass } from "shared/utils/visual/breakLocalGlass";
import CameraShaker from "@rbxts/camera-shaker";

FirearmCaster.RayHit.Connect((cast, result, velocity) => {
	const data = cast.UserData as {
		firearmName: string;
		settings: typeof FIREARM_SETTINGS.M10;
		char: Model;
		origin: Vector3;
	};
	const shooter = cast.RayInfo.Parameters.FilterDescendantsInstances[0];
	if (shooter !== data.char) {
		print(shooter, data.char);
		print("shooter not this one");
		return;
	}

	const hitPart = result.Instance;
	const hitPosition = result.Position;
	const hitNormal = result.Normal;

	// print(hitPart);

	const firearmName = (cast.UserData as { firearmName: string }).firearmName;
	const origin = (cast.UserData as { origin: Vector3 }).origin;
});

function createBulletHole(result: RaycastResult, bulletHoleSize: Vector3, bulletholeDecalId: string) {
	if (!result || !result.Instance || !result.Instance.IsA("BasePart")) return;

	const hitPart = result.Instance as BasePart;

	// Create bullet hole
	const bulletHole = new Instance("Part");
	bulletHole.Name = "BulletHole";
	bulletHole.Size = bulletHoleSize;
	bulletHole.CanCollide = false;
	bulletHole.Anchored = false;
	bulletHole.Massless = true;
	bulletHole.Transparency = 1;

	// Position + orientation
	const offsetPos = result.Position.add(result.Normal.mul(bulletHole.Size.Z / 2 + 0.005));
	bulletHole.CFrame = CFrame.lookAt(offsetPos, offsetPos.add(result.Normal));

	// Decal
	const decal = new Instance("Decal");
	decal.Texture = bulletholeDecalId;
	decal.Face = Enum.NormalId.Front;
	decal.Parent = bulletHole;

	// Parent FIRST before welding
	bulletHole.Parent = hitPart;

	// Weld
	const weld = new Instance("WeldConstraint");
	weld.Part0 = bulletHole;
	weld.Part1 = hitPart;
	weld.Parent = bulletHole;

	// Cleanup
	Debris.AddItem(bulletHole, 10);
}

@SkillDecorator
export class BaseFirearmSkill extends Skill {
	// --- State ---
	magOut = false;
	protected isAiming = false;
	protected firearmSettings: typeof FIREARM_SETTINGS[keyof typeof FIREARM_SETTINGS] | undefined;
	protected muzzleAttachment: Attachment | undefined;
	protected ejectAttachment: Attachment | undefined;
	protected firearmName: string | undefined;

	protected viewmodel: Model | undefined;
	protected viewmodelFiringTrack: AnimationTrack | undefined;
	protected charFiringTrack: AnimationTrack | undefined;
	protected charAimingTrack: AnimationTrack | undefined;

	protected vmAimingTrack: AnimationTrack | undefined;
	protected serverHandle: BasePart | undefined;
	protected fireSound: Sound | undefined;

	//state tracking to control which animations play, mostly during firing
	private lastFireTime = 0;
	private idleTimeout = 1;
	private isFiring = false;

	vmAnimationSet: typeof ANIMATION_IDS.viewmodel[keyof typeof ANIMATION_IDS.viewmodel] | undefined;
	charAnimationSet: typeof ANIMATION_IDS.item[keyof typeof ANIMATION_IDS.item] | undefined;
	m1held: boolean = false;
	VisualsRemote: RemoteEvent | undefined;

	// --- Aiming Vars ---
	private currentAimAlpha = 0;
	private aimSpeed = 15;
	private targetAimOffset = new CFrame();
	private readonly SIGHT_DISTANCE = new CFrame(0, 0, 2);
	private renderConnection: RBXScriptConnection | undefined;

	private serverItemEntity: Entity | undefined;

	protected OnStartServer(): void {
		const player = this.Character.Player;

		if (!player) return;
		const VisualsRemote = ReplicatedStorage.WaitForChild("shared/network@GlobalEvents").WaitForChild(
			"visualsRemote",
		) as RemoteEvent;
		this.VisualsRemote = VisualsRemote;

		this.setupGunData(player);

		const animationSet = ANIMATION_IDS.item[this.firearmName as keyof typeof ANIMATION_IDS.item];

		if (animationSet && this.Player?.Character) {
			this.charAnimationSet = animationSet;
			this.preloadSet(this.Player.Character, animationSet as Record<string, string>);
		}
	}

	protected OnStartClient(): void {
		const vmController = ClientContext.ViewmodelController;
		if (!vmController || !vmController.item) {
			print("nah");
			return;
		}

		const player = this.Character.Player;
		if (!player) return;

		this.setupGunData(player);

		if (!this.viewmodel) {
			print("no vm");
			return;
		}

		const vmanimationSet = ANIMATION_IDS.viewmodel[this.firearmName as keyof typeof ANIMATION_IDS.viewmodel];

		const charAnimationSet = ANIMATION_IDS.item[this.firearmName as keyof typeof ANIMATION_IDS.item];

		if (vmanimationSet && this.viewmodel) {
			this.vmAnimationSet = vmanimationSet;
			this.preloadSet(this.viewmodel, charAnimationSet as Record<string, string>);
		}

		if (charAnimationSet && this.Player?.Character) {
			this.charAnimationSet = charAnimationSet;
			this.preloadSet(this.Player.Character, charAnimationSet as Record<string, string>);
		}

		const VisualsRemote = ReplicatedStorage.WaitForChild("shared/network@GlobalEvents").WaitForChild(
			"visualsRemote",
		) as RemoteEvent;
		this.VisualsRemote = VisualsRemote;

		VisualsRemote.OnClientEvent.Connect((shooter: Player, origin: Vector3, hit: Vector3, casingName?: string) => {
			if (shooter !== Players.LocalPlayer) {
				this.createTracer(origin, hit);
			} else {
				// I am the shooter. If a casing name was sent, find it and hide it.
				if (casingName !== undefined) {
					// Use WaitForChild with a short timeout (e.g., 1 second) to handle the replication lag
					const serverCasing = Workspace.Containers.BulletContainer.WaitForChild(casingName, 1) as BasePart | undefined;

					if (serverCasing) {
						serverCasing.Transparency = 1;
						serverCasing.CanCollide = false; // Optional: prevent physics interference
					}
				}
			}
		});
	}

	private setupGunData(player: Player) {
		const playerEntity = ref.find(player);
		const item = getPlayersCururentlyHeldItem(player) as string;
		if (item === undefined) {
			print("no item");
			return;
		}

		this.firearmSettings = FIREARM_SETTINGS[item as keyof typeof FIREARM_SETTINGS];
		// print(item);
		// print(this.firearmSettings);

		// Find model (Logic simplified for brevity)
		if (RunService.IsServer()) {
			const itemEntity = world.target(playerEntity!, Components.CurrentlyEquipped);
			const modelComponent = world.get(itemEntity!, Components.ItemModel);
			const handle = modelComponent?.baseModel.handle;

			this.firearmName = item;
			this.serverHandle = handle;
			this.muzzleAttachment = handle?.FindFirstChild("Muzzle") as Attachment;
			this.ejectAttachment = handle?.FindFirstChild("Eject") as Attachment;

			this.serverItemEntity = itemEntity;
		}

		if (RunService.IsClient()) {
			const baseVm = Workspace.CurrentCamera?.FindFirstChild("BaseViewmodel") as Model;
			const itemModel = baseVm.FindFirstChild(item) as Model;
			const handle = itemModel.FindFirstChild("handle") as BasePart;
			const muzzle = handle.FindFirstChild("Muzzle") as Attachment;

			this.firearmName = item;
			this.ejectAttachment = handle.FindFirstChild("Eject") as Attachment;
			this.muzzleAttachment = muzzle;
			this.viewmodel = baseVm;
		}
	}

	protected attemptFire(targetPosition: Vector3) {
		if (!this.muzzleAttachment) {
			print("no muzzle");
			return;
		}
		// print(this.firearmSettings)
		if (this.magOut) return;

		if (!this.firearmSettings) {
			print("no settings");
			return;
		}

		const currentFireTime = os.clock();
		this.lastFireTime = currentFireTime;

		const origin = this.muzzleAttachment.WorldCFrame.Position;
		if (this.vmAnimationSet && "firing" in this.vmAnimationSet) {
			this.viewmodelFiringTrack = AnimationUtils.loadAnim(
				this.viewmodel as Model,
				"firing",
				this.vmAnimationSet.firing,
			);
		}

		if (this.charAnimationSet && "firing" in this.charAnimationSet) {
			this.charFiringTrack = AnimationUtils.loadAnim(
				this.Player!.Character!,
				"firing",
				this.charAnimationSet.firing,
			);
		}

		let tracksFinished = 0;
		let expectedTracks = 0;

		const onTrackFinished = () => {
			tracksFinished++;
			// Only go to aiming pose if all tracks finished AND we haven't fired a new shot
			if (tracksFinished >= expectedTracks && this.lastFireTime === currentFireTime) {
				this.enterPostFireAim();
			}
		};

		if (this.viewmodelFiringTrack) {
			expectedTracks++;
			this.viewmodelFiringTrack.Stopped.Once(onTrackFinished);
		}
		if (this.charFiringTrack) {
			expectedTracks++;
			this.charFiringTrack.Stopped.Once(onTrackFinished);
		}

		// Fallback in case there were no animations to play
		if (expectedTracks === 0) {
			this.enterPostFireAim();
		}

		const result = mouseRaycast(1000);

		const globalEvents = ReplicatedStorage.WaitForChild("shared/network@GlobalEvents") as Folder;
		const requestFirearmHit = globalEvents.WaitForChild("requestFirearmHit") as RemoteEvent;

		if (result && result.Instance) {
			requestFirearmHit.FireServer(result.Instance, result.Position, this.firearmName, origin);
		}

		if (result.Instance.CanQuery && result.Instance.Transparency === 0 && !result.Instance.IsA("Accessory")) {
			createBulletHole(result, this.firearmSettings.BULLET_HOLE_SIZE, this.firearmSettings.BULLET_HOLE_DECAL_ID);
		}

		// 4. Start the 1.5-second timeout to return to idle
		task.delay(this.idleTimeout, () => {
			// Check if exactly 1.5s has passed since the LAST shot recorded
			if (os.clock() - this.lastFireTime >= this.idleTimeout) {
				if (!this.isAiming) {
					this.stopAimingAnimations();
				}
			}
		});

		// 1. Client Visuals (Instant)
		this.createTracer(origin, targetPosition);
		if (this.ejectAttachment) {
			//some weapons dont eject casings such as revolvers
			this.createCasing(this.ejectAttachment.WorldCFrame);
		}

		this.climb();

		//in the case that it is glass. this simulates physics locally for immediate feedback
		const glassCheck = mouseRaycast(10000);
		if (
			glassCheck &&
			glassCheck.Instance &&
			glassCheck.Instance.Parent &&
			glassCheck.Instance.Parent.Name === "Glass" &&
			glassCheck.Instance.Parent.IsA("Model")
		) {
			breakLocalGlass(glassCheck.Instance.Parent, origin, glassCheck.Position);
		}

		const vmController = ClientContext.ViewmodelController;
		if (vmController) {
			vmController.shakeCamera(CameraShaker.Presets.Bump);
		}

		const direction = targetPosition.sub(origin).Unit;
		let muzzles: Vector3[];
		if (!this.firearmSettings) {
			print("no settings on client atemptFire");
			return;
		}

		let baseSpread: number;
		if ("MUZZLE_OFFSETS" in this.firearmSettings) {
			muzzles = this.firearmSettings.MUZZLE_OFFSETS;
		} else {
			muzzles = [Vector3.zero];
		}

		if ("SPREAD_ANGLE" in this.firearmSettings) {
			baseSpread = this.firearmSettings.SPREAD_ANGLE;
		} else {
			baseSpread = 0;
		}

		for (const offset of muzzles) {
			// 1. Calculate the true origin based on the attachment's CFrame
			const actualOrigin = this.muzzleAttachment!.WorldCFrame.PointToWorldSpace(offset);

			// 2. Apply spread
			const spreadDir = CFrame.Angles(
				math.random(-baseSpread, baseSpread),
				math.random(-baseSpread, baseSpread),
				0,
			).mul(direction);

			// 3. Fire the cast

			const castParams = new RaycastParams();
			castParams.FilterType = Enum.RaycastFilterType.Exclude;
			castParams.FilterDescendantsInstances = [this.Player!.Character!];

			FirearmBehavior.RaycastParams = castParams;
			FirearmBehavior.MaxDistance = this.firearmSettings.MAX_DISTANCE;
			FirearmBehavior.Acceleration = this.firearmSettings.GRAVITY;

			const activeCast = FirearmCaster.Fire(
				actualOrigin,
				spreadDir,
				spreadDir.mul(this.firearmSettings.VELOCITY),
				FirearmBehavior,
			);

			activeCast.UserData = {
				firearmName: this.firearmName,
				settings: this.firearmSettings,
				char: this.Player!.Character,
				origin: actualOrigin,
			};
		}

		//on second thought, make it clientside
		this.serverFire(origin, targetPosition);
	}

	private enterPostFireAim() {
		// Play aiming animations to create a "ready" stance, ensuring they aren't already playing
		if (this.charAnimationSet && "aiming" in this.charAnimationSet) {
			if (!this.charAimingTrack || !this.charAimingTrack.IsPlaying) {
				this.charAimingTrack = AnimationUtils.loadAnim(
					this.Player?.Character as Model,
					"aiming",
					this.charAnimationSet.aiming,
					0.05,
				);
			}
		}

		if (this.viewmodel && this.vmAnimationSet && "aiming" in this.vmAnimationSet) {
			if (!this.vmAimingTrack || !this.vmAimingTrack.IsPlaying) {
				this.vmAimingTrack = AnimationUtils.loadAnim(
					this.viewmodel as Model,
					"aiming",
					this.vmAnimationSet.aiming,
					0.2,
				);
			}
		}
	}

	private returnToIdle() {
		// Stop the aiming animations to let the lower-priority idle animation natively take over
		if (this.charAnimationSet && "aiming" in this.charAnimationSet) {
			AnimationUtils.stopAnim(this.Player?.Character as Model, "aiming", this.charAnimationSet.aiming);
		}

		if (this.viewmodel && this.vmAnimationSet && "aiming" in this.vmAnimationSet) {
			AnimationUtils.stopAnim(this.viewmodel as Model, "aiming", this.vmAnimationSet.aiming);
		}

		this.charAimingTrack = undefined;
		this.vmAimingTrack = undefined;
	}

	private stopAimingAnimations() {
		if (this.charAnimationSet && "aiming" in this.charAnimationSet) {
			AnimationUtils.stopAnim(this.Player!.Character as Model, "aiming", this.charAnimationSet.aiming);
		}

		if (this.viewmodel && this.vmAnimationSet && "aiming" in this.vmAnimationSet) {
			AnimationUtils.stopAnim(this.viewmodel as Model, "aiming", this.vmAnimationSet.aiming);
		}

		this.charAimingTrack = undefined;
		this.vmAimingTrack = undefined;
	}

	protected playSound(soundTemplate: Sound) {
		const clone = soundTemplate.Clone();
		if (!clone) {
			print("no fire sound");
			return;
		}

		clone.Parent = this.serverHandle;

		clone.PlaybackSpeed = clone.PlaybackSpeed * (0.95 + math.random() * 0.1);

		clone.Play();

		Debris.AddItem(clone, clone.TimeLength + 0.1);
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	private serverFire(origin: Vector3, targetPosition: Vector3) {
		const player = this.Character.Player;
		// print(player, this.firearmSettings, this.serverItemEntity, ServerContext.InventoryService);
		if (!player || !this.firearmSettings) return;

		if (this.serverItemEntity !== undefined) {
			const curr = world.get(this.serverItemEntity, Components.ChamberedAmmo) as number;
			world.set(this.serverItemEntity, Components.ChamberedAmmo, curr - 1);
			const invService = ServerContext.InventoryService;
			if (invService) {
				invService.updateClientInventory(player);
			}
		}

		this.playSound(this.firearmSettings?.FIRE_SOUND);
		const stimEntity = world.entity();
		world.set(stimEntity, Components.Stimulus, {
			stimulusType: "gunshot",
			channel: "auditory",
			position: origin,
			strength: this.firearmSettings.FIRE_SOUND_RADIUS,
			sender: player,
		});

		// 1. FastCast Logic
		// const castParams = new RaycastParams();
		// castParams.FilterType = Enum.RaycastFilterType.Exclude;
		// castParams.FilterDescendantsInstances = [player.Character!];

		// FirearmBehavior.RaycastParams = castParams;
		// FirearmBehavior.MaxDistance = this.firearmSettings.MAX_DISTANCE;
		// FirearmBehavior.Acceleration = this.firearmSettings.GRAVITY;

		// const direction = targetPosition.sub(origin).Unit;

		// const activeCast = FirearmCaster.Fire(
		// 	origin,
		// 	direction,
		// 	direction.mul(this.firearmSettings.VELOCITY),
		// 	FirearmBehavior,
		// );
		// activeCast.UserData = {
		// 	firearmName: this.firearmName,
		// 	settings: this.firearmSettings,
		// 	char: this.Player!.Character,
		// 	origin: origin,
		// };

		// Replicate visuals to all clients. The client-side logic ignores it if the shooter == LocalPlayer
		if (this.VisualsRemote === undefined) {
			print(":(");
			return;
		}

		let casingName: string | undefined = undefined;

		if (this.ejectAttachment) {
			const serverCasing = this.createCasing(this.ejectAttachment!.WorldCFrame);

			if (serverCasing) {
				casingName = HttpService.GenerateGUID(false);
				serverCasing.Name = casingName;
			}

			this.VisualsRemote.FireAllClients(player, origin, targetPosition, serverCasing!.Name); // 2. Give it a Unique ID if it exists
		}
	}

	// =========================================
	// VISUALS
	// =========================================

	// Unified tracer function (Used by both Client-shooter and Client-observer)
	protected createTracer(origin: Vector3, hitPosition: Vector3) {
		const tracerTemplate = this.firearmSettings?.TRACER;
		const flashTemplate = this.firearmSettings?.FLASH;
		const smokeTemplate = ReplicatedStorage.CAAssets.tracers.Smoke;
		if (!tracerTemplate || !flashTemplate || !smokeTemplate) return;

		const tracer = tracerTemplate.Clone() as Tracer;
		tracer.Start.Position = origin;
		tracer.End.Position = hitPosition;
		tracer.Parent = BULLET_CONTAINER;

		tracer.Start.Anchored = true;
		tracer.End.Anchored = true;

		const beam = tracer.Beam;

		const flash = flashTemplate.Clone() as typeof ReplicatedStorage.CAAssets.tracers.Flash;
		flash.Flash.Position = origin;
		flash.Parent = BULLET_CONTAINER;

		const smoke = smokeTemplate.Clone() as typeof ReplicatedStorage.CAAssets.tracers.Smoke;
		smoke.Smoke.Position = origin;
		smoke.Parent = BULLET_CONTAINER;

		// Start fully visible
		beam.Transparency = new NumberSequence(0);

		// Tween to invisible
		const tween = TweenService.Create(beam, new TweenInfo(0.3, Enum.EasingStyle.Linear), {
			Width0: 0,
			Width1: 0,
		});

		const smokeTween = TweenService.Create(smoke.Smoke.Smoke, new TweenInfo(0.3, Enum.EasingStyle.Linear), {
			Rate: 0,
		});

		tween.Play();
		smokeTween.Play();

		// Cleanup after fade completes
		task.delay(0.15, () => {
			flash.Destroy();
		});
		task.delay(0.35, () => {
			tracer.Destroy();
			smoke.Destroy();
		});
	}

	Aim(isActive: boolean) {
		if (this.magOut) return;
		this.isAiming = isActive;

		if (!this.charAnimationSet) return;
		if (!("aiming" in this.charAnimationSet)) {
			print("no aiming animation");
			return;
		}

		if (isActive) {
			isAiming(true);

			//head focuses on aiming
			// const neckRemote = ReplicatedStorage.WaitForChild("shared/network@GlobalEvents").WaitForChild("neckMovement") as UnreliableRemoteEvent;
			// const neckRemote = ReplicatedStorage["shared/network@GlobalEvents"].neckMovement;
			// neckRemote.FireServer(0, 1, 0, -90, -180, 0); //default head pos
			//BUGGY AS HELL. need to make it look good eventually, able to rotate body but not able to move head
			//this may be fixed tbh
			if (this.viewmodel && this.vmAnimationSet && "aiming" in this.vmAnimationSet) {
				this.vmAimingTrack = AnimationUtils.loadAnim(this.viewmodel, "aiming", this.vmAnimationSet.aiming, 0.2);
			}

			this.charAimingTrack = AnimationUtils.loadAnim(
				this.Player!.Character as Model,
				"aiming",
				this.charAnimationSet.aiming,
				0.2,
			);
		} else {
			this.stopAimingAnimations();
			isAiming(false);
			AnimationUtils.stopAnim(this.Player!.Character as Model, "aiming", this.charAnimationSet.aiming);
			if (this.viewmodel && this.vmAnimationSet && "aiming" in this.vmAnimationSet) {
				AnimationUtils.stopAnim(this.viewmodel! as Model, "aiming", this.vmAnimationSet.aiming); //not all guns have a vm aiming track
			}
			this.charAimingTrack = undefined;
			this.vmAimingTrack = undefined;
		}

		// Calculate offset only on the first time of aiming, next time just use exisitng values
		// If aimoffset is (0,0,0), it hasn't been set yet
		if (this.isAiming && this.targetAimOffset.Position.Magnitude === 0) {
			this.calculateAimOffset();
		}

		if (this.renderConnection === undefined) {
			this.renderConnection = RunService.RenderStepped.Connect((dt) => {
				this.updateAim(dt);
			});
		}
	}

	startShooting() {
		this.Start();
		this.m1held = true;
		this.performShooting();
	}

	stopShooting() {
		this.m1held = false;
	}

	protected performShooting() {
		// print("f", this.m1held, this.firearmSettings);
		if (!this.firearmSettings) return;

		const mouse = Players.LocalPlayer.GetMouse();

		while (this.m1held) {
			task.wait(this.firearmSettings.DELAY_BETWEEN_SHOTS);
			this.attemptFire(mouse.Hit.Position);
		}
	}

	// --- aiming stuff --- //

	// calculates where to move the humanoidrootpart for the aimpart to be perfectly center compared to the camera
	private calculateAimOffset() {
		const vmController = ClientContext.ViewmodelController;
		if (!vmController || !vmController.viewmodel || !vmController.item) return;

		const aimPart = vmController.item.FindFirstChild("AimPart") as BasePart;
		const rootPart = vmController.viewmodel.FindFirstChild("HumanoidRootPart") as BasePart;

		if (aimPart && rootPart) {
			// Calculate offset required to bring AimPart to the Viewmodel Root
			const relativeCF = rootPart.CFrame.ToObjectSpace(aimPart.CFrame); // AimPart is at (0,0,0) relative to Camera.
			this.targetAimOffset = relativeCF.Inverse();
		} else {
			print("Base Firearm Aim: 'AimPart' or 'RootPart' missing.");
		}
	}

	// updates the hrp location every second, smooth and lerp'd
	private updateAim(dt: number) {
		const vmController = ClientContext.ViewmodelController;
		if (!vmController) return;

		const targetAlpha = this.isAiming ? 1 : 0;
		this.currentAimAlpha = this.lerp(this.currentAimAlpha, targetAlpha, dt * this.aimSpeed);

		vmController.aimOffset = new CFrame().Lerp(this.targetAimOffset, this.currentAimAlpha); // Lerp the Centering Offset

		vmController.aimDistance = new CFrame().Lerp(this.SIGHT_DISTANCE, this.currentAimAlpha); // Lerp the Distance Offset (Moves camera back from sight)

		// Cleanup loop when fully unaimed
		if (!this.isAiming && this.currentAimAlpha < 0.01) {
			this.currentAimAlpha = 0;
			vmController.aimOffset = new CFrame();
			vmController.aimDistance = new CFrame();

			this.renderConnection?.Disconnect();
			this.renderConnection = undefined;
		}
	}

	private lerp(a: number, b: number, t: number) {
		return a + (b - a) * math.clamp(t, 0, 1);
	}

	// --- effects --- //
	createServerTracer(muzzlePosition: Vector3, hitPosition: Vector3) {
		const tracerTemplate = this.firearmSettings?.TRACER;
		if (tracerTemplate === undefined) return;
		const tracer = tracerTemplate?.Clone() as Tracer;

		if (!tracer) {
			print("no tracer template found");
			return;
		}

		tracer.Start.Position = muzzlePosition; //this needs to be invisible on the client
		tracer.End.Position = hitPosition;
		tracer.Parent = BULLET_CONTAINER;
	}

	createClientTracer(muzzlePosition: Vector3, hitPosition: Vector3) {
		const tracerTemplate = this.firearmSettings?.TRACER;
		const tracer = tracerTemplate?.Clone();

		if (!tracer) {
			print("no tracer template found");
			return;
		}

		tracer.Start.Position = muzzlePosition; //this needs to be invisible on the client
		tracer.End.Position = hitPosition;
		tracer.Parent = BULLET_CONTAINER;
	}

	createCasing(originCFrame: CFrame): BasePart | undefined {
		// Update return type
		const casingTemplate = this.firearmSettings?.CASING;
		if (!casingTemplate) return;

		if (RunService.IsServer()) {
			const casing = casingTemplate.Clone() as MeshPart;
			casing.CFrame = originCFrame;
			casing.Parent = Workspace.Containers.BulletContainer;
			casing.CanCollide = true;
			casing.Anchored = false;

			// Add physical "pop"
			const velocity = originCFrame.RightVector.mul(-5).add(originCFrame.UpVector.mul(15));
			casing.AssemblyLinearVelocity = velocity;
			casing.AssemblyAngularVelocity = new Vector3(math.random(10, 20), math.random(10, 20), math.random(10, 20));

			Debris.AddItem(casing, 10);
			return casing;
		}

		if (RunService.IsClient()) {
			const casing = casingTemplate.Clone() as MeshPart;
			casing.CFrame = originCFrame;
			casing.Parent = Workspace.Containers.BulletContainer;
			casing.CanCollide = true;
			casing.Anchored = false;

			const velocity = originCFrame.RightVector.mul(-5).add(originCFrame.UpVector.mul(15));
			casing.AssemblyLinearVelocity = velocity;
			casing.AssemblyAngularVelocity = RANDOM_CASING_DIRECTION;
			Debris.AddItem(casing, 10);
			return casing;
		}
	}

	climb() {
		if (!RunService.IsClient()) return;
		// print("clmb");

		const vmController = ClientContext.ViewmodelController;
		if (!vmController || !this.firearmSettings) return;

		// Safety check to ensure settings exist (if using strict typing you might need to cast)
		const recoilY = this.firearmSettings.RECOIL_STRENGTH ?? 10;
		const recoilX = this.firearmSettings.RECOIL_HORIZONTAL_MAX ?? 2;
		const damping = this.firearmSettings.RECOIL_DAMPING ?? 8;

		vmController.applyRecoil(recoilY, recoilX, damping); // Apply the impulse
	}

	takeoutInsertMag() {
		if (this.charAnimationSet && "magout" in this.charAnimationSet) {
			if (this.magOut) {
				AnimationUtils.stopAnim(this.Player!.Character!, "char_takeoutmag", this.charAnimationSet.magout);
			} else {
				AnimationUtils.loadAnim(this.Player!.Character!, "char_takeoutmag", this.charAnimationSet.magout);
			}
		} else {
			print("no character magout anim for firearm, ", this.firearmName);
		}

		if (this.vmAnimationSet && "magout" in this.vmAnimationSet) {
			if (this.magOut) {
				AnimationUtils.stopAnim(this.viewmodel!, "vm_magout", this.vmAnimationSet.magout, 0.01);
			} else {
				AnimationUtils.loadAnim(this.viewmodel!, "vm_magout", this.vmAnimationSet.magout, 0.01);
			}
		} else {
			print("no vm magout anim for firearm, ", this.firearmName);
		}

		this.magOut = !this.magOut;
	}
	@Message({
		Type: "Event",
		Destination: "Server",
	})
	private serverTakeoutInsertMag() {}

	protected OnConstructClient(): void {
		this.Destroyed.Connect(() => {
			const viewmodel = Workspace.CurrentCamera?.WaitForChild("BaseViewmodel") as Model;
			this.m1held = false;
			this.viewmodelFiringTrack?.Stop();
			this.vmAimingTrack?.Stop();
			AnimationUtils.clearAllAnimations(viewmodel, 0.2, ["carrying"]);
			this.isAiming = false;
			isAiming(false);
		});
	}
	protected OnConstructServer(): void {
		this.Destroyed.Connect(() => {
			this.isAiming = false;
			this.charFiringTrack?.Stop();
			this.charAimingTrack?.Stop();
			AnimationUtils.clearAllAnimations(this.Character.Humanoid.Parent as Model, 0.03, [
				"carrying",
				"dragging1",
				"dragging2",
			]);
			this.vmAimingTrack?.Stop();
		});
	}

	private preloadSet(model: Model, animSet: Record<string, string>) {
		for (const [_, id] of pairs(animSet)) {
			if (typeIs(id, "string") && id !== "") {
				AnimationUtils.preloadAnimations(model, [id]);
			}
		}
	}
}
