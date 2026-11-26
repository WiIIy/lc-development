//src/server/systems/npc/behavior/NonReactiveBrainSystem.ts
// NON-REACTIVE (default): picks a weighted moveset and walks through it.
// Reads nothing about what the target is doing. Parry and shove are ordinary combo steps.
import { pair, Wildcard } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { OUT_OF_RANGE_OVERRIDE } from "shared/data/npcs/stats/combatDefaults";
import { getNpcWeapon } from "shared/utils/npc/attack/getNpcWeapon";
import { actionRange, flatDistance, isCapable, isFree, pickWeighted } from "shared/utils/npc/attack/combatRules";

const stunned = world.query(Components.ComboState).with(Components.Stunned).cached();
const becameReactive = world.query(Components.ComboState).with(Components.Reactive).cached();
const combatOff = world.query(Components.ComboState).without(Components.MeleeAttacks).cached();
const lostTarget = world.query(Components.ComboState).without(pair(Components.Target, Wildcard)).cached();

function freshCombo(weaponId: string): ComboState {
	return { weaponId, movesetIndex: -1, step: 0, inFlight: false, readyAt: 0 };
}

function dropMoveset(combo: ComboState, readyAt: number) {
	combo.movesetIndex = -1;
	combo.step = 0;
	combo.outOfRangeSince = undefined;
	combo.readyAt = readyAt;
}

/** only movesets whose first step is possible now. `excluded` is skipped unless nothing else exists */
function chooseMoveset(weapon: NpcWeapon, usable: (action: string) => boolean, excluded: number): number {
	const open: number[] = [];
	for (let i = 0; i < weapon.movesets.size(); i++) {
		if (i !== excluded && usable(weapon.movesets[i].combo[0])) open.push(i);
	}
	if (open.size() === 0 && excluded >= 0 && usable(weapon.movesets[excluded].combo[0])) return excluded;
	return pickWeighted(open, (i) => weapon.movesets[i].weight ?? 1) ?? -1;
}

export const NonReactiveBrainSystem = {
	name: "NonReactiveBrainSystem",
	system: () => {
		const now = os.clock();
		for (const [e] of stunned) world.remove(e, Components.ComboState); // a stagger breaks the combo
		for (const [e] of becameReactive) world.remove(e, Components.ComboState);
		for (const [e] of combatOff) world.remove(e, Components.ComboState);
		for (const [e] of lostTarget) world.remove(e, Components.ComboState);

		for (const [e, transform, targetTransform] of world
			.query(Components.Transform, Components.TargetTransform)
			.with(Components.MeleeAttacks, pair(Components.Target, Wildcard))
			.without(Components.Reactive)) {
			const weapon = getNpcWeapon(e);
			if (weapon === undefined) continue;

			let combo = world.get(e, Components.ComboState);
			if (combo === undefined || combo.weaponId !== weapon.id) {
				combo = freshCombo(weapon.id);
				world.set(e, Components.ComboState, combo);
			}

			// the step we asked for is over (finished, interrupted or refused)
			if (combo.inFlight) {
				if (world.has(e, Components.Attacking) || world.has(e, Components.ActionRequest)) continue;
				combo.inFlight = false;
				combo.step += 1;
				const moveset = weapon.movesets[combo.movesetIndex];
				if (moveset === undefined || combo.step >= moveset.combo.size()) {
					dropMoveset(combo, now + weapon.movesetDelay);
				} else {
					combo.readyAt = now + weapon.moveDelay;
				}
			}
			if (now < combo.readyAt || !isFree(e, now)) continue;

			const distance = flatDistance(transform.Position, targetTransform.Position);
			const usable = (action: string) =>
				isCapable(e, weapon, action, now) && (action !== "parry" || distance <= actionRange(weapon, action));

			if (combo.movesetIndex < 0) {
				combo.movesetIndex = chooseMoveset(weapon, usable, -1);
				combo.step = 0;
				if (combo.movesetIndex < 0) continue;
			}

			const action = weapon.movesets[combo.movesetIndex].combo[combo.step];
			if (!usable(action)) {
				dropMoveset(combo, now + weapon.moveDelay); // e.g. parry on timeout mid-combo
				continue;
			}

			if (distance > actionRange(weapon, action)) {
				combo.outOfRangeSince ??= now;
				if (now - combo.outOfRangeSince > OUT_OF_RANGE_OVERRIDE) {
					combo.movesetIndex = chooseMoveset(weapon, usable, combo.movesetIndex);
					combo.step = 0;
					combo.outOfRangeSince = undefined;
				}
				continue;
			}

			combo.outOfRangeSince = undefined;
			combo.inFlight = true;
			world.set(e, Components.ActionRequest, { action });
		}
	},
};
