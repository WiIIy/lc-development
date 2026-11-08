import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components/components";

// Priority:
//  1. target visible            -> live target position
//  2. target held in grace time -> last seen position
//  3. memory, before snapshot   -> last seen position (the 0.5s "where did they go")
//  4. otherwise                 -> undefined (face the walk direction)
export function getLookPoint(e: Entity): Vector3 | undefined {
	const seen = world.get(e, Components.LastSeen);

	if (world.target(e, Components.Target) !== undefined) {
		const tt = world.get(e, Components.TargetTransform);
		if (seen?.visible && tt) return tt.Position;
		return seen?.pos.Position;
	}

	const mem = world.get(e, Components.MemoryState);
	if (mem && mem.snapshot === undefined) return mem.lastSeenPos;

	return undefined;
}
