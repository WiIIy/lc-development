import Make from "@rbxts/make";
import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";

const Workspace = game.GetService("Workspace");
const Players = game.GetService("Players");

const DEBUG_HITBOX = true;

export type MeleeHitResult = "miss" | "parried" | "hit";

export function registerMeleeHit(
	e: Entity,
	moveName: string,
	animator: Animator,
	weaponData: NpcMeleeWeapon,
): MeleeHitResult {
	if (!world.contains(e)) return "miss";

	const moveData = weaponData.moves?.[moveName];
	if (moveData === undefined) return "miss";

	const npcModel = animator.FindFirstAncestorOfClass("Model");
	const targetEntity = world.target(e, Components.Target);
	if (targetEntity === undefined) return "miss"; //target lost

	const transform = world.get(e, Components.Transform) as CFrame | undefined;
	const targetHrp = world.get(targetEntity, Components.Basepart);
	const targetModel = targetHrp?.Parent;
	if (transform === undefined || targetHrp === undefined) return "miss";
	if (targetModel === undefined || !targetModel.IsA("Model")) return "miss";

	//only living player characters are valid victims
	const humanoid = targetModel.FindFirstChildOfClass("Humanoid");
	if (humanoid === undefined || humanoid.Health <= 0) return "miss";
	if (Players.GetPlayerFromCharacter(targetModel) === undefined) return "miss";

	//aim: wherever the npc is facing, flattened so pitch doesn't tilt the box
	const { size, distance } = moveData.blockcast;
	const origin = transform.Position;
	const look = transform.LookVector;
	const flat = new Vector3(look.X, 0, look.Z);
	const forward = flat.Magnitude > 0.001 ? flat.Unit : look;

	//start the cast behind the npc so a target standing right against it isn't missed
	const backOffset = -0.5;
	const castOrigin = origin.sub(forward.mul(backOffset));
	const castCFrame = CFrame.lookAt(castOrigin, castOrigin.add(forward));
	const castLength = distance + backOffset;

	//1. include filter: the target is the only thing the cast can see, so any result means the target was hit
	const hitboxParams = new RaycastParams();
	hitboxParams.FilterType = Enum.RaycastFilterType.Include;
	hitboxParams.FilterDescendantsInstances = [targetModel];

	const hitboxResult = Workspace.Blockcast(castCFrame, size, forward.mul(castLength), hitboxParams);
	const inHitbox = hitboxResult !== undefined;

	//2. line of sight: attacker HRP -> target HRP, anything solid in between blocks the hit
	let blocked = false;
	if (inHitbox) {
		const losParams = new RaycastParams();
		losParams.FilterType = Enum.RaycastFilterType.Exclude;
		losParams.FilterDescendantsInstances = npcModel !== undefined ? [npcModel] : [];

		const losResult = Workspace.Raycast(origin, targetHrp.Position.sub(origin), losParams);
		//undefined = nothing in the way; otherwise the first thing hit must be the target itself
		blocked = losResult !== undefined && !losResult.Instance.IsDescendantOf(targetModel);
	}

	if (DEBUG_HITBOX) {
		//red = hit, yellow = in the box but a wall blocked it, green = miss
		const color = !inHitbox
			? Color3.fromRGB(60, 255, 60)
			: blocked
				? Color3.fromRGB(255, 220, 60)
				: Color3.fromRGB(255, 60, 60);

		const debugPart = Make("Part", {
			Anchored: true,
			CanCollide: false,
			CanQuery: false,
			CanTouch: false,
			Size: new Vector3(size.X, size.Y, size.Z + castLength),
			CFrame: castCFrame.mul(new CFrame(0, 0, -castLength / 2)),
			Color: color,
			Transparency: 0.7,
			Parent: Workspace,
		});
		task.delay(0.25, () => debugPart.Destroy());
	}

	if (!inHitbox || blocked) return "miss";

	//3. parry check
	if (world.has(targetEntity, Components.Parrying)) return "parried";

	//4. damage
	const health = world.get(targetEntity, Components.Health);
	if (health !== undefined) {
		world.set(targetEntity, Components.Health, {
			current : math.max(0, health.current - moveData.damage),
			max: health.max,
		});
	}
	humanoid.TakeDamage(moveData.damage);
	print(`[${moveName}] hit ${targetModel.Name} for ${moveData.damage}`);

	if (math.random() < moveData.bleedChance) {
		//TODO(components): apply Bleeding
	}
	if (math.random() < moveData.fractureChance) {
		//TODO(components): apply Fracture
	}
	return "hit";
}