// -> shared/utils/ecs/playerAction.ts
// SERVER ONLY (call it from the skills' server handlers). The server owns PlayerBehavior.actionState,
// the client only reports movement/environment/body/speed (see PlayerStateTrackerService).
//
// Needs in components.ts:
//   static ActionToken = component<number>(); // bumped on every action so stale timed resets can tell they are stale
// Needs in the global d.ts, wherever ActionState is declared:
//   type ActionState = "idle" | "meleelight" | "meleeheavy" | "parrying" | "shoving";

import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import Components from "shared/components";

/** sets actionState, keeping every other PlayerBehavior field.
 *  duration given: the action ends by itself after that many seconds (swings, shoves).
 *  duration omitted: held until clearPlayerAction is called (blocking). */
export function setPlayerAction(playerEntity: Entity, action: ActionState, duration?: number): void {
	const current = world.get(playerEntity, Components.PlayerBehavior);
	if (current === undefined) return;

	const token = (world.get(playerEntity, Components.ActionToken) ?? 0) + 1;
	world.set(playerEntity, Components.ActionToken, token);
	world.set(playerEntity, Components.PlayerBehavior, { ...current, actionState: action });

	if (duration === undefined) return;
	task.delay(duration, () => {
		if (!world.contains(playerEntity)) return; // player left
		if (world.get(playerEntity, Components.ActionToken) !== token) return; // a newer action took over, not ours to end
		clearPlayerAction(playerEntity, action);
	});
}

/** ends `action` only if it is still the current one. Falls back to "parrying" while the block key is still held,
 *  otherwise "idle". For blocking: remove the Parrying tag BEFORE calling this, so the fallback doesn't re-enter it. */
export function clearPlayerAction(playerEntity: Entity, action: ActionState): void {
	const current = world.get(playerEntity, Components.PlayerBehavior);
	if (current === undefined || current.actionState !== action) return;

	const Next: ActionState = world.has(playerEntity, Components.Parrying) ? "parrying" : "idle";
	if (Next === current.actionState) return;
	world.set(playerEntity, Components.PlayerBehavior, { ...current, actionState: Next });
}