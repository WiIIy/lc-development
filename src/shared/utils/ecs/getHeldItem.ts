import { ref } from "@willy/jecs-utils";
import Components from "../../components/components";
import world from "../../world";
import { pair, Wildcard } from "@rbxts/jecs";

export function getPlayersCururentlyHeldItem(player: Player): string | undefined {
	const playerEntity = ref.find(player);
	if (playerEntity === undefined) {
		print("no player reference");
		return;
	}
	const item = world.get(playerEntity, pair(Components.CurrentlyEquipped, Wildcard));
	if (item === undefined) {
		print("item is nil, this shouldn't be firing");
		return;
	}
	return item;
}

export function getNPCCururentlyHeldItem(npc: Model): string | undefined {
	const playerEntity = ref.find(npc);
	if (playerEntity === undefined) {
		print("no NPC reference");
		return;
	}
	const item = world.get(playerEntity, pair(Components.CurrentlyEquipped, Wildcard));
	if (item === undefined) {
		print("item is nil, this shouldn't be firing");
		return;
	}
	return item;
}
