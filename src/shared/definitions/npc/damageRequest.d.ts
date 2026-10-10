type ValueOf<T> = T[keyof T];

type MeleeStats = ValueOf<typeof import("../../data/items/stats/meleeStats").MELEE_SETTINGS>;

type FirearmStats = ValueOf<typeof import("../../data/items/stats/gunStats").FIREARM_SETTINGS>;

type ThrowableStats = ValueOf<typeof import("../../data/items/stats/throwableStats").THROWABLE_SETTINGS>;

type DamageType = "Blunt" | "Bleed" | "Pierce" | "Fire" | "Poison" | "Chemical" | "Bullet";

type DamageRequest = {
	targetModel: Model;
	hitPart: BasePart;
	baseDamage: number;
	damageType: DamageType;
	weaponStats?: MeleeStats | FirearmStats | ThrowableStats;
	duration?: number;
	hitPosition?: Vector3;
	origin?: Vector3;
};
