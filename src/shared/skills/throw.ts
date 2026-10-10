//fucking monolithic yo
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import world from "shared/world";
import { Debris, Players, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { Entity, pair, Wildcard } from "@rbxts/jecs";
import Components from "shared/components/components";
import Make from "@rbxts/make";
import { ActiveCast } from "@rbxts/fastcast";
import { ServerContext } from "shared/ServerContext";
import { ref } from "@willy/jecs-utils";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { ItemAssets } from "shared/data/items/modelassets";
import { ThrowablCaster, THROWABLE_SETTINGS, THROWABLE_CONTAINER, ThrowableBehavior } from "shared/data/items/stats/throwableStats";
import { getPlayersCururentlyHeldItem } from "shared/utils/ecs/getHeldItem";
import { AnimationUtils } from "shared/utils/visual/animationUtil";

//caster is OUTSIDE of the skill because we dont want to create multiple instances
//this also allows the trajectory continue whether the skill is deleted or not.
let conncount = 0;
ThrowablCaster.RayHit.Connect((cast, result, velocity) => {
	if (RunService.IsServer()) {
		const data = cast.UserData as {
			projectile: Model & { handle: BasePart };
			throwable: string;
			settings: typeof THROWABLE_SETTINGS[keyof typeof THROWABLE_SETTINGS]; // Fix type to allow any setting
			char: Model;
		};

		const hitPart = result.Instance;
		const hitPosition = result.Position;
		const hitNormal = result.Normal;
		const head = data.char.FindFirstChild("Head") as BasePart;
		const origin = head ? head.Position : Workspace.CurrentCamera!.CFrame.Position;
		const projectile = data.projectile;

		if (!hitPart) return;

		// Damage accessory/humanoid logic
		const hitModel = hitPart.FindFirstAncestorOfClass("Model");
		const humanoid = hitModel?.FindFirstChildOfClass("Humanoid");

		const dmgService = ServerContext.DamageService;
		// print(dmgService);
		if (!dmgService) {
			return;
		}

		if (result && hitModel && humanoid) {
			// print("PROCESSING");
			dmgService.processHit({
				targetModel: hitModel,
				hitPart: hitPart as BasePart,
				baseDamage: data.settings.DAMAGE as number,
				damageType: data.throwable === "Molotov" ? "Fire" : "Pierce",
				origin: origin,
				hitPosition: hitPosition,
				weaponStats: data.settings,
			});
		}

		if (!projectile) return;

		// Check if it should embed (Knives/Rats) or shatter (Molotov)
		if (data.settings.EMBEDDED) {
			createEmbeddedProjectile(
				projectile,
				hitPosition,
				hitNormal,
				origin,
				data.settings.ROTATION_OFFSET,
				hitPart as BasePart,
				cast,
			);
		} else {
			// NON-EMBEDDED LOGIC (e.g., Molotov)
			if (data.throwable === "Molotov") {
				createFirePool(hitPosition, hitNormal, 10);
			}
			// Destroy the moving projectile since it shatters on impact
			projectile.Destroy();
		}
	}
});

ThrowablCaster.LengthChanged.Connect((cast, lastPoint, rayDir, displacement, segmentVelocity) => {
	if (RunService.IsServer()) {
		const data = cast.UserData as {
			projectile: Model & { handle: BasePart };
			throwable: string;
			settings: typeof THROWABLE_SETTINGS.Knife;
			char: Model;
		};

		conncount += 1;
		// print("[LENGTH CHANGED connection fires again. item: ", data.throwable, "] _hit", conncount); //sometimes this fires multiple

		if (data.projectile && data.projectile.PrimaryPart) {
			const newPos = lastPoint.add(rayDir.mul(displacement));

			data.projectile.PivotTo(CFrame.lookAt(newPos, newPos.add(rayDir)).mul(data.settings.ROTATION_OFFSET));
		}
	}
});

ThrowablCaster.CastTerminating.Connect((cast) => {
	const data = cast.UserData as {
		projectile: Model;
		throwable: string;
		settings: typeof THROWABLE_SETTINGS.Knife;
	};
	if (data.projectile) {
		data.projectile.Destroy();
	}
});

function createEmbeddedProjectile(
	projectileTemplate: Model,
	hitPosition: Vector3,
	normal: Vector3,
	origin: Vector3,
	offset: CFrame,
	hitPart: BasePart,
	cast: ActiveCast,
) {
	const data = cast.UserData as {
		projectile: Model & { handle: BasePart };
		throwable: string;
		settings: typeof THROWABLE_SETTINGS.Knife;
		char: Model;
	};

	const embeddedProjectile = projectileTemplate.Clone() as BaseItemModel;
	embeddedProjectile.Name = "embeddedProjectile";
	embeddedProjectile.handle.CanCollide = false;
	embeddedProjectile.handle.Anchored = true;

	const direction = hitPosition.sub(origin).Unit;

	const offsetPos = hitPosition.add(normal.mul(embeddedProjectile.handle.Size.Z / 2 + 0.005)); // Calculate position slightly off the wall

	const trajectoryCFrame = CFrame.lookAt(offsetPos, offsetPos.add(direction));

	embeddedProjectile.PrimaryPart!.CFrame = trajectoryCFrame.mul(offset);

	embeddedProjectile.Parent = THROWABLE_CONTAINER;

	const weld = Make("WeldConstraint", {
		Part0: hitPart,
		Part1: embeddedProjectile.handle,
		Parent: embeddedProjectile,
	});
	task.wait(1);
	embeddedProjectile.handle.Anchored = false;
	Debris.AddItem(embeddedProjectile, data.settings.DESPAWN_TIME);
	Debris.AddItem(weld, data.settings.DESPAWN_TIME);
}

export function createFirePool(position: Vector3, normal: Vector3, duration: number) {
	const template = ReplicatedStorage.CAAssets.effects.Flame as BasePart;
	print("pool");
	const pool = template.Clone();
	pool.Parent = Workspace;
	pool.Name = "Part";
	pool.Size = new Vector3(10, 0.2, 10); // Flat part dimensions
	pool.Color = new Color3(1, 0, 0); // Flat red
	pool.Material = Enum.Material.Neon;
	pool.Anchored = true;
	pool.CanCollide = false;

	// Align flat against the wall/floor using the normal
	const cframe = CFrame.lookAt(position, position.add(normal)).mul(CFrame.Angles(math.rad(-90), 0, 0));

	// Offset slightly away from surface to prevent Z-fighting
	pool.CFrame = cframe.add(normal.mul(0.1));
	pool.Parent = Workspace;

	const overlapParams = new OverlapParams();
	const TICK_RATE = 0.5;

	task.spawn(() => {
		let elapsed = 0;
		while (elapsed < duration && pool.Parent) {
			const partsInFire = Workspace.GetPartsInPart(pool, overlapParams);
			const processedModels = new Set<Model>();

			for (const part of partsInFire) {
				print("o");
				const model = part.FindFirstAncestorOfClass("Model");
				if (model && !processedModels.has(model)) {
					processedModels.add(model);

					const npcEntity = ref.find(model);
					if (npcEntity !== undefined) {
						print("E", npcEntity);
						// Apply or refresh the Burning component
						// The fire lasts for 3 seconds AFTER they step out
						world.set(npcEntity, Components.Burning, {
							dps: 10,
							endTime: os.time() + 3,
						});
					} else {
						print("D");
						const player = Players.GetPlayerFromCharacter(model) as Player;
						const playerEntity = ref.find(player);
						print(playerEntity, player);
						if (playerEntity !== undefined) {
							world.set(playerEntity, Components.Burning, {
								dps: 10,
								endTime: os.time() + 3,
							});
						}
					}
				}
			}
			task.wait(TICK_RATE);
			elapsed += TICK_RATE;
		}
		pool.Destroy();
	});

	// Temp cleanup until you add your real damage loop
	Debris.AddItem(pool, 10);
}

@SkillDecorator
export class Throw extends Skill {
	isHolding = false;
	active = false; //to stop lightattack from firing, client side variable
	conncount = 0;
	serverReady = false;

	protected Cooldown = 0.7;
	private viewmodel: Model | undefined;
	private throwable: string | undefined; //string of the throwable

	private vmAnimationSet: typeof ANIMATION_IDS.viewmodel[keyof typeof ANIMATION_IDS.viewmodel] | undefined;
	private charAnimationSet: typeof ANIMATION_IDS.item[keyof typeof ANIMATION_IDS.item] | undefined;

	private viewmodelTrack?: AnimationTrack;
	private characterTrack?: AnimationTrack;
	private throwableSettings: typeof THROWABLE_SETTINGS[keyof typeof THROWABLE_SETTINGS] | undefined;

	markers = {
		hold: () => {
			this.characterTrack?.AdjustSpeed(0);
			this.viewmodelTrack?.AdjustSpeed(0);
			this.isHolding = true;
		},
		throw: () => {
			this.isHolding = false;
			this.active = false;
			this.Throw();
		},
	};

	protected OnStartClient(): void {
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.WaitForChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}

		const player = this.Character.Player;
		if (player) {
			const playerEntity = ref.find(player);
			const name = world.get(playerEntity!, pair(Components.CurrentlyEquipped, Wildcard)) ?? "None";
			this.throwable = name;
		}

		const animationSet = ANIMATION_IDS.viewmodel[this.throwable as keyof typeof ANIMATION_IDS.viewmodel];
		if (animationSet && "throwing" in animationSet) {
			AnimationUtils.preloadAnimations(this.viewmodel, [animationSet.throwing]);
			this.vmAnimationSet = animationSet;
		} else {
			print("no throwing animation for viewmodel, throwable:", this.throwable);
		}
	}

	protected OnStartServer(): void {
		const player = this.Character.Player;
		if (player) {
			const playerEntity = ref.find(player);
			const char = world.get(playerEntity!, Components.Model);
			const item = getPlayersCururentlyHeldItem(player);
			this.throwable = item;
			this.throwableSettings = THROWABLE_SETTINGS[this.throwable as keyof typeof THROWABLE_SETTINGS];

			const animationSet = ANIMATION_IDS.item[this.throwable as keyof typeof ANIMATION_IDS.item];
			this.charAnimationSet = animationSet;

			if (animationSet && "throwing" in animationSet) {
				AnimationUtils.preloadAnimations(char as Model, [animationSet.throwing]);
			} else {
				print("no throwing animation for character");
			}
		}
	}

	public toggleThrowMode() {
		this.toggleThrowModeServer();
		if (!this.isHolding && this.viewmodel && this.vmAnimationSet && "throwing" in this.vmAnimationSet) {
			this.active = true;
			this.viewmodelTrack = AnimationUtils.loadAnim(
				this.viewmodel,
				"throw",
				this.vmAnimationSet.throwing,
				0,
				false,
				this.markers,
			);
		} else if (this.isHolding) {
			this.viewmodelTrack?.Stop(0.2);
			this.isHolding = false;
			this.active = false;
		}
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	toggleThrowModeServer() {
		if (!this.isHolding && this.charAnimationSet && "throwing" in this.charAnimationSet) {
			this.characterTrack = AnimationUtils.loadAnim(
				this.Character.Player?.Character as Model,
				"throw",
				this.charAnimationSet.throwing,
				0,
				false,
				this.markers,
			);
		} else {
			//cancel throw
			this.characterTrack?.Stop(0.2);
			this.isHolding = false;
		}
	}

	Throw() {
		if (!this.isHolding) return;
		this.isHolding = false;

		this.viewmodelTrack?.AdjustSpeed(1);

		const mouse = Players.LocalPlayer.GetMouse();
		const targetPos = mouse.Hit.Position;

		const char = Players.LocalPlayer.Character;
		const head = char?.FindFirstChild("Head") as BasePart;
		const origin = head ? head.Position : Workspace.CurrentCamera!.CFrame.Position;

		this.serverThrow(origin, targetPos);
		// print("i threw");
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverThrow(origin: Vector3, targetPosition: Vector3) {
		// print("serverthrow runs");
		if (this.characterTrack && this.characterTrack.IsPlaying) {
			this.characterTrack.AdjustSpeed(1);
			this.isHolding = false;

			this.projectileThrowVisuals(origin, targetPosition);
		}
	}

	//visuals using fastcast, serverside
	private projectileThrowVisuals(origin: Vector3, targetPosition: Vector3) {
		// print(origin, targetPosition);
		const player = this.Character.Player;
		if (!player) return;

		const playerEntity = ref.find(player);
		const itemString = world.get(playerEntity!, pair(Components.CurrentlyEquipped, Wildcard));

		if (itemString === undefined) return;

		const projectileTemplate = ItemAssets[itemString]! as BaseItemModel;
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

		ThrowableBehavior.MaxDistance = this.throwableSettings!.MAX_DISTANCE;
		ThrowableBehavior.Acceleration = this.throwableSettings!.GRAVITY;

		ThrowableBehavior.CosmeticBulletContainer = undefined; // DISABLE built-in cosmetic handling because i want the knife to face a certain way
		ThrowableBehavior.CosmeticBulletTemplate = undefined;

		const direction = targetPosition.sub(origin).Unit;

		const activeCast = ThrowablCaster.Fire(
			origin,
			direction,
			direction.mul(this.throwableSettings!.VELOCITY),
			ThrowableBehavior,
		);

		// activeCast.UserData = projectile
		activeCast.UserData = {
			projectile: projectile,
			throwable: this.throwable,
			settings: this.throwableSettings,
			char: this.Player?.Character,
		};
		projectile.Parent = THROWABLE_CONTAINER;

		// Set initial position
		projectile.PivotTo(CFrame.lookAt(origin, origin.add(direction)).mul(this.throwableSettings!.ROTATION_OFFSET));
	}

	protected OnConstructClient(): void {
		this.Destroyed.Connect(() => {
			const viewmodel = Workspace.CurrentCamera?.WaitForChild("BaseViewmodel") as Model;
			AnimationUtils.clearAllAnimations(viewmodel, 0.2, ["carrying"]);
		});
	}
	protected OnConstructServer(): void {
		this.Destroyed.Connect(() => {});
	}
}
