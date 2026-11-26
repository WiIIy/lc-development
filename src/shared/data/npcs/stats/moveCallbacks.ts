// Universal: a callback knows nothing about a specific weapon, it gets the numbers passed in.
// Animation loading and cleanup live in ActionExecutionSystem, once, for every move.
// New move: add data + animation to the weapon, and ONE line here if the name is new.
import { Entity } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { registerMeleeHit } from "shared/utils/npc/attack/registerMeleeHit";
import { meleeCast } from "shared/utils/npc/attack/meleeCast";

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
		const contact = meleeCast(entity, shove.blockcast);
		if (contact === undefined) return;

		// breaks a parry and stuns. A player's WCS parry skill must also stop when this tag is removed
		world.remove(contact.target, Components.Parrying);
		const now = os.clock();
		world.set(contact.target, Components.Stunned, { startTime: now, endTime: now + shove.stunTime });
	},
};

export const MoveCallbacks: { [name: string]: MoveCallback } = {
	light: meleeStrike,
	heavy: meleeStrike,
	shove: shoveStrike,
};
