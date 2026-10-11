import { ReplicatedStorage } from "@rbxts/services";
import { CreateServer } from "@rbxts/wcs";
import { GlobalEvents, GlobalFunctions } from "shared/network";

export const RemoteEvents = GlobalEvents.createServer({});
export const RemoteFunctions = GlobalFunctions.createServer({});

const Server = CreateServer();

Server.RegisterDirectory(ReplicatedStorage.TS.movesets);
Server.RegisterDirectory(ReplicatedStorage.TS.skills);
Server.RegisterDirectory(ReplicatedStorage.TS.statusEffects);

Server.Start();
