// Universal: a callback knows nothing about a specific weapon, it gets the numbers passed in.
// Animation loading and cleanup live in ActionExecutionSystem, once, for every move.
// New move: add data + animation to the weapon, and ONE line here if the name is new.
import { Entity } from "@rbxts/jecs";
import { registerMeleeHit } from "shared/utils/npc/attack/registerMeleeHit";
import { castAtTarget } from "shared/utils/npc/attack/castAtTarget";
import { breakPlayerParry } from "shared/utils/combat/playerCombat";
import { DEFAULT_DISABLE_PARRY_LENGTH } from "./combatDefaults";

export type MoveContext = { entity: Entity; moveName: string; weapon: NpcWeapon };
export type MoveCallback = { marker: string; run: (context: MoveContext) => void };

const meleeStrike: MoveCallback = {
	marker: "hit",
	run: ({ entity, moveName, weapon }) => {
		const move = weapon.moves[moveName];
		if (move === undefined) {
			warn(`[meleeStrike] weapon "${weapon.id}" has no data for move "${moveName}"`);
			return;
		}
		print(`[${moveName}] ${registerMeleeHit(entity, moveName, move)}`);
	},
};

const shoveStrike: MoveCallback = {
	marker: "hit",
	run: ({ entity, weapon }) => {
		const shove = weapon.shoveBehavior;
		if (shove === undefined) return;
		const contact = castAtTarget(entity, shove.blockcast);
		if (contact === undefined) return;

		// no stun on players: only the parry is broken and locked out
		breakPlayerParry(contact.target, shove.disableParryLength ?? DEFAULT_DISABLE_PARRY_LENGTH);
	},
};

export const MoveCallbacks: { [name: string]: MoveCallback } = {
	light: meleeStrike,
	heavy: meleeStrike,
	shove: shoveStrike,
};
