export const NpcWeaponsData = {
	fists: {
		id: "fists",
		moves: {
			light: {
				damage: 10,
				bleedChance: 0.07,
				fractureChance: 0.07,
			},
			heavy: {
				damage: 25,
				bleedChance: 0.15,
				fractureChance: 0.15,
			},
		},
		movesets: [
			{ combo: ["light", "light", "heavy"], weight: 5 }, //randomized depending on weight
			{ combo: ["heavy", "heavy"], weight: 3 },
		],
		moveDelay: 0.3, //pause between moves not sure how to implement yet
		movesetDelay: 0.5, //pause between movesets
		//range? consistent. 5 studs
		//if player is out of range for current attack for >2sec, override moveset and select another move? for basic melee behaviors probably not. probably another tag for this specific move timeout behavior
		//dashing tag for enemies who dash
	},
};