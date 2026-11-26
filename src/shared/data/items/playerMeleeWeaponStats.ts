// PLAYER melee stats. NPC stats stay in data/npcs/stats/weaponsData.ts, so each side tunes separately.
import assets from "shared/assets";

export const DEFAULT_PARRY_STUN = 1.5;
export const DEFAULT_SHOVE_STUN = 1.5;

const FIST_BOX = { size: new Vector3(3, 4, 1), distance: 3 };

export const PlayerMeleeWeaponStats: { [id: string]: PlayerMeleeWeapon } = {
	fists: {
		id: "fists",
		light: {
			damage: 10,
			bleedChance: 0.07,
			fractureChance: 0.07,
			blockcast: FIST_BOX,
			cooldown: 0.5,
			minHitDelay: 0.05,
		},
		heavy: {
			damage: 25,
			bleedChance: 0.15,
			fractureChance: 0.15,
			blockcast: FIST_BOX,
			cooldown: 0.7,
			minHitDelay: 0.1,
		},
		shove: { damage: 0, bleedChance: 0, fractureChance: 0, blockcast: FIST_BOX, cooldown: 1.5, minHitDelay: 0 },
		block: { cooldown: 0.4 },
		parryStunDuration: 1.5,
		shoveStunDuration: 1.5,
		animations: {
			light: assets["anims/character/npc/item/fists/fistslight.rbxm"], // marker: hit
			heavy: assets["anims/character/npc/item/fists/fistsheavy.rbxm"], // marker: hit
			shove: assets["anims/character/npc/item/fists/fistsshove.rbxm"], // marker: hit
			block: assets["anims/character/npc/item/fists/fistsblock.rbxm"], // held pose
		},
	},
};
