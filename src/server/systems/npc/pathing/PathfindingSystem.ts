import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Entity, Id, Name, pair, Tag, TagDiscriminator, Wildcard } from "@rbxts/jecs";
import { Components } from "shared/components/components";
import { PathfindingService } from "@rbxts/services";

PathfindingService.CreatePath({
	AgentRadius: 2,
	AgentHeight: 5,
	AgentCanJump: true,
});

export const PathGenerationSystem = {
	name: "PathGenerationSystem",
	system: () => {
		for (const [e, selfTransform, targetTransform] of world
			.query(Components.Transform, Components.TargetTransform, pair(Components.Target, Wildcard))
			.with(Components.Pathfinding)) {

			// world.set(e, Components.TargetTransform, plrTrsfrm!);
		}
	},
};
