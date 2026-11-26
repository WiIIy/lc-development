import world from "../world";
import { component } from "shared/utils/ecs/componentUtil";

export const NpcBehaviorComponents = {
	/** THE divide. Present = reactive brain. Absent = non-reactive brain (default). */
	Reactive: world.entity(),

	// shared by both brains
	ActionRequest: component<ActionRequest>(),
	Attacking: component<ActiveAction>(),
	ActionLockedUntil: component<number>(),
	ParryState: component<ParryState>(),

	// non-reactive only
	ComboState: component<ComboState>(),

	// reactive only
	ReactiveDecision: component<ReactiveDecision>(),
	ReactiveMovement: component<SelfMovement>(),
	ReactiveGrants: component<ReactiveGrants>(),
};
