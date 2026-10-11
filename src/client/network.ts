import { ReplicatedStorage } from "@rbxts/services";
import { CreateClient } from "@rbxts/wcs";
import { GlobalEvents, GlobalFunctions } from "shared/network";

export const RemoteEvents = GlobalEvents.createClient({});
export const RemoteFunctions = GlobalFunctions.createClient({});

const Client = CreateClient();

Client.RegisterDirectory(ReplicatedStorage.TS.movesets);
Client.RegisterDirectory(ReplicatedStorage.TS.skills);
Client.RegisterDirectory(ReplicatedStorage.TS.statusEffects);

Client.Start();
