import { MAX_RESPONSE_WEIGHT } from "shared/data/npcs/stats/combatDefaults";

type Definition<K extends string> = {
	id: string;
	moves: Record<K, WeaponMove>;
	movesets: MovesetEntry<NoInfer<K> | "parry" | "shove">[];
	moveDelay: number;
	movesetDelay: number;
	parryBehavior?: ParryBehavior;
	shoveBehavior?: ShoveBehavior;
	reactive?: ReactiveBehavior<NoInfer<K> | BuiltInAction>;
	animations: { moves: Record<NoInfer<K>, string>; parry?: string; shove?: string };
};

const RESERVED = ["idle", "parry", "shove", "weaponMove", "any"];

/** typo-checks move names at compile time, and fails loudly at startup for what types cannot catch */
export function defineNpcWeapon<K extends string>(definition: Definition<K>): NpcWeapon {
	const weapon: NpcWeapon = definition;
	const fail = (message: string) => `[defineNpcWeapon:${weapon.id}] ${message}`;

	for (const [name] of pairs(weapon.moves)) {
		assert(!RESERVED.includes(name as string), fail(`"${name}" is reserved and cannot be a key of moves`));
	}

	for (const moveset of weapon.movesets) {
		assert(moveset.combo.size() > 0, fail("a moveset has an empty combo"));
		assert((moveset.weight ?? 1) > 0, fail("moveset weight must be above 0"));
		for (const action of moveset.combo) {
			if (action === "parry") {
				assert(weapon.parryBehavior !== undefined, fail(`a moveset uses "parry" without parryBehavior`));
			} else if (action === "shove") {
				assert(weapon.shoveBehavior !== undefined, fail(`a moveset uses "shove" without shoveBehavior`));
			} else {
				assert(weapon.moves[action] !== undefined, fail(`moveset uses unknown move "${action}"`));
			}
		}
	}

	const parry = weapon.parryBehavior;
	if (parry !== undefined) {
		assert(parry.minLength > 0 && parry.maxLength >= parry.minLength, fail("need 0 < minLength <= maxLength"));
	}

	for (const rule of weapon.reactive?.rules ?? []) {
		for (const response of rule.responses) {
			const weight = response.weight ?? 0;
			assert(weight >= 0 && weight <= MAX_RESPONSE_WEIGHT, fail(`response weight ${weight} is outside 0-10`));
			assert(response.actions.size() > 0, fail(`a response has no actions (use ["idle"])`));
		}
	}

	return weapon;
}
