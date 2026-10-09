//honestly i think the range is useless im gonna keep all the range uniform at 14 for consistency
export type DamageType = "Blunt" | "Bleed" | "Pierce" | "Fire" | "Poison" | "Chemical" | "Bullet"

export const MELEE_WEAPON_STATS = {
	// Certain blunt weapons can inflict
	Baseballbat: {
		LightAttackDamage: 14,
		HeavyAttackDamage: 29,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 15,
		range: 14,
		InflictFractureChance: 0.3,
		LightDamageType: "Blunt",
		HeavyDamageType: "Blunt",
	},

	Knife: {
		LightAttackDamage: 11,
		HeavyAttackDamage: 22,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 15,
		range: 9,
		InflictBleedingChance: 0.2,
		LightDamageType: "Bleed",
		HeavyDamageType: "Bleed",
	},
	Kabar: {
		LightAttackDamage: 11,
		HeavyAttackDamage: 22,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 15,
		range: 9,
		InflictBleedingChance: 0.2,
		LightDamageType: "Bleed",
		HeavyDamageType: "Bleed",
	},

	// The gauntlet is a glove pistol. the pistol is triggered by a direct punch to the enemy (heavy hit), the light hit is just a regular silent punch. The heavy hit would stun/inflict concussion on the enemy for a short period
	Gauntlet: {
		LightAttackDamage: 20,
		HeavyAttackDamage: 70,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 25,
		range: 9,
	},
	Claw: {
		LightAttackDamage: 11,
		HeavyAttackDamage: 40,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 15,
		range: 9,
		InflictBleedingChance: 0.3,
	},

	// Sledgehammer and Fireaxe are "Breaking" weapons. These weapons can destroy breakable world items whether you have the Strength skill or not.
	Sledgehammer: {
		LightAttackDamage: 18,
		HeavyAttackDamage: 32,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 30,
		range: 14,
		Breaking: true,
		InflictFractureChance: 0.3,
		LightDamageType: "Blunt",
		HeavyDamageType: "Blunt",
	},
	Fireaxe: {
		LightAttackDamage: 18,
		HeavyAttackDamage: 32,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 30,
		range: 14,
		Breaking: true,
		LightDamageType: "Blunt",
		HeavyDamageType: "Bleed",
	},

	//The lobotomizer does a lot of damage if you heavy hit the enemy's head and basically makes them unable to hurt you. it gives them the "Vegetable" debuff. They will no longer be able to attack. Just stand there confusedly
	Lobotomizer: {
		LightAttackDamage: 11,
		HeavyAttackDamage: 100,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 15,
		range: 9,
	},

	//Jesus, a katana, accumulates damage the longer it's sheathed. It has a chance to cause Bleeding to enemies
	Jesus: {
		LightAttackDamage: 11,
		HeavyAttackDamage: 20,
		MaxLightAttackDamage: 70,
		MaxHeavyAttackDamage: 140,
		LightAttackStaminaCost: 10,
		HeavyAttackStaminaCost: 30,
		range: 14,
		InflictBleedingChance: 0.3,
	},
	Teeth: {
		LightAttackDamage: 30,
		HeavyAttackDamage: 50,
		MaxLightAttackDamage: 40,
		MaxHeavyAttackDamage: 70,
		LightAttackStaminaCost: 20,
		HeavyAttackStaminaCost: 30,
		range: 14,
		InflictBleedingChance: 0.7,
	},
};
