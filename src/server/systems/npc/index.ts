import { scheduler } from "shared/scheduler";
import { SightTrackingSystem } from "./tracking/SightTrackingSystem";
import {
	TargetSettingSystem,
	TargetTransformCleanupSystem,
	TargetTransformTrackingSystem,
} from "./tracking/TargetSettingSystem";
scheduler.addSystems([
	SightTrackingSystem,
	TargetSettingSystem,
	TargetTransformTrackingSystem,
	TargetTransformCleanupSystem,
]);
