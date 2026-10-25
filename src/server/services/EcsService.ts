/* eslint-disable roblox-ts/lua-truthiness */
import { Service, OnStart } from "@flamework/core";
import { Players, ReplicatedStorage, Teams, Workspace } from "@rbxts/services";
import ProfileStore, { Profile } from "@rbxts/profile-store";
import { RemoteEvents } from "server/network";
import { ref } from "@willy/jecs-utils";
import world from "shared/world";
import { Id, TagDiscriminator } from "@rbxts/jecs";

@Service({})
export class EcsService implements OnStart {
	constructor() {}

	onStart(): void {
		RemoteEvents.addComponentToEntityReference.connect(
			(player, entityRef: Instance, component: Id<TagDiscriminator>, add: boolean) => {
				const e = ref.find(entityRef);
				if (add){
					if (e !== undefined) {
						world.add(e, component);
						print( "added component "+ component + " to entity "+ e + "| has:" + world.has(e, component))
						Workspace.evilWillyButtons["Sight Tracking"].SetAttribute("On", true)
					}
				} else {
					if (e !== undefined) {
						world.remove(e, component);
						print( "removed component "+ component + " to entity "+ e + "| has:" + world.has(e, component))
						Workspace.evilWillyButtons["Sight Tracking"].SetAttribute("On", false)
					}
				}
				
			},
		);
	}
}
