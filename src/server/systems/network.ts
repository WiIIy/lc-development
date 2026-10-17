import { GlobalEvents, GlobalFunctions, NetworkRoutes, replicator } from "shared/network";

import type { World } from "@rbxts/jecs";
import Log from "@rbxts/log";
import { Phase, timePassed } from "@rbxts/planck";
import { Phases } from "@rbxts/planck-runservice";

import { scheduler } from "shared/scheduler";

export const server_replicator = replicator.server;

let replicatorReady = false;

function setupReplicator(_world: World): void {
	if (replicatorReady) return;

	if (replicator.server.inited) {
		replicatorReady = true;
		return;
	}
	const { server } = replicator;
	server.init();
}

function updateReliableReplicator(_world: World): void {
	const { server } = replicator;

	for (const [_, player] of NetworkRoutes.ReplecsInitialSyncRoute.query()) {
		const plr = player as Player;

		const [buf, variants] = server.get_full(plr);

		// Pack exactly like the reliable route for consistency
		const payload = { buf: buf as unknown, variants: (variants || []) as unknown };
		NetworkRoutes.ReplecsInitialSyncRoute.send(payload as unknown as buffer).to(plr);

		server.mark_player_ready(plr);
		Log.Debug(`[Network] Sent full snapshot to ${plr.Name}`);
	}

	// Handle standard component updates (This can stay throttled at 10Hz)
	for (const [player, buf, variants] of server.collect_updates()) {
		if (!server.is_player_ready(player)) continue;
		const payload = { buf: buf as unknown, variants: (variants || []) as unknown };
		NetworkRoutes.ReplecsReliableRoute.send(payload as unknown as buffer).to(player);
	}
}

function updateUnreliableReplicator(_world: World): void {
	const { server } = replicator;
	assert(server.inited === true, "Replicator server not initialized");
	for (const [player, buf, variants] of server.collect_unreliable()) {
		const payload = { buf: buf as unknown as unknown, variants: (variants || []) as unknown };
		// Log.Debug(
		// 	`[Network] Sending unreliable update to ${tostring(player)}; payload=${tostring(
		// 		payload,
		// 	)} variants=${tostring(variants)}`,
		// );
		NetworkRoutes.ReplecsUnreliableRoute.send(payload as unknown as buffer).to(player);
	}
}

scheduler.addSystem(setupReplicator, Phases.PreUpdate).addSystem(
	{
		runConditions: [timePassed(1 / 10)],
		system: updateReliableReplicator,
	},
	Phases.PostUpdate as unknown as Phase,
);

scheduler.addSystem(
	{
		runConditions: [timePassed(1 / 30)],
		system: updateUnreliableReplicator,
	},
	Phases.PostUpdate as unknown as Phase,
);
