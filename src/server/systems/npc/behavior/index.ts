//src/server/systems/npc/behavior/index.ts
import { ActionExecutionSystem, ActionLifecycleSystem } from "./ActionExecutionSystem";
import { NonReactiveBrainSystem } from "./NonReactiveBrainSystem";
import { ReactiveBrainSystem } from "./ReactiveBrainSystem";

export { ReactiveMovementSystem } from "./ReactiveMovementSystem";

/** order matters: finish old actions, let ONE brain per npc request, execute in the same frame */
export const NpcBehaviorSystems = [
	ActionLifecycleSystem,
	NonReactiveBrainSystem,
	ReactiveBrainSystem,
	ActionExecutionSystem,
];
