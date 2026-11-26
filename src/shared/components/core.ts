import { Entity } from "@rbxts/jecs";
import Replecs from "@rbxts/replecs";
import world, { replicator } from "../world";
import { component } from "shared/utils/ecs/componentUtil";

type LooseLib = { set_serdes(component: unknown, serdes: unknown): void };

export function setSerdes<T>(component: Entity<T>, serdes: Replecs.SerdesTable<T>): void {
	(replicator as unknown as LooseLib).set_serdes(component, serdes);
}

export const CoreComponents = {
	Transform: component<CFrame>(), //this is replicated
	Model: component<Model>(),
	Basepart: component<BasePart>(), //primary part of a model, used for pivots, if not humanoid, everything else is welded on
	SystemsAtWork: component<string[]>(),
	// also to store humanoid root part for calculations

	Test: component<string>(),

	//stimulus and perception, World stuff
	GameObject: world.entity(), //things that arent part of the map/interactable, not players

	Highlighted: world.entity(),
};

setSerdes(CoreComponents.Transform, {
	bytespan: 12,
	serialize: (transform) => {
		const buff = buffer.create(12);
		buffer.writef32(buff, 0, transform.X);
		buffer.writef32(buff, 4, transform.Y);
		buffer.writef32(buff, 8, transform.Z);
		return buff;
	},
	deserialize: (buff) => new CFrame(buffer.readf32(buff, 0), buffer.readf32(buff, 4), buffer.readf32(buff, 8)),
});