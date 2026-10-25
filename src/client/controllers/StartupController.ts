//prime client-side testing ground file
import { Controller, OnStart } from "@flamework/core";
import CameraShaker from "@rbxts/camera-shaker";
import Make from "@rbxts/make";
import { promiseR6 } from "@rbxts/promise-character";
import { CollectionService, Players, RunService, StarterGui, UserInputService, Workspace } from "@rbxts/services";
import { Entity, pair, Wildcard } from "@rbxts/jecs";
import Components from "shared/components/components";
import { Character, Skill, SkillConstructor } from "@rbxts/wcs";
import world from "shared/world";
import { TextChatService } from "@rbxts/services";
import { RemoteEvents } from "client/network";
import { InventoryStore } from "client/ui/stores/InventoryStore";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { ASSET_ID_PREFIX } from "shared/data/paths";
import { DialogueController } from "./ui/DialogueController";
import { showWorldDamageNumber } from "shared/utils/visual/showWorldDamageNumber";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { setupJabby } from "shared/systems/jabby";
import { setupEvilWilly } from "client/clientutils/clientSetupEvilWilly";

@Controller({})
export class StartUpController implements OnStart {
	constructor(private readonly dialogueController: DialogueController) {}

	onStart(): void {
		setupJabby();
		const anim = Make("Animation", { AnimationId: ASSET_ID_PREFIX + ANIMATION_IDS.npc.idle.galilei });
		StarterGui.SetCoreGuiEnabled("Backpack", false);
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Health, false);
		// const loop = Workspace.Galilei.Humanoid.Animator.LoadAnimation(anim);
		// loop.Play();
		// 2. Define Character Setup logic

		setupEvilWilly();
		UserInputService.MouseIconEnabled = false;

		const setupCharacter = async (character: Model) => {
			const charR6 = await promiseR6(character);
			const humanoid = charR6.Humanoid;

			humanoid.SetStateEnabled(Enum.HumanoidStateType.FallingDown, false);
			humanoid.SetStateEnabled(Enum.HumanoidStateType.Physics, false);
			humanoid.SetStateEnabled(Enum.HumanoidStateType.Flying, false);
			humanoid.SetStateEnabled(Enum.HumanoidStateType.Jumping, false);
			humanoid.JumpPower = 0;
			humanoid.AutoRotate = true;

			// Get descendants and set collision group
			charR6.GetDescendants().forEach((descendant) => {
				if (descendant.IsA("BasePart")) {
					descendant.CollisionGroup = "character";
				}
			});

			AnimationUtils.loadAnim(charR6, "squaredup", ANIMATION_IDS.actions.squared_up, 0, true);

			const wcsChar = Character.GetCharacterFromInstance(character);

			// Safety check: WCS wrapper might not exist yet if replication is lagging slightly
			if (!wcsChar) {
				// Retry shortly or wait (optional, but good for stability)
				task.delay(0.1, () => {
					if (character.Parent) setupCharacter(character);
				});
				return;
			}

			// Helper to run your start logic
			const handleSkill = (skill: unknown) => {
				// print(`Skill Found and started: ${(skill as Skill).GetName()}`);
				task.wait(0.2); //erm. might not work in low ping. TODO, find a less temporary solution
				//this wait makes it so when skills fire, the item string isnt the previous item, race condition problem with skill assignment.
				const s = skill as Skill;
				s.Start();
			};

			const currentSlot = InventoryStore.getCurrentSlot();
			if (currentSlot !== undefined) {
				RemoteEvents.requestSetCurrentSlot.fire(tostring(currentSlot));
			}

			wcsChar.GetSkills().forEach(handleSkill);

			// B. Listen for FUTURE skills
			wcsChar.SkillAdded.Connect(handleSkill);
		};

		const localPlayer = Players.LocalPlayer;

		localPlayer.CharacterAdded.Connect(setupCharacter);

		if (localPlayer.Character) {
			setupCharacter(localPlayer.Character);
		}

		RemoteEvents.broadcastDamageNumber.connect((damageAmount: number, displayPosition: Vector3) => {
			// Fire the imperative world-space visualizer
			showWorldDamageNumber(damageAmount, displayPosition);
		});

		RemoteEvents.attachDamageDisplayCallbackToCharacter.connect((character: Model) => {
			const humanoid = character.FindFirstChild("Humanoid") as Humanoid;

			let previousHealth = humanoid.Health;

			humanoid.HealthChanged.Connect((newHealth) => {
				const damageTaken = previousHealth - newHealth;
				previousHealth = newHealth;

				//exclude healing
				if (damageTaken > 0) {
					const head = character.FindFirstChild("Head") as BasePart | undefined;
					const displayPosition = head ? head.Position : character.PrimaryPart!.Position;
					print("showing", damageTaken);
					//TODO change this so its not always head but wherever the damage is pointed at.
					showWorldDamageNumber(damageTaken, displayPosition);
				}
			});
		});

		const bubbleConfig = TextChatService.WaitForChild("BubbleChatConfiguration") as BubbleChatConfiguration;
		bubbleConfig.AdorneeName = "DroneChatProxy";

		type EnemyAnimController = {
			model: Model;
			root: BasePart;
			lastPos: Vector3;
			walkTrack: AnimationTrack | undefined;
			idleTrack: AnimationTrack | undefined;
			lastMoveTime: number;
		};

		// const controllers = new Map<Model, EnemyAnimController>();

		// Makes enemy walk, animamtions play on client for optimization
		// CollectionService.GetInstanceAddedSignal("Enemy").Connect((enemy) => {
		// 	if (!enemy.IsA("Model")) return;

		// 	const humanoid = enemy.FindFirstChildOfClass("Humanoid");
		// 	const animator = enemy.FindFirstChildOfClass("Humanoid")?.FindFirstChildOfClass("Animator");
		// 	const root = enemy.FindFirstChild("HumanoidRootPart") as BasePart;

		// 	if (!animator || !root) return;

		// 	const walkAnim = Make("Animation", { AnimationId: ASSET_ID_PREFIX + ANIMATION_IDS.npc.base.walk });
		// 	const idleAnim = Make("Animation", { AnimationId: ASSET_ID_PREFIX + ANIMATION_IDS.npc.base.idle });

		// 	const walkTrack = animator.LoadAnimation(walkAnim);
		// 	const idleTrack = animator.LoadAnimation(idleAnim);

		// 	walkTrack.Looped = true;
		// 	walkTrack.Priority = Enum.AnimationPriority.Movement;

		// 	idleTrack.Looped = true;
		// 	idleTrack.Priority = Enum.AnimationPriority.Core;
		// 	idleTrack.Play(); // Start with idle
		// 	print(idleTrack.IsPlaying);

		// 	controllers.set(enemy, {
		// 		model: enemy,
		// 		root,
		// 		lastPos: root.Position,
		// 		walkTrack,
		// 		idleTrack,
		// 		lastMoveTime: 0,
		// 	});
		// });

		// Remove enemy from the central enemy+track container
		// CollectionService.GetInstanceRemovedSignal("Enemy").Connect((enemy) => {
		// 	const enemyModel = enemy as Model;
		// 	const controller = controllers.get(enemyModel);
		// 	if (!controller) return;

		// 	// stop and destroy the tracks
		// 	if (controller.walkTrack) {
		// 		controller.walkTrack.Stop();
		// 		controller.walkTrack.Destroy();
		// 	}

		// 	if (controller.idleTrack) {
		// 		controller.idleTrack.Stop();
		// 		controller.idleTrack.Destroy();
		// 	}

		// 	controllers.delete(enemyModel);
		// });

		// Single loop for managing enemy walk animation so game doesnt explode from billions of runservice conns
		// RunService.Heartbeat.Connect((dt) => {
		// 	const dtClamped = math.max(dt, 1 / 60);

		// 	for (const [enemy, controller] of controllers) {
		// 		if (!enemy.Parent || !controller.root.Parent) {
		// 			controllers.delete(enemy);
		// 			continue;
		// 		}

		// 		const current = controller.root.Position;

		// 		const delta = new Vector3(current.X, 0, current.Z).sub(
		// 			new Vector3(controller.lastPos.X, 0, controller.lastPos.Z),
		// 		);
		// 		const speed = delta.Magnitude / dtClamped;
		// 		controller.lastPos = current;

		// 		// If a position jump is detected, update the "last moved" timestamp
		// 		if (speed > 0.5) {
		// 			controller.lastMoveTime = os.clock();
		// 		}

		// 		const isMoving = os.clock() - controller.lastMoveTime < 0.15;

		// 		if (isMoving) {
		// 			if (controller.idleTrack && controller.idleTrack.IsPlaying) {
		// 				controller.idleTrack.Stop(0.2);
		// 			}
		// 			if (controller.walkTrack && !controller.walkTrack.IsPlaying) {
		// 				controller.walkTrack.Play(0.2);
		// 			}
		// 		} else {
		// 			// Stop Walk and Play Idle when standing still
		// 			if (controller.walkTrack && controller.walkTrack.IsPlaying) {
		// 				controller.walkTrack.Stop(0.2);
		// 			}
		// 			if (controller.idleTrack && !controller.idleTrack.IsPlaying) {
		// 				controller.idleTrack.Play(0.2);
		// 			}
		// 		}
		// 	}
		// });

		// const camera = Workspace.CurrentCamera as Camera;
		// Players.LocalPlayer.CameraMode = Enum.CameraMode.LockFirstPerson;
		// const char = Players.LocalPlayer.Character || Players.LocalPlayer.CharacterAdded.Wait()[0];
		// const hrp = char.WaitForChild("HumanoidRootPart") as BasePart;
		// const playerCFrame = hrp.CFrame;
		// const camShake = new CameraShaker(
		// 	Enum.RenderPriority.Camera.Value,
		// 	(shakeCFrame) => (camera.CFrame = camera.CFrame.mul(shakeCFrame)),
		// );

		// camShake.Start();

		// task.wait(3);
		// print("explosion");
		// // Explosion shake:
		// camShake.Shake(CameraShaker.Presets.Explosion);

		// task.wait(3);

		// // Custom shake:
		// print("custom");
		// camShake.ShakeOnce(3, 1, 0.2, 1.5);

		// task.wait(3);

		// // Custom shake:
		// print("bump  ");
		// camShake.Shake(CameraShaker.Presets.Bump);
	}
}
