import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Entity, Id, Name, OnRemove, pair, Tag, TagDiscriminator, Wildcard } from "@rbxts/jecs";
import { Components } from "shared/components/components";
import Make from "@rbxts/make";
import { monitor } from "@willy/jecs-utils";
import { MoveCallbacks } from "shared/data/npcs/stats/moveCallbacks";
import { NpcWeaponsData } from "shared/data/npcs/wepaonsData";

//chooses a moveset/combo
export const AttackSystem = {
	name: "AttackSystem",
	system: () => {
		for (const [e, transform, targetTransform, basepart] of world
			.query(
				Components.Transform,
				Components.TargetTransform,
				Components.Basepart,
				pair(Components.CurrentlyEquipped, Wildcard),
			)
			.with(Components.NpcMeleeLight)
			.without(Components.AttackOngoing, Components.MovesetDelay)) {
			const weaponString = world.target(e, Components.CurrentlyEquipped); //returns weapon string like "fists"

			const weaponKey = weaponString as unknown as keyof typeof NpcWeaponsData;
			const moveSets = NpcWeaponsData[weaponKey].movesets;

			//1. check if distance is close enough
			//2. choose moveset
			//3. execute first move of moveset
			world.set(e, Components.QueuedAttacks, { queued: ["light", "heavy"] }); //pop first on list to be executed
			world.set(e, Components.ExecuteAttack, "light");
			world.add(e, Components.AttackOngoing);
		}
	},
};

export const QueuedAttackExecutionSystem = {
	name: "QueuedAttackExecutionSystem",
	system: () => {
		for (const [e, q] of world
			.query(Components.QueuedAttacks)
			.without(Components.AttackOngoing, Components.ExecuteAttack)) {
			if (q.executeNext === undefined) continue;
			if (scheduler.getDeltaTime() < q.executeNext) continue;
			//
		}
	},
};

const attackMonitor = monitor(world.query(Components.ExecuteAttack)); //not sure if i should use a monitor or an OnAdd hook
attackMonitor.added((e) => {
	const attack = world.get(e, Components.ExecuteAttack);
	const animator = world.get(e, Components.Animator) as Animator;
	const weaponString = world.target(e, Components.CurrentlyEquipped);
	const move = world.get(e, Components.ExecuteAttack);
	const queued = world.get(e, Components.QueuedAttacks);

	//game logs it in some sort of kill or dmg log later
	const weaponName = weaponString as unknown as keyof typeof NpcWeaponsData;
	const weaponData = NpcWeaponsData[weaponName];

	const moveData = weaponData.moves[move as keyof typeof weaponData.moves];
	const moveCallback = MoveCallbacks[move as keyof typeof MoveCallbacks];

	moveCallback(weaponName, animator, e);

	//cleanup so we are sure it only executes once
	world.remove(e, Components.ExecuteAttack);
});

const delaySet = world.set(Components.AttackOngoing, OnRemove, (e) => {
	const queuedAttacks = world.get(e, Components.QueuedAttacks);
	const weaponString = world.target(e, Components.CurrentlyEquipped);
	const weaponsData = NpcWeaponsData[weaponString as unknown as keyof typeof NpcWeaponsData];
	const moveDelay = weaponsData.moveDelay;
	//if thats the end of the moveset/combo, remove the queuedattacks component
	world.set(e, Components.QueuedAttacks, {
		queued: queuedAttacks?.queued ?? [],
		executeNext: scheduler.getDeltaTime() + moveDelay, //make sure dt and movedelay are on the correct unit
	});
});

const addMovesetDelay = world.set(Components.QueuedAttacks, OnRemove, (e) => {
	const weaponString = world.target(e, Components.CurrentlyEquipped);
	const weaponsData = NpcWeaponsData[weaponString as unknown as keyof typeof NpcWeaponsData];
	world.add(e, Components.MovesetDelay);
	task.delay(weaponsData.movesetDelay, () => {
		world.remove(e, Components.MovesetDelay);
	});
});

const cleanup = world.set(Components.NpcMeleeLight, OnRemove, (e) => {
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
