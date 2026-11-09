import { scheduler } from "shared/scheduler";
import { SightTrackingSystem } from "./tracking/SightTrackingSystem";
import {
	TargetSettingSystem,
	TargetTransformCleanupSystem,
	TargetTransformTrackingSystem,
} from "./tracking/TargetSettingSystem";
import { BodyTrackingSystem } from "./tracking/BodyTrackingSystem";
import {
	PathCleanupSystem,
	PathFollowSystem,
	PathGoalClearSystem,
	PathRequestSystem,
	PathSetupSystem,
	PursuitGoalSystem,
} from "./pathing/PathfindingSystem";
import { MemorySystem } from "./pathing/MemorySystem";
import { AttackExecutionSystem, AttackSystem, QueuedAttackExecutionSystem } from "./melee/AttackSystem";
import { Phases } from "@rbxts/planck-runservice";
import { TransformSystem } from "../TransformSystem";
import { StopFacingWallsSystem } from "./pathing/StopFacingWallSystem";

// 1) PreSimulation: write MoveTo / root CFrame before physics runs
scheduler.addSystems(
	[
		PathSetupSystem,
		PursuitGoalSystem,
		MemorySystem,
		PathRequestSystem,
		PathFollowSystem,
		PathGoalClearSystem,
		PathCleanupSystem,
	],
	Phases.PreSimulation,
);

// 2) PostSimulation: read the settled world, then decide and apply visuals
scheduler.addSystems(
	[
		TransformSystem, // must be first: everything below reads Transform
		TargetSettingSystem,
		TargetTransformTrackingSystem,
		SightTrackingSystem, // neck C0
		BodyTrackingSystem, // RootJoint C0
	],
	Phases.PostSimulation,
);

// 3) Update (Heartbeat): gameplay reactions
scheduler.addSystems(
	[AttackSystem, AttackExecutionSystem, QueuedAttackExecutionSystem, StopFacingWallsSystem],
	Phases.Update,
);

// 4) PostUpdate: cleanup runs after everything in Update
scheduler.addSystems([TargetTransformCleanupSystem], Phases.PostUpdate);

//TargetSetting → TargetTransformTracking → PursuitGoal → Memory →
// PathRequest → PathFollow → PathGoalClear → Attack systems → TargetTransformCleanup
