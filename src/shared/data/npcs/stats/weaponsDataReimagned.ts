// //src/shared/data/npcs/stats/weaponsDataReimagined.ts
// //what I imagine the constant looks like in the end code

// import assets from "shared/assets";
// import { defineNpcWeapon } from "shared/utils/npc/attack/defineNpcWeapon";

// export const NpcMeleeWeaponsData = {
// 	fists: defineNpcWeapon({
// 		id: "fists",
// 		moves: {
// 			light: {
// 				damage: 10,
// 				bleedChance: 0.07,
// 				fractureChance: 0.07,
// 				blockcast: { size: new Vector3(3, 4, 1), distance: 3 },
// 			},
// 			heavy: {
// 				damage: 25,
// 				bleedChance: 0.15,
// 				fractureChance: 0.15,
// 				blockcast: { size: new Vector3(3, 4, 1), distance: 3 },
// 			},
// 			parry: {
// 				damage: 0,
// 				bleedChance: 0,
// 				fractureChance: 0,
// 				blockcast: { size: new Vector3(3, 4, 1), distance: 3 },
// 			},
//             shove: {
// 				damage: 0,
// 				bleedChance: 0,
// 				fractureChance: 0,
// 				blockcast: { size: new Vector3(3, 4, 1), distance: 3 },
// 			},
// 		},
// 		movesets: [
// 			{ combo: ["light", "light", "heavy"], weight: 5 }, //randomized depending on weight
// 			{ combo: ["heavy", "heavy"], weight: 3 },
// 			{ combo: ["parry"] }, //non reactive parry behavior. on reactive, combos containing parry is ignored
// 		],
// 		moveDelay: 0.3, //pause between moves not sure how to implement yet
// 		movesetDelay: 0.5, //pause between movesets
//         //parry stacking = can parry max twice in a row
//         shoveBehavior: {reactionTime: 0.15} //has to register player parrying for 0.15 seconds before shoving to break the parry and give a stun if it hits. still needs a blockcast.
// 		parryBehavior: { reactionTime: 0.15, minLength: 0.8, maxLength: 2, stacking: true }, //parry?:, optional, if this field doesnt exist, the npc does not parry.
// 		//range:  base is 7 studs but npcs can be designed to have visually longer weapons and a longer reach
// 		//if player is out of range for current attack for >2sec, override moveset and select another move.
// 		//dashing tag for enemies who dash but later
// 		animations: {
// 			light: assets["anims/character/npc/item/fists/fistslight.rbxm"], //event: hit
// 			heavy: assets["anims/character/npc/item/fists/fistsheavy.rbxm"], //event: hit
// 		},
// 		blockAnim: assets["anims/character/npc/item/fists/fistsblock.rbxm"],
// 	}),
// };
