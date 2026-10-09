import { Skill, SkillDecorator } from "@rbxts/wcs";
import { Debris, RunService, Workspace } from "@rbxts/services";
import { ref } from "@rbxts/jecs-utils";
import world from "shared/world";
import Components from "shared/components/components";
import { ALL_FIREARM_SETTINGS, FirearmBehavior, FirearmCaster } from "shared/data/GunSettings";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AnimationUtils } from "shared/utils/animationUtil";
import { getNPCCururentlyHeldItem } from "shared/utils/getPlayersCurrentlyHeldItemm";
import { BaseEnemySkill } from "./baseEnemySkill";

@SkillDecorator
export class NPCFirearmSkill extends Skill {
	protected firearmSettings: typeof ALL_FIREARM_SETTINGS[keyof typeof ALL_FIREARM_SETTINGS] | undefined;
	protected muzzleAttachment: Attachment | undefined;
	protected firearmName: string | undefined;
	protected serverHandle: BasePart | undefined;

	protected charFiringTrack: AnimationTrack | undefined;
	protected lastFireTime = 0;

	protected nextShotDelay = 0;
	protected shotsFiredInBurst = 0;
	protected currentBurstTarget = 0;

	protected OnStartServer(): void {
		this.setupGunData();
	}

	private setupGunData() {
		const entity = ref.find(this.Character.Instance);

		if (entity === undefined) return;

		// Fetch what the enemy currently holds via JECS
		const itemEntity = world.target(entity, Components.CurrentlyEquipped);
		print("setting up gun data for entity", entity, itemEntity);
		if (itemEntity !== undefined) {
			const modelComponent = world.get(itemEntity, Components.ItemModel);
			const handle = modelComponent?.baseModel?.FindFirstChild("handle") as BasePart;

			this.firearmName = getNPCCururentlyHeldItem(this.Character.Instance as Model);
			this.firearmSettings = ALL_FIREARM_SETTINGS[this.firearmName as keyof typeof ALL_FIREARM_SETTINGS];
			this.serverHandle = handle;
			// print(handle)
			this.muzzleAttachment = handle?.FindFirstChild("Muzzle") as Attachment;

			const itemAnims = ANIMATION_IDS.item[this.firearmName as keyof typeof ANIMATION_IDS.item];

			// print(itemAnims, this.firearmName, this.Character.Humanoid.Parent);
			if (itemAnims) {
				const fullSequence: string[] = [];

				if (itemAnims.equipping !== undefined) {
					fullSequence.push(itemAnims.equipping);
					AnimationUtils.preloadAnimations(this.Character.Humanoid.Parent as Model, [itemAnims.equipping]);
				}
				if (itemAnims.idling !== undefined) {
					fullSequence.push(itemAnims.idling);
					AnimationUtils.preloadAnimations(this.Character.Humanoid.Parent as Model, [itemAnims.idling]);
				}
			}

			//looped
			AnimationUtils.loadAnim(this.Character.Humanoid.Parent as Model, "idling", itemAnims.idling, 0, true);
			AnimationUtils.loadAnim(this.Character.Humanoid.Parent as Model, "equipping", itemAnims.equipping);
		}
	}

	// Called by your AI Controller / Decision System
	public shootAt(targetPosition: Vector3): boolean {
		if (!this.muzzleAttachment || !this.firearmSettings) return false;

		const enemyEntity = ref.get(this.Character.Instance as Model);
		if (enemyEntity === undefined) return false;

		// Prevent shooting while reloading
		if (world.has(enemyEntity, Components.IsReloading)) return false;

		// Check equipped weapon ammo
		const equippedPair = world.target(enemyEntity, Components.CurrentlyEquipped);
		if (equippedPair === undefined) return false;

		const chamberedAmmo = world.get(equippedPair, Components.ChamberedAmmo) ?? 0;

		if (chamberedAmmo <= 0) {
			// Attempt auto-reload if empty
			this.reload(this.firearmSettings);
			return false;
		}

		// Aiming calculation
		const baseSkill = this.Character.GetSkillFromConstructor(BaseEnemySkill);
		const root = this.Character.Humanoid.Parent?.FindFirstChild("HumanoidRootPart") as BasePart;
		if (baseSkill && root) {
			const dir = targetPosition.sub(root.Position).Unit;
			const localLook = root.CFrame.VectorToObjectSpace(dir);
			const pitch = math.asin(math.clamp(localLook.Y, -1, 1));
			baseSkill.updateArms(pitch, true);
		}

		const currentFireTime = os.clock();

		if (this.nextShotDelay === 0 && this.firearmSettings) {
			this.nextShotDelay = this.firearmSettings.DELAY_BETWEEN_SHOTS;
		}

		if (currentFireTime - this.lastFireTime < this.nextShotDelay) return false;
		this.lastFireTime = currentFireTime;

		// Consume 1 unit of chambered ammo
		world.set(equippedPair, Components.ChamberedAmmo, chamberedAmmo - 1);

		const origin = this.muzzleAttachment.WorldCFrame.Position;
		const direction = targetPosition.sub(origin).Unit;

		const spreadFactor = math.rad(5);
		const spreadX = math.random(-spreadFactor, spreadFactor);
		const spreadY = math.random(-spreadFactor, spreadFactor);
		const finalDirection = CFrame.Angles(spreadX, spreadY, 0).mul(direction);

		// 1. Play Animations
		const animSet = ANIMATION_IDS.item[this.firearmName as keyof typeof ANIMATION_IDS.item];
		if (animSet && "aiming" in animSet && !this.charFiringTrack) {
			this.charFiringTrack = AnimationUtils.loadAnim(this.Character.Instance as Model, "aiming", animSet.aiming);
		}

		// 2. Play Sound
		this.playSound(this.firearmSettings.FIRE_SOUND);

		// 3. FastCast Raycast execution
		const castParams = new RaycastParams();
		castParams.FilterType = Enum.RaycastFilterType.Exclude;
		castParams.FilterDescendantsInstances = [this.Character.Instance];

		FirearmBehavior.RaycastParams = castParams;
		FirearmBehavior.MaxDistance = this.firearmSettings.MAX_DISTANCE;
		FirearmBehavior.Acceleration = this.firearmSettings.GRAVITY;

		let muzzles: Vector3[];
		if ("MUZZLE_OFFSETS" in this.firearmSettings) {
			muzzles = this.firearmSettings.MUZZLE_OFFSETS;
		} else {
			muzzles = [Vector3.zero];
		}

		for (const offset of muzzles) {
			const actualOrigin = this.muzzleAttachment.WorldCFrame.PointToWorldSpace(offset);
			const activeCast = FirearmCaster.Fire(
				actualOrigin,
				finalDirection,
				finalDirection.mul(this.firearmSettings.VELOCITY),
				FirearmBehavior,
			);

			activeCast.UserData = {
				firearmName: this.firearmName,
				settings: this.firearmSettings,
				char: this.Character.Instance,
				origin: actualOrigin,
				isNPC: true,
			};
		}
		this.calculateNextShotDelay();

		return true;
	}

	public reload(gunSettings: typeof ALL_FIREARM_SETTINGS[keyof typeof ALL_FIREARM_SETTINGS]): boolean {
		const enemyEntity = ref.get(this.Character.Instance as Model);
		if (enemyEntity === undefined) return false;

		// Retrieve equipped weapon pair entity
		const equippedPair = world.target(enemyEntity, Components.CurrentlyEquipped);
		if (equippedPair === undefined) return false;

		const ownedAmmo = world.get(enemyEntity, Components.NpcOwnedAmmo) ?? 0;
		if (ownedAmmo <= 0) {
			if (ownedAmmo <= 0) {
				print("im out");
				AnimationUtils.stopAnim(this.Character.Instance as Model, "aiming");
				return false;
			}
		} // Absolutely out of reserve ammo

		const capacity = gunSettings.CAPACITY;
		const currentChambered = world.get(equippedPair, Components.ChamberedAmmo) ?? 0;
		const needed = capacity - currentChambered;
		if (needed <= 0) return false;

		// Set entity into reloading state
		world.set(enemyEntity, Components.IsReloading, true);

		// Play "magout" animation if available
		const animSet = ANIMATION_IDS.item[this.firearmName as keyof typeof ANIMATION_IDS.item];
		if (animSet && "magout" in animSet) {
			AnimationUtils.loadAnim(this.Character.Instance as Model, "magout", animSet.magout);
		}

		// Process reload delay asynchronously
		task.delay(gunSettings.NPC_RELOAD_TIME, () => {
			if (!world.contains(enemyEntity)) return;

			const latestOwned = world.get(enemyEntity, Components.NpcOwnedAmmo) ?? 0;
			const reloadedAmount = math.min(needed, latestOwned);

			world.set(equippedPair, Components.ChamberedAmmo, currentChambered + reloadedAmount);
			world.set(enemyEntity, Components.NpcOwnedAmmo, math.max(0, latestOwned - reloadedAmount));
			world.remove(enemyEntity, Components.IsReloading);
			AnimationUtils.stopAnim(this.Character.Instance as Model, "magout");
		});

		return true;
	}

	protected playSound(soundTemplate: Sound) {
		if (!this.serverHandle) return;
		const clone = soundTemplate.Clone();
		clone.Parent = this.serverHandle;
		clone.PlaybackSpeed = clone.PlaybackSpeed * (0.95 + math.random() * 0.1);
		clone.Play();
		Debris.AddItem(clone, clone.TimeLength + 0.1);
	}

	private calculateNextShotDelay() {
		if (!this.firearmSettings || !this.firearmName) return;

		const baseDelay = this.firearmSettings.DELAY_BETWEEN_SHOTS;
		const autoGuns = ["m10", "serpent"];
		const isAuto = autoGuns.includes(this.firearmName.lower());

		if (!isAuto) {
			// SINGLE SHOT LOGIC (Taurus, Vag73, R50)
			const roll = math.random();
			if (roll < 0.6) {
				// 60% chance: Quick follow-up (between base delay and 0.89s)
				this.nextShotDelay = baseDelay + math.random() * (0.89 - baseDelay);
			} else {
				// 40% chance: Slower, calculated shot (between 0.9s and 1.5s)
				this.nextShotDelay = 0.9 + math.random() * 0.6;
			}
		} else {
			// FULL AUTO LOGIC (Burst firing)
			this.shotsFiredInBurst++;

			// If we haven't set a burst target yet, pick a random burst size (e.g., 3 to 6 rounds)
			if (this.currentBurstTarget === 0) {
				this.currentBurstTarget = math.random(3, 6);
			}

			if (this.shotsFiredInBurst >= this.currentBurstTarget) {
				// Burst complete! Let go of the trigger for a moment (0.5s to 1.2s pause)
				this.nextShotDelay = 0.5 + math.random() * 0.7;

				// Reset burst tracking for next time
				this.shotsFiredInBurst = 0;
				this.currentBurstTarget = math.random(3, 6);
			} else {
				// Keep holding the trigger (normal auto fire rate)
				this.nextShotDelay = baseDelay;
			}
		}
	}
}
