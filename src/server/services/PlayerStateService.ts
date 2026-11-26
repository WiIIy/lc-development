/* eslint-disable roblox-ts/lua-truthiness */
import { Service, OnStart } from "@flamework/core";
import { Players, ReplicatedStorage, Teams, Workspace } from "@rbxts/services";
import ProfileStore, { Profile } from "@rbxts/profile-store";
import { RemoteEvents } from "server/network";
import { ref } from "@willy/jecs-utils";
import world from "shared/world";
import { Component, Id, TagDiscriminator } from "@rbxts/jecs";
import Components from "shared/components";

@Service({})
export class PlayerStateTrackerService implements OnStart {
	constructor() { }

	onStart(): void {
		RemoteEvents.updatePlayerBehavior.connect((player, behavior) => {
			print("updated", behavior);
			const playerEntity = ref.get(player);
			if (!playerEntity) {
				print("no player entity associated with state change");
				return;
			}
			world.set(playerEntity, Components.PlayerBehavior, behavior);
		});
	}
}
