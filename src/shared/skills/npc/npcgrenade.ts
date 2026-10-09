import { Skill, SkillDecorator } from "@rbxts/wcs";
import { ReplicatedStorage, Workspace, RunService } from "@rbxts/services";
import FastCast, { ActiveCast } from "@rbxts/fastcast";
import { caster } from "shared/caster";
import { AIM_BIAS_PROFILE, GRENADE_SETTINGS } from "shared/data/GrenadeSettings";

// Helper function to get the appropriate bias based on distance
function getUpwardBias(distance: number): number {
	let bestBias = 0;
	let lastDistance = 0;

	// Iterate through the profile to find the closest distance threshold
	AIM_BIAS_PROFILE.forEach((bias, dist) => {
		if (dist <= distance) {
			// If we pass the threshold, this is our current best bias
			bestBias = bias;
		} else if (dist > distance && dist < lastDistance) {
			// If we went past, use the bias from the previous threshold
			bestBias = AIM_BIAS_PROFILE.get(lastDistance) ?? bestBias;
		}
		lastDistance = dist;
	});

	// Simple linear interpolation between the two nearest points can be done here for smoother results,
	// but the map lookup is sufficient for a good start.
	return bestBias;
}

// Create the behavior for the cast (Needs to be defined here for NPC usage)
const castBehavior = FastCast.newBehavior();
castBehavior.Acceleration = GRENADE_SETTINGS.GRAVITY;
castBehavior.MaxDistance = GRENADE_SETTINGS.MAX_DISTANCE;
castBehavior.AutoIgnoreContainer = false;
castBehavior.CosmeticBulletContainer = Workspace;
// Ensure the template is non-collidable and not anchored before FastCast clones it.
const grenadeTemplate = ReplicatedStorage.Grenade as BasePart;
grenadeTemplate.CanCollide = false;
grenadeTemplate.Anchored = false;
castBehavior.CosmeticBulletTemplate = grenadeTemplate;

// --- NPCGrenade Skill (Server Only) ---
@SkillDecorator
export class NPCGrenade extends Skill {
	protected Cooldown = 5;

	protected OnStartClient() {
		// Prevent client execution
		if (RunService.IsClient()) {
			throw error("NPCGrenade must only be run on the server.");
		}
	}

	// --- Shared: Fire FastCast Logic ---
	private fireFastCast(origin: Vector3, direction: Vector3) {
		const myParams = new RaycastParams();
		myParams.FilterType = Enum.RaycastFilterType.Exclude;
		myParams.FilterDescendantsInstances = [this.Character.Instance];

		castBehavior.RaycastParams = myParams;

		// Fire the cast - server will automatically replicate the cosmetic bullet
		caster.Fire(origin, direction, direction.mul(GRENADE_SETTINGS.SPEED), castBehavior);
	}

	// --- NPC Interface: Throw at a specific target part ---
	public ThrowAtTarget(target: BasePart) {
		if (!RunService.IsServer()) return;

		const char = this.Character.Instance;
		const root = char.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!root || !target) return;

		const origin = root.Position.add(new Vector3(0, 2, 0));

		// Calculate direction and distance
		const vecToTarget = target.Position.sub(origin);
		const distance = vecToTarget.Magnitude;

		// 1. Get distance-based Aim Up bias
		const biasValue = getUpwardBias(distance);
		const aimBias = new Vector3(0, biasValue, 0);

		// 2. Add Random Offset (Jitter)
		const rng = new Random();
		const jitter = new Vector3(rng.NextNumber(-0.05, 0.05), rng.NextNumber(0, 0.05), rng.NextNumber(-0.05, 0.05));

		// Calculate the final direction vector
		const finalDirection = vecToTarget.Unit.add(aimBias).add(jitter).Unit;

		// Fire Logic (Server)
		this.fireFastCast(origin, finalDirection);
	}

	// --- NPC Interface: Throw straight forward (with slight upward arc) ---
	public ThrowForward() {
		if (!RunService.IsServer()) return;
		const char = this.Character.Instance;

		const root = char.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!root) return;

		const origin = root.Position.add(new Vector3(0, 2, 0));

		// Get the current forward direction of the NPC
		const forward = root.CFrame.LookVector;

		// Use a constant slight upward bias for a forward toss
		const aimBias = new Vector3(0, 0.1, 0);

		const finalDirection = forward.add(aimBias).Unit;

		// Fire Logic (Server)
		this.fireFastCast(origin, finalDirection);
	}
}
