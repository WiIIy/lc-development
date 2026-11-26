import { Entity, pair } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { NpcMeleeWeaponsData } from "shared/data/npcs/stats/weaponsData";

// add future tables (firearms...) here
const registry = new Map<string, NpcWeapon>();
for (const [, weapon] of pairs(NpcMeleeWeaponsData)) registry.set(weapon.id, weapon);

const warned = new Set<string>();

/** pair(CurrentlyEquipped, itemEntity) holds the weapon id string, same as players */
export function getNpcWeapon(e: Entity): NpcWeapon | undefined {
	const item = world.target(e, Components.CurrentlyEquipped);
	if (item === undefined) return undefined;
	const id = world.get(e, pair(Components.CurrentlyEquipped, item) as unknown as Entity<string>);
	if (id === undefined) return undefined;

	const weapon = registry.get(id);
	if (weapon === undefined && !warned.has(id)) {
		warned.add(id);
		warn(`[getNpcWeapon] entity ${e} equips "${id}", which has no weaponsData entry`);
	}
	return weapon;
}
