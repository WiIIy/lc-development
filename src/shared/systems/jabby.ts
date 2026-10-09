import jabby from "@rbxts/jabby";
import { Phase } from "@rbxts/planck";
import { RunService, UserInputService } from "@rbxts/services";

import { scheduler } from "shared/scheduler";
import world from "shared/world";

function setupJabby(): void {
	const prefix = RunService.IsServer() ? "[Server]" : "[Client]";
	jabby.register({
		applet: jabby.applets.world,
		configuration: {
			world,
		},
		name: `World ${prefix}`,
	});
	jabby.set_check_function(() => true);

	if (RunService.IsClient()) {
		let mounted = false;
		const client = jabby.obtain_client();
		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) {
				return;
			}

			if (input.KeyCode !== Enum.KeyCode.F4) {
				return;
			}

			if (mounted) {
				client.unmount_all();
				mounted = false;
			} else {
				client.spawn_app(client.apps.home);
				mounted = true;
			}
		});
	}
}

scheduler.addSystem(setupJabby, Phase.Startup);
