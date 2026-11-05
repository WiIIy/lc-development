import { Entity, Id, TagDiscriminator, Wildcard, pair } from "@rbxts/jecs";
import Components from "shared/components/components";
import { NpcMeleeWeaponsData } from "shared/data/npcs/weaponsData";
import world from "shared/world";

export function getWeaponData(e: Entity): NpcMeleeWeapon | undefined {
	const weaponString = world.get(e, pair(Components.CurrentlyEquipped, Wildcard)); //returns weapon string like "fists"
	// print(weaponString)
	if (weaponString === undefined) {
		print("no weapon data");
		return undefined;
	};
	return NpcMeleeWeaponsData[weaponString as unknown as keyof typeof NpcMeleeWeaponsData];
}

export function sliceFrom(list: string[], start: number): string[] {
	const out: string[] = [];
	for (let i = start; i < list.size(); i++) out.push(list[i]);
	return out;
}
