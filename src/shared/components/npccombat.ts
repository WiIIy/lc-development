import world from "../world";
import { component } from "shared/utils/ecs/componentUtil";

export const CombatComponents = {
	//Attacks
	MeleeAttacks: world.entity(),
	ExecuteAttack: component<string>(),
	QueuedAttacks: component<{ queued: string[]; executeNext?: number }>(),
	AttackOngoing: world.entity(),
	MovesetDelay: world.entity(),

	Parrying: world.entity(),
	Melee: world.entity(),

	//parrying
	RandomParrying: world.entity(), //strategy tag: roll once per incoming attack (swarm/easy enemies)
	PredictiveParrying: world.entity(), //strategy tag: reserved for the predictive system
	ParryConfig: component<Partial<ParryProfile>>(), //per-entity override of the parry profile
	IncomingThreat: component<Threat>(),
	ParryTimeline: component<ParryTimeline>(), //exists from decision until recovery ends; doubles as "busy parrying"
	ParryCooldown: component<number>(), //timestamp when the next parry attempt is allowed
	AttackTrack: component<AnimationTrack>(), //the swing currently playing, so a parry can stop it
	AttackHistory: component<AttackRecord[]>(), //on the attacker, ring buffer for predictive later

	ParryStackable: world.entity(),
	ParryStreak: component<number>(),

	//Status Effect Tags,
	//Debuffs
	//Applicable to Both Player and Enemy
	Bleeding: component<{ startTime: number; severity: number; limb: string }>(),
	Shrapnel: component<{ startTime: number; severity: number; limb: string }>(),
	Fracture: component<{ startTime: number; severity: number; limb: string }>(),
	Burning: component<{ dps: number; endTime: number }>(),
	Sepsis: component<{ dps: number; endTime: number }>(),

	//Stun tags
	Cough: world.entity(),
	Concussion: world.entity(),
	Parried: world.entity(),
	Fell: world.entity(),

	//Persistent Debuffs
	HasBlindness: component<{ eye: Eye }>(),
	IsVegetable: world.entity(),
};