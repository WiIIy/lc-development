import { scheduler } from "shared/scheduler";
import { SightTrackingSystem } from "./tracking/SightTrackingSystem";
import {
	TargetSettingSystem,
	TargetTransformCleanupSystem,
	TargetTransformTrackingSystem,
} from "./tracking/TargetSettingSystem";
import { BodyTrackingSystem } from "./tracking/BodyTrackingSystem";
import { PathCleanupSystem, PathFollowSystem, PathRequestSystem, PathSetupSystem } from "./pathing/PathfindingSystem";
import { AttackExecutionSystem, AttackSystem, QueuedAttackExecutionSystem } from "./melee/AttackSystem";

scheduler.addSystems([
	SightTrackingSystem,
	TargetSettingSystem,
	TargetTransformTrackingSystem,
	TargetTransformCleanupSystem,

	BodyTrackingSystem,

	PathSetupSystem,
	PathRequestSystem,
	PathFollowSystem,
	PathCleanupSystem,

	AttackSystem, //choose moveset
	AttackExecutionSystem, //execute attack callback
	QueuedAttackExecutionSystem, //execute the rest of the queue

]);
