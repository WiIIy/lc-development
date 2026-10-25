import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Entity, Id, Name, pair, Tag, TagDiscriminator, w, Wildcard } from "@rbxts/jecs";
import { Components } from "shared/components/components";
import Make from "@rbxts/make";
import { Players, Workspace } from "@rbxts/services";
import { ref } from "@willy/jecs-utils";

const trackerRemoved = world.query(pair(Components.Target, Wildcard)).without(Components.Tracking).cached();

const targetRemoved = world.query(Components.TargetTransform).without(pair(Components.Target, Wildcard)).cached();

export const TargetSettingSystem = {
	name: "TargetSettingSystem",
	system: () => {
		for (const [e] of world.query(Components.Tracking)) {
			if (world.target(e, Components.Target) !== undefined) continue;

			const willyEntity = ref.find(Players.FindFirstChild("WillysInPain")!);
			print("woh", willyEntity);
			world.add(e, pair(Components.Target as Entity, willyEntity!) as Id<TagDiscriminator>);
		}
	},
};

//not runnin
export const TargetTransformTrackingSystem = {
	name: "TargetTransformTrackingSystem",
	system: () => {
		for (const [e] of world.query(pair(Components.Target, Wildcard))) {
			// print("a")
			const plrEntity = world.target(e, Components.Target);
			const plrTrsfrm = world.get(plrEntity!, Components.Transform);
			// print("player transform", plrTrsfrm);
			world.set(e, Components.TargetTransform, plrTrsfrm!);
		}
	},
};

export const TargetTransformCleanupSystem = {
	name: "TargetTransformCleanupSystem",
	system: () => {
		for (const [e] of trackerRemoved) {
			world.remove(e, pair(Components.Target, Wildcard));
		}

		for (const [e] of targetRemoved) {
			world.remove(e, Components.TargetTransform);
			print("AAAH");
			const neck = world.get(e, Components.NeckJoint) as Motor6D;
			neck.C0 = new CFrame(0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);
		}
	},
};
