import { Players } from "@rbxts/services";
import { Character } from "@rbxts/wcs";

export function getCurrentWCS_Character() {
	const characterModel = Players.LocalPlayer.Character;
	if (!characterModel) return undefined;
	return Character.GetCharacterFromInstance(characterModel);
}
