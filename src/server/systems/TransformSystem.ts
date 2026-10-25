import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Entity, Id, Name, pair, Tag, TagDiscriminator, Wildcard } from "@rbxts/jecs";
import { Components } from "shared/components/components";
import Make from "@rbxts/make";

export const TransformSystem = {
	name: "TransformSystem",
	system: () => {
		for (const [e, transform, basepart] of world.query(Components.Transform, Components.Basepart)) {
			world.set(e, Components.Transform, basepart.CFrame);
		}
	},
};
