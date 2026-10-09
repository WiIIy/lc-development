import { Skill, SkillDecorator, Message } from "@rbxts/wcs";
import { ReplicatedStorage, Workspace, Debris, RunService, Players } from "@rbxts/services";
import FastCast, { ActiveCast } from "@rbxts/fastcast";
import { t } from "@rbxts/t";
import { caster } from "shared/caster"; // Shared caster
import { GRENADE_SETTINGS } from "shared/data/GrenadeSettings";

// Create the behavior for the cast
const castBehavior = FastCast.newBehavior();
castBehavior.Acceleration = GRENADE_SETTINGS.GRAVITY;
castBehavior.MaxDistance = GRENADE_SETTINGS.MAX_DISTANCE;
castBehavior.AutoIgnoreContainer = false;
castBehavior.CosmeticBulletContainer = Workspace;

// --- Global Server Hit Handler ---
if (RunService.IsServer()) {
	// The template is now only needed on the server for the cosmetic bullet
	const grenadeTemplate = ReplicatedStorage.Grenade.Clone() as MeshPart;
	// Ensure the template is non-collidable and not anchored before FastCast clones it.
	grenadeTemplate.CanCollide = false;
	grenadeTemplate.Anchored = true;

	castBehavior.CosmeticBulletTemplate = grenadeTemplate;

	caster.RayHit.Connect((cast, result, velocity, bullet) => {
		// Explosion Logic
		const hitPos = result.Position;

		// Visuals (Replicate explosion to all clients)
		const explosion = new Instance("Explosion");
		explosion.Position = hitPos;
		explosion.BlastRadius = 0; // Manual damage
		explosion.DestroyJointRadiusPercent = 0;
		explosion.Parent = Workspace;
		Debris.AddItem(explosion, 2);

		// Damage
		const parts = Workspace.GetPartBoundsInRadius(hitPos, GRENADE_SETTINGS.BLAST_RADIUS);
		const hitHumanoids = new Set<Humanoid>();

		parts.forEach((part) => {
			const model = part.Parent as Model;
			const humanoid = model?.FindFirstChild("Humanoid") as Humanoid;
			if (humanoid && !hitHumanoids.has(humanoid)) {
				hitHumanoids.add(humanoid);
				humanoid.TakeDamage(GRENADE_SETTINGS.BLAST_DAMAGE);
			}
		});
	});

	caster.LengthChanged.Connect(
		(
			cast: ActiveCast,
			lastPoint: Vector3,
			rayDir: Vector3,
			displacement: number,
			segmentVelocity: Vector3,
			bullet: Instance | undefined,
		) => {
			if (bullet && bullet.IsA("MeshPart")) {
				const newPos = lastPoint.add(rayDir.mul(displacement));
				// Update position and rotation based on velocity to simulate tumble
				bullet.CFrame = CFrame.lookAt(newPos, newPos.add(segmentVelocity));
				bullet.Position = newPos;
			}
		},
	);

	caster.CastTerminating.Connect((cast) => {
		const bullet = cast.RayInfo.CosmeticBulletObject;
		if (bullet) bullet.Destroy();
	});
}

@SkillDecorator
export class Grenade extends Skill {
	protected Cooldown = 5;

	// 1. Client: Visual "Hold" Start - Removed manual weld/hold logic
	protected OnStartClient() {
		// This will now only serve as a trigger for external hold visuals
		// The manual welding and cleanup for the heldGrenade have been removed
		// to focus solely on the projectile logic as requested.
		print("Client: Skill started. External hold visual should activate.");
	}

	// 2. Client: Release Trigger
	public Release() {
		// Only run this logic on the client
		if (!RunService.IsClient()) return;

		// No heldGrenade cleanup needed here.

		// Calculate Aim from client's camera
		const camera = Workspace.CurrentCamera;
		if (!camera) return;

		const char = this.Character.Instance;
		const root = char.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!root) return;

		const origin = root.Position.add(new Vector3(0, 2, 0)); // Throw from slightly above head
		const direction = camera.CFrame.LookVector;

		// Request Server (Logic & Visuals)
		this.serverThrow(origin, direction);
	}

	// 3. Server: Handle Logic & Visual Replication
	@Message({
		Destination: "Server",
		Type: "Event",
		Validators: [t.Vector3, t.Vector3],
	})
	protected serverThrow(origin: Vector3, direction: Vector3) {
		if (!RunService.IsServer()) return;

		// Sanity check: Ensure origin is close to player to prevent exploits
		const root = this.Character.Instance.FindFirstChild("HumanoidRootPart") as BasePart;
		if (root && root.Position.sub(origin).Magnitude > 10) return;

		// Filter setup for the cast
		const myParams = new RaycastParams();
		myParams.FilterType = Enum.RaycastFilterType.Exclude;
		myParams.FilterDescendantsInstances = [this.Character.Instance];
		castBehavior.RaycastParams = myParams;

		// Fire the logical cast (This automatically creates and replicates the CosmeticBullet to all clients)
		caster.Fire(origin, direction, direction.mul(GRENADE_SETTINGS.SPEED), castBehavior);
	}
}
