import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Entity, Id, Name, OnRemove, pair, Tag, TagDiscriminator, Wildcard } from "@rbxts/jecs";
import { Components } from "shared/components/components";
import Make from "@rbxts/make";
import { monitor } from "@willy/jecs-utils";
import { MoveCallbacks } from "shared/data/npcs/stats/moveCallbacks";
import { NpcWeaponsData } from "shared/data/npcs/weaponsData";
import { isTargetInRange } from "shared/utils/npc/attack/targetInRange";
import { getWeaponData, sliceFrom } from "shared/utils/npc/attack/getWeaponData";
import { pickMoveset } from "shared/utils/npc/attack/pickMoveset";

//chooses a moveset/combo
export const AttackSystem = {
	name: "AttackSystem",
	system: () => {
		for (const [e, transform, targetTransform] of world
			.query(Components.Transform, Components.TargetTransform, pair(Components.CurrentlyEquipped, Wildcard))
			.with(Components.MeleeAttacks)
			.without(
				Components.AttackOngoing,
				Components.MovesetDelay,
				Components.QueuedAttacks,
				Components.ExecuteAttack,
			)) {
			//1. check if distance is close enough
			if (!isTargetInRange(transform.Position, targetTransform.Position)) continue;

			//2. choose moveset
			const weaponData = getWeaponData(e);
			if (weaponData === undefined) continue; //e.g. an item with no melee data (a gun): do nothing
			const combo = pickMoveset(weaponData.movesets);
			if (combo === undefined || combo.size() === 0) continue;

			print(combo, sliceFrom(combo, 1), combo[0]);
			//3. execute first move of moveset
			world.set(e, Components.QueuedAttacks, { queued: sliceFrom(combo, 1)}); //what's left of the combo
			world.set(e, Components.ExecuteAttack, combo[0]);
		}
	},
};

//runs the requested move exactly once. A plain system instead of a monitor/OnAdd hook so it is easy to
//order, and so removing ExecuteAttack never happens inside a hook.//runs the requested move exactly once
export const AttackExecutionSystem = {
	name: "AttackExecutionSystem",
	system: () => {
		for (const [e, move] of world.query(Components.ExecuteAttack)) {
			world.add(e, Components.AttackOngoing);
			world.remove(e, Components.ExecuteAttack); //cleanup so we are sure it only executes once

			const animator = world.get(e, Components.Animator) as Animator | undefined;
			const weaponString = world.get(e, pair(Components.CurrentlyEquipped, Wildcard));
			const moveCallback = MoveCallbacks[move as unknown as keyof typeof MoveCallbacks];

			print("execute");
			if (animator === undefined || weaponString === undefined || moveCallback === undefined) {
				//can't run the move: release the lock so the npc doesn't get stuck
				warn(`AttackExecutionSystem: cannot execute move "${move}"`);
				world.remove(e, Components.AttackOngoing);
				continue;
			}

			print(moveCallback);
			moveCallback(weaponString, animator, e);
		}
	},
};

//pops the next move of a combo once the intermove delay has passed
export const QueuedAttackExecutionSystem = {
	name: "QueuedAttackExecutionSystem",
	system: () => {
		const now = os.clock();

		for (const [e, q] of world
			.query(Components.QueuedAttacks)
			.without(Components.AttackOngoing, Components.ExecuteAttack)) {
			//combo is over, no need to wait out moveDelay
			if (q.queued.size() === 0) {
				world.remove(e, Components.QueuedAttacks); //hook starts the combo (moveset) delay
				continue;
			}
			if (q.executeNext !== undefined && now < q.executeNext) continue;
			print("executing", q.queued[0], " queue", sliceFrom(q.queued, 1));

			world.set(e, Components.QueuedAttacks, { queued: sliceFrom(q.queued, 1) }); //executeNext cleared until this move finishes
			world.set(e, Components.ExecuteAttack, q.queued[0]);
			world.add(e, Components.AttackOngoing);
		}
	},
};

//a move finished: if the combo continues, schedule the next move after moveDelay
world.set(Components.AttackOngoing, OnRemove, (e) => {
	print("attackOngoing removed");
	if (!world.contains(e)) return;
	const queued = world.get(e, Components.QueuedAttacks);
	if (queued === undefined) return; //combo was cancelled (e.g. NpcMeleeLight removed)

	const weaponData = getWeaponData(e);
	if (weaponData === undefined) return;

	world.set(e, Components.QueuedAttacks, {
		queued: queued.queued,
		executeNext: os.clock() + weaponData.moveDelay, //os.clock() is in seconds, same unit as moveDelay
	});
});

//combo is over: block new combos for movesetDelay seconds
world.set(Components.QueuedAttacks, OnRemove, (e) => {
	if (!world.contains(e)) return;
	const weaponData = getWeaponData(e);
	if (weaponData === undefined) return;

	world.add(e, Components.MovesetDelay);
	task.delay(weaponData.movesetDelay, () => {
		if (world.contains(e)) world.remove(e, Components.MovesetDelay);
	});
});

//cleanup everything when the behavior is removed
const cleanup = world.set(Components.MeleeAttacks, OnRemove, (e) => {
	if (!world.contains(e)) return;
	world.remove(e, Components.ExecuteAttack);
	world.remove(e, Components.QueuedAttacks);
	world.remove(e, Components.AttackOngoing);
});

//1. npcMeeleLight is added, this enables light attacks.
// * Every npc is guaranteed to have a currentlyequipped pair. by default it's fists, can be gun, can bee melee, etc. npcmeleelight on a gunned npc will do nothing. will add melee checks on the itme component later
// * An npc with currentlyequipped with no npcmeleelight simply holds their item and doesnt do attacks
//2. Once a player is close enough to be attacked, npc adds an Attack component which contains a string which refers to the move. ("Light", "Heavy", "Special", "Smash", "KnifeThrow", etc. They are unique. One move equals one callback). We get the definition of the move through the record constant using the weapon string.
//There will be a monitor that watches additions of Attack components. They will be responsible for executing the callbacks tied to the moveset.
// If it's a generic Light or Heavy move, the logic is easily repeated, the stats such as damage is obtained through a record constant. The damagehit function is tied to their respective animation events accounting for status modifications such as bleed rate and fracture rate.
//For something less generic like a special or a knife throw, a callback is called which allows for custom behavior.
//3. Monitor receives signal that Attack component has been added, grabs targetposition (most enemies are guaranteed to have it), I guess this means we store the animator as a component too to play animations on the callbacks.
//*hmm.. need a way to store the decided movesets. probably a queuedAttacks component? i guess also add a movesetongoing component so it only decides a new moveset once the current one is done

//delays: there are delays between moves and delays between movesets/combos
//intermove delays is set on the QueuedAttacks component as there cant be intermove delays without an attack queue
//intercombo delays is set on MovesetDelay.

//queuedattacks (which moveset was chosen and whats left of it)
//attackongoing (tag that sees that an npc is still attacking unable to execute another move)
//executeattack (the attack request)
