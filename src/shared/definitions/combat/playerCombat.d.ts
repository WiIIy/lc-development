// Global types for player melee and stun. No imports, no exports.
type PlayerAttackName = "light" | "heavy" | "shove";

type PlayerAttackData = {
	damage: number;
	bleedChance: number;
	fractureChance: number;
	blockcast: { size: Vector3; distance: number };
	cooldown: number; // seconds between uses
	minHitDelay: number; // server ignores a hit reported sooner than this after the swing starts
};

type PlayerMeleeWeapon = {
	id: string;
	light: PlayerAttackData;
	heavy: PlayerAttackData;
	shove: PlayerAttackData;
	block: { cooldown: number }; // delay after letting go before blocking again
	/** stun on an npc whose attack you parry. Omitted = 1.5 */
	parryStunDuration?: number;
	/** stun on an npc you shove. Omitted = 1.5 */
	shoveStunDuration?: number;
	animations: { light: string; heavy: string; shove: string; block: string };
};

type StunSource = "parry" | "shove";
type StunTimer = { duration: number; liftAt: number; source: StunSource };
