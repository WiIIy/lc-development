// an npc only ever hits its current target, and only a living player character
import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { meleeCast } from "shared/utils/combat/meleeCast";

const Players = game.GetService("Players");

export function castAtTarget(e: Entity, blockcast: { size: Vector3; distance: number }) {
	if (!world.contains(e)) return undefined;
	const target = world.target(e, Components.Target);
	if (target === undefined) return undefined;
	const transform = world.get(e, Components.Transform);
	const model = world.get(target, Components.Basepart)?.Parent;
	if (transform === undefined || model === undefined || !model.IsA("Model")) return undefined;
	const humanoid = model.FindFirstChildOfClass("Humanoid");
	if (humanoid === undefined || humanoid.Health <= 0) return undefined;
	if (Players.GetPlayerFromCharacter(model) === undefined) return undefined;

	const hit = meleeCast(transform, world.get(e, Components.Basepart)?.Parent, [model], blockcast);
	return hit !== undefined ? { target, model, humanoid, part: hit.part } : undefined;
}
