// Hit detection only (extracted from your registerMeleeHit), so strikes and shove share it.
import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";

const Workspace = game.GetService("Workspace");
const Players = game.GetService("Players");
const DEBUG_HITBOX = true;
const BACK_OFFSET = 0.5; // start behind the npc so a target hugging it isn't missed

export type MeleeContact = { target: Entity; model: Model; humanoid: Humanoid };

export function meleeCast(e: Entity, blockcast: { size: Vector3; distance: number }): MeleeContact | undefined {
	if (!world.contains(e)) return undefined;
	const target = world.target(e, Components.Target);
	if (target === undefined) return undefined;

	const transform = world.get(e, Components.Transform);
	const npcModel = world.get(e, Components.Basepart)?.Parent;
	const targetHrp = world.get(target, Components.Basepart);
	const model = targetHrp?.Parent;
	if (transform === undefined || targetHrp === undefined || model === undefined || !model.IsA("Model")) {
		return undefined;
	}
	const humanoid = model.FindFirstChildOfClass("Humanoid");
	if (humanoid === undefined || humanoid.Health <= 0) return undefined;
	if (Players.GetPlayerFromCharacter(model) === undefined) return undefined;

	const { size, distance } = blockcast;
	const origin = transform.Position;
	const look = transform.LookVector;
	const flatLook = new Vector3(look.X, 0, look.Z);
	const forward = flatLook.Magnitude > 0.001 ? flatLook.Unit : look;
	const castOrigin = origin.sub(forward.mul(BACK_OFFSET));
	const castCFrame = CFrame.lookAt(castOrigin, castOrigin.add(forward));
	const castLength = distance + BACK_OFFSET;

	const hitboxParams = new RaycastParams();
	hitboxParams.FilterType = Enum.RaycastFilterType.Include;
	hitboxParams.FilterDescendantsInstances = [model];
	const inHitbox = Workspace.Blockcast(castCFrame, size, forward.mul(castLength), hitboxParams) !== undefined;

	let blocked = false;
	if (inHitbox) {
		const sightParams = new RaycastParams();
		sightParams.FilterType = Enum.RaycastFilterType.Exclude;
		sightParams.FilterDescendantsInstances = npcModel !== undefined ? [npcModel] : [];
		const result = Workspace.Raycast(origin, targetHrp.Position.sub(origin), sightParams);
		blocked = result !== undefined && !result.Instance.IsDescendantOf(model);
	}

	if (DEBUG_HITBOX) {
		const part = new Instance("Part");
		part.Anchored = true;
		part.CanCollide = false;
		part.CanQuery = false;
		part.CanTouch = false;
		part.Size = new Vector3(size.X, size.Y, size.Z + castLength);
		part.CFrame = castCFrame.mul(new CFrame(0, 0, -castLength / 2));
		part.Color = !inHitbox
			? Color3.fromRGB(60, 255, 60)
			: blocked
				? Color3.fromRGB(255, 220, 60)
				: Color3.fromRGB(255, 60, 60);
		part.Transparency = 0.7;
		part.Parent = Workspace;
		task.delay(0.25, () => part.Destroy());
	}

	return inHitbox && !blocked ? { target, model, humanoid } : undefined;
}
