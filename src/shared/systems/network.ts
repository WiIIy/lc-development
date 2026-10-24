import type { Phase } from "@rbxts/planck";
import { Phases } from "@rbxts/planck-runservice";
import { beginNetworkFrame, endNetworkFrame } from "shared/network";

import { scheduler } from "shared/scheduler";

scheduler
	.addSystem(
		{
			name: "beginNetworkFrame",
			system: () => {
				beginNetworkFrame();
			},
		},
		Phases.First as unknown as Phase,
	)
	.addSystem(
		{
			name: "endNetworkFrame",
			system: () => {
				endNetworkFrame();
			},
		},
		Phases.Last as unknown as Phase,
	);
