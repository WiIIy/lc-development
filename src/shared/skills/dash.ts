import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { CollectionService, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import world from "shared/world";
import { Components } from "../components/components";
import { ref } from "@willy/jecs-utils";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { AUDIO_PATH } from "shared/data/paths";
import { AnimationUtils } from "shared/utils/visual/animationUtil";

@SkillDecorator
export class Dash extends Skill {
	// WCS handles cooldowns automatically if you set this!
	protected Cooldown = 1.5;

	private readonly DASH_FORCE = 50;
	private readonly DASH_TIME = 0.3;

	private readonly characterModel = this.Character.Instance;

	// We only need to implement OnStartClient because movement relies on the
	// local Camera and needs to be instant (lag-free).
	Dash(): void {
		const humanoid = this.characterModel.FindFirstChild("Humanoid") as Humanoid;
		const rootPart = this.characterModel.FindFirstChild("HumanoidRootPart") as BasePart;

		if (!humanoid || !rootPart) return;

		// 1. Setup Physics
		const attachment = new Instance("Attachment");
		attachment.Parent = rootPart;

		const lv = new Instance("LinearVelocity");
		lv.MaxForce = 25000; //stops flinging
		lv.Attachment0 = attachment;
		lv.RelativeTo = Enum.ActuatorRelativeTo.World;
		lv.Parent = rootPart;

		// 2. Manage the Dash Loop
		const startTime = tick();

		this.serverDash();
		// heartbeat connection to update direction dynamically
		const connection = RunService.Heartbeat.Connect(() => {
			const camera = Workspace.CurrentCamera;
			if (!camera) return;

			// Handle Duration
			if (tick() - startTime > this.DASH_TIME) {
				cleanup();

				return;
			}

			let dashDirection = humanoid.MoveDirection; // Calculate Direction

			if (dashDirection.Magnitude < 0.1) {
				// If not moving, dash forward relative to camera
				dashDirection = camera.CFrame.LookVector.mul(new Vector3(1, 0, 1)).Unit;
			}

			// Apply Velocity
			lv.VectorVelocity = dashDirection.mul(this.DASH_FORCE);
		});

		const cleanup = () => {
			connection.Disconnect();
			lv.Destroy();
			attachment.Destroy();
		};
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverDash() {
		this.ApplyCooldown(1);
		const dashSounds = [
			AUDIO_PATH.ActionSounds.Dash.dash1,
			AUDIO_PATH.ActionSounds.Dash.dash2,
			AUDIO_PATH.ActionSounds.Dash.dash3,
		];
		const randomSound = dashSounds[math.random(0, dashSounds.size() - 1)];
		const randomSoundClone = randomSound.Clone();
		const torso = this.Character.Instance.FindFirstChild("Torso") as BasePart;
		randomSoundClone.Parent = torso;
		randomSoundClone.Play();

		// const dashTrail = ReplicatedStorage.CAAssets.effects.DashTrail;
		// const trailClone = dashTrail.Clone();
		// trailClone.Parent = torso;
		// trailClone.Attachment0 = torso.FindFirstChild("WaistFrontAttachment") as Attachment;
		// trailClone.Attachment1 = torso.FindFirstChild("NeckAttachment") as Attachment;

		// const conn = randomSoundClone.Ended.Connect(() => {
		// 	randomSoundClone.Destroy();
		// 	trailClone.Destroy();
		// 	conn.Disconnect();
		// });

		const root = this.Character.Instance.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!root) return;

		const hitEnemies = new Set<Model>();
		const startTime = tick();

		const connection = RunService.Heartbeat.Connect(() => {
			if (tick() - startTime > this.DASH_TIME) {
				connection.Disconnect();
				return;
			}

			const size = new Vector3(4, 5, 6); // dash hitbox size
			const cf = root.CFrame.mul(new CFrame(0, 0, -3)); // in front of player

			const parts = Workspace.GetPartBoundsInBox(cf, size);

			for (const part of parts) {
				const model = part.FindFirstAncestorOfClass("Model");
				if (!model) continue;

				if (hitEnemies.has(model)) continue;
				if (!CollectionService.HasTag(model, "Enemy")) continue;

				const humanoid = model.FindFirstChildOfClass("Humanoid") as Humanoid;
				const enemyRoot = model.FindFirstChild("HumanoidRootPart") as BasePart;
				if (!humanoid || !enemyRoot) continue;

				hitEnemies.add(model);
				this.knockEnemy(model, enemyRoot);
			}
		});

		// Optional: Play a sound or replicate VFX to other clients here
		// console.log("Player dashed on server (cooldown started)");
	}

	private knockEnemy(model: Model, root: BasePart) {
		const humanoid = model.FindFirstChildOfClass("Humanoid") as Humanoid;
		if (!humanoid) return;

		// 1. Get ECS Entity for the model
		// Assuming you have a helper or can find entity by model:
		const enemyEntity = ref.find(model);
		// print("stun", enemyEntity, " 3 seconds");

		if (enemyEntity !== undefined) {
			const now = tick();
			world.set(enemyEntity, Components.Stunned, {
				startTime: now,
				endTime: now + 3,
			});
		}

		// 2. Play Knocked Down Animation
		AnimationUtils.loadAnim(model, "knockedover", ANIMATION_IDS.character.knockedover);

		// 3. Disable control & Physics Setup
		humanoid.AutoRotate = false;

		const attachment = new Instance("Attachment");
		attachment.Parent = root;

		const bodyVel = new Instance("LinearVelocity");
		bodyVel.Attachment0 = attachment;
		bodyVel.MaxForce = 30000;
		bodyVel.RelativeTo = Enum.ActuatorRelativeTo.World;

		const humanoidRootPart = this.Player!.Character!.FindFirstChild("HumanoidRootPart")! as BasePart;
		const dashDirection = humanoidRootPart.CFrame.LookVector;

		bodyVel.VectorVelocity = dashDirection.mul(20).add(new Vector3(0, 0, -3));
		bodyVel.Parent = root;

		// 4. Handle Knockback Expiration & Friction Stopping
		task.delay(0.3, () => {
			bodyVel.Destroy();
			attachment.Destroy();

			// Zero-out linear velocity so momentum doesn't slide the enemy on the ground
			root.AssemblyLinearVelocity = Vector3.zero;
			root.AssemblyAngularVelocity = Vector3.zero;

			// Force Humanoid to halt active MoveTo paths
			humanoid.MoveTo(root.Position);
		});

		// 5. Recover from Stun state after 3 seconds
		task.delay(3, () => {
			humanoid.AutoRotate = true;
			if (enemyEntity !== undefined) {
				world.remove(enemyEntity, Components.Stunned);
			}
		});
	}
}
