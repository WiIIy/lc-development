import assets from "shared/assets";
import { defineNpcWeapon } from "shared/utils/npc/attack/defineNpcWeapon";

const FIST_BOX = { size: new Vector3(3, 4, 1), distance: 3 };

const fistMoves = {
	light: { damage: 10, bleedChance: 0.07, fractureChance: 0.07, blockcast: FIST_BOX },
	heavy: { damage: 25, bleedChance: 0.15, fractureChance: 0.15, blockcast: FIST_BOX },
};

const fistAnimations = {
	moves: {
		light: assets["anims/character/npc/item/fists/fistslight.rbxm"], // event: hit
		heavy: assets["anims/character/npc/item/fists/fistsheavy.rbxm"], // event: hit
	},
	parry: assets["anims/character/npc/item/fists/fistsblock.rbxm"],
	// shove: omitted, uses the default
};

export const NpcMeleeWeaponsData = {
	/** parries and shoves */
	fists: defineNpcWeapon({
		id: "fists",
		moves: fistMoves,
		movesets: [
			{ combo: ["light", "light", "heavy"], weight: 5 },
			{ combo: ["heavy", "heavy"], weight: 3 },
			{ combo: ["parry"] },
			{ combo: ["shove"] },
		],
		moveDelay: 0.3,
		movesetDelay: 0.5,
		parryBehavior: {
			reactionTime: 0.15,
			minLength: 0.8,
			maxLength: 0.9,
			stacking: false,
			timeout: 6,
			recovery: 0.4,
		},
		shoveBehavior: { reactionTime: 0.15, stunTime: 1, blockcast: FIST_BOX },
		reactive: {
			rules: [
				// listed first so it wins ties against the movement rules below
				{ when: ["any", "parrying"], responses: [{ movement: "advance", actions: ["shove"], weight: 8 }] },
				{
					when: ["advancing", "any"],
					responses: [{ movement: "backtrack", actions: ["parry"], weight: 7 }],
				},
				{
					when: ["retreating", "any"],
					responses: [{ movement: "advance", actions: ["heavy", "light"], weight: 8 }],
				},
			],
		},
		animations: fistAnimations,
	}),

	/** same moves and callbacks, never parries or shoves */
	fistsAggressive: defineNpcWeapon({
		id: "fistsAggressive",
		moves: fistMoves,
		movesets: [
			{ combo: ["light", "light", "heavy"], weight: 5 },
			{ combo: ["heavy", "heavy"], weight: 3 },
		],
		moveDelay: 0.3,
		movesetDelay: 0.5,
		reactive: {
			rules: [{ when: ["any", "any"], responses: [{ movement: "advance", actions: ["heavy", "light"], weight: 10 }] }],
		},
		animations: fistAnimations,
	}),
};
