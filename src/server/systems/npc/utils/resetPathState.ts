import { Entity } from "@rbxts/jecs";
import Components from "shared/components/components";
import world from "shared/world";

export function resetPathState(e: Entity) {
	const state = world.get(e, Components.PathState);
	if (state === undefined) return;
	state.requestId++; // in-flight compute discards its result
	state.computing = false;
	state.waypoints = [];
	state.index = 0;
	state.goal = Vector3.zero;
	state.stale = true;
}
