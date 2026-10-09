import { Scheduler } from "@rbxts/planck";
import PlanckJabby from "@rbxts/planck-jabby";
import { Plugin as PlanckRunService } from "@rbxts/planck-runservice";

import { State } from "./state";
import world from "./world";
import { NetworkRoutes } from "./network";

export const scheduler = new Scheduler(world, NetworkRoutes, State);

scheduler.addPlugin(new PlanckJabby()).addPlugin(new PlanckRunService());
