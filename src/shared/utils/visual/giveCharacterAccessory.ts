import { Players, ReplicatedStorage } from "@rbxts/services";

export function giveCharacterAccessory(character: Model, accessoryTemplate: Accessory) {
	const clone = accessoryTemplate.Clone();
	const player = Players.GetPlayerFromCharacter(character) as Player;
	clone.Parent = character;
	ReplicatedStorage["shared/network@GlobalEvents"].makeLocallyTransparent.FireClient(player, clone);
}
