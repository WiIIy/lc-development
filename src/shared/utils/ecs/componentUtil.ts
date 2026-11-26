import { Name, Archetype, Entity, pair, Component } from "@rbxts/jecs";
import world, { replicator } from "shared/world";
import Replecs from "@rbxts/replecs";

type LooseLib = { set_serdes(component: unknown, serdes: unknown): void };

export function setSerdes<T>(component: Entity<T>, serdes: Replecs.SerdesTable<T>): void {
	(replicator as unknown as LooseLib).set_serdes(component, serdes);
}

//this is done because using world.component makes replecs entities overlap
//world.entity starts at a higher count like 240 instead of 1 2 3, replecs component ids are 1 2 3
export const component = <T>() => {
	const e = world.entity();
	world.add(e, Component);
	return e as unknown as Entity<T>;
};
