import type { World } from "@rbxts/jecs";
import { Phase } from "@rbxts/planck";
import { Phases } from "@rbxts/planck-runservice";
import {
	NetworkRoutes,
} from "shared/network";

import { scheduler } from "shared/scheduler";
import Log from "@rbxts/log";
import { ref } from "@willy/jecs-utils";
import { replicator } from "shared/world";

let initialSyncReceived = false;
let lastRequestTime = 0;
let replicatorReady = false;

function setupReplicator(_world: World): void {
	if (replicatorReady) return;

	if (replicator.client.inited) {
		replicatorReady = true;
		return;
	}
	const { client } = replicator;
	client.init();


	if (!client.inited) {
		client.handle_global((id) => ref(id));
	}
	if (initialSyncReceived) {
		scheduler.removeSystem(setupReplicator);
		return;
	}
	const now = os.clock();
	if (now - lastRequestTime > 0.5) {
		lastRequestTime = now;
		const initialPayload = { request: true } as unknown as buffer;
		NetworkRoutes.ReplecsInitialSyncRoute.send(initialPayload);
	}
}

function updateReplicator(_world: World): void {
	const { client } = replicator;
	assert(client.inited === true, "Replicator client not initialized");

	// 1. Process Initial Sync
	for (const entry of NetworkRoutes.ReplecsInitialSyncRoute.query()) {
		const [, , a3, a4] = entry as LuaTuple<[number, unknown, unknown, unknown?]>;
		let buf: buffer | undefined;
		let variants: Array<Array<unknown>> | undefined;

		if (typeIs(a3, "table") && (a3 as { buf?: unknown }).buf !== undefined) {
			const payload = a3 as { buf: buffer; variants: Array<Array<unknown>> };
			buf = payload.buf;
			variants = payload.variants;
		} else {
			buf = a3 as buffer;
			variants = a4 as Array<Array<unknown>>;
		}

		if (buf) {
			client.apply_full(buf, (variants || []) as defined[][]);
			initialSyncReceived = true;
			Log.Info("[Network] Full snapshot applied.");
		}
	}

	// GUARD: Stop if we haven't synced yet
	if (!initialSyncReceived) return;

	// 2. Process Unreliable Route
	for (const entry of NetworkRoutes.ReplecsUnreliableRoute.query()) {
		const [, , a3, a4] = entry as LuaTuple<[number, unknown, unknown, unknown?]>;
		let buf: buffer | undefined;
		let variants: Array<Array<unknown>> | undefined;

		if (typeIs(a3, "table") && (a3 as { buf?: unknown }).buf !== undefined) {
			const payload = a3 as { buf: buffer; variants: Array<Array<unknown>> };
			buf = payload.buf;
			variants = payload.variants;
		} else {
			buf = a3 as buffer;
			variants = a4 as Array<Array<unknown>>;
		}

		if (buf) {
			client.apply_unreliable(buf, (variants || []) as defined[][]);
		}
	}

	// 3. Process Reliable Route
	for (const entry of NetworkRoutes.ReplecsReliableRoute.query()) {
		const [, , a3, a4] = entry as LuaTuple<[number, unknown, unknown, unknown?]>;
		let buf: buffer | undefined;
		let variants: Array<Array<unknown>> | undefined;

		if (typeIs(a3, "table") && (a3 as { buf?: unknown }).buf !== undefined) {
			const payload = a3 as { buf: buffer; variants: Array<Array<unknown>> };
			buf = payload.buf;
			variants = payload.variants;
		} else {
			buf = a3 as buffer;
			variants = a4 as Array<Array<unknown>>;
		}

		if (buf) {
			client.apply_updates(buf, (variants || []) as defined[][]);
		}
	}
}

scheduler
	.addSystem(
		{
			name: "setupReplicator (client)",
			system: setupReplicator
		}, 
		Phases.PreUpdate)

	.addSystem(
		{
			name: "updateReplicator (client)",
			system: updateReplicator
		}, 
		Phases.PreUpdate as unknown as Phase);
