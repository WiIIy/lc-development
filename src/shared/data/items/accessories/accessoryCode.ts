import { ReplicatedStorage } from "@rbxts/services";
import { Character } from "@rbxts/wcs";
import { GrapplingHook } from "shared/skills/grapplinghook";
import { AccessoryNames } from "./allaccessories";
import { giveCharacterAccessory } from "shared/utils/visual/giveCharacterAccessory";

export const CharacterAccessoryContainer = ReplicatedStorage.CAAssets.accessories.character;

export const ItemAccessoryContainer = ReplicatedStorage.CAAssets.accessories.character.items;

export const ViewmodelAccessoryContainer = ReplicatedStorage.CAAssets.accessories.viewmodel;

export const viewmodelAccessoryStrings = ["GrapplingHookArmL_vm"];

export const AccessoryAssets: Record<string, Accessory | undefined> = {
	LariL: CharacterAccessoryContainer.LariL,
	LariR: CharacterAccessoryContainer.LariR,
	JesusJudas: CharacterAccessoryContainer.JesusJudas,
	GrapplingHookArmL: CharacterAccessoryContainer.GrapplingHookArmL,
	GrapplingHookBelt: CharacterAccessoryContainer.GrapplingHookBelt,
	GrapplingHookLegL: CharacterAccessoryContainer.GrapplingHookLegL,
	GrapplingHookLegR: CharacterAccessoryContainer.GrapplingHookLegR,
};

export type AccessoryKey = keyof typeof AccessoryNames;

export const AccessoryAddingCallBack: Record<string, Callback | undefined> = {
	Lari: (player: Player) => {
		giveCharacterAccessory(player.Character!, AccessoryAssets.LariL!);
		giveCharacterAccessory(player.Character!, AccessoryAssets.LariR!);
		const hum = player.Character?.WaitForChild("Humanoid") as Humanoid;
		hum.HipHeight += 0.2;
		//things like adjust player height or modify attack stats
	},
	JesusJudas: (player: Player) => {
		giveCharacterAccessory(player.Character!, AccessoryAssets.JesusJudas!);
	},
	GrapplingHook: (player: Player) => {
		const wcsCharacter = Character.GetCharacterFromInstance(player.Character!);
		if (!wcsCharacter?.GetSkillFromConstructor(GrapplingHook)) {
			new GrapplingHook(wcsCharacter!);
		}
		ReplicatedStorage["shared/network@GlobalEvents"].equipAccessoryOnViewmodel.FireClient(
			player,
			"GrapplingHookArmL_vm",
		);

		giveCharacterAccessory(player.Character!, AccessoryAssets.GrapplingHookArmL!);
		giveCharacterAccessory(player.Character!, AccessoryAssets.GrapplingHookBelt!);
		giveCharacterAccessory(player.Character!, AccessoryAssets.GrapplingHookLegL!);
		giveCharacterAccessory(player.Character!, AccessoryAssets.GrapplingHookLegR!);
	},
};
export const AccessoryRemovingCallBack: Record<string, Callback | undefined> = {
	lari: () => {},
};
