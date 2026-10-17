import { Networking } from "@flamework/networking";
import Log from "@rbxts/log";
import Replecs from "@rbxts/replecs";
import Net, { Route } from "@rbxts/yetanothernet";

import world from "./world";
// import { ItemData } from "./types/InventoryState";
// export const replicator = Replecs.create(world);

// ---- replecs shi ---- //

const ReplecsReliableRoute = new Route<[buffer, Array<Array<unknown>>?]>();
const ReplecsUnreliableRoute = new Route<[buffer, Array<Array<unknown>>?]>();
const ReplecsInitialSyncRoute = new Route<[buffer, Array<Array<unknown>>?]>();

export const NetworkRoutes = {
	ReplecsInitialSyncRoute,
	ReplecsReliableRoute,
	ReplecsUnreliableRoute,
};

export const [beginNetworkFrame, endNetworkFrame] = Net.createHook(NetworkRoutes);

Log.Debug("[Network] Setting up logging middleware");
for (const [name, route] of pairs(NetworkRoutes)) {
	route.addIncomingMiddleware((args) => {
		// Log.Debug(`[Network] Incoming ${name} with args: ${tostring(args)}`);
		return args;
	});
	route.addOutgoingMiddleware((args) => {
		// Log.Debug(`[Network] Outgoing ${name} with args: ${tostring(args)}`);
		return args as unknown;
	});
}
