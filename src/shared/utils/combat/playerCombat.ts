// SERVER rules for player melee. The WCS skills only forward input here. Nothing the client says
// about targets or damage is trusted: it only says "I started" and "my hit marker fired".
import { Entity, pair } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { DEFAULT_PARRY_STUN, DEFAULT_SHOVE_STUN, PlayerMeleeWeaponStats } from "shared/data/items/playerMeleeWeaponStats";
import { meleeCast } from "./meleeCast";
import { damageNpc, rollStatusEffects, showDamageNumber } from "./damage";
import { applyStun } from "./stun";

const MAX_SWING_SECONDS = 2; // safety net if the client never reports the end
const NETWORK_TOLERANCE = 0.15; // two remotes can arrive closer together than they were sent

let lastToken = 0;
const landed = new Set<number>(); // swing tokens that already used their one hit
const blockBroken = new Map<Entity, () => void>();
const warned = new Set<string>();

function warnOnce(message: string) {
	if (warned.has(message)) return;
	warned.add(message);
	warn(message);
}

export function getEquippedId(e: Entity): string | undefined {
	const item = world.target(e, Components.CurrentlyEquipped);
	// print("item",item, world.target(e, Components.CurrentlyEquipped))
	if (item === undefined) return undefined;
	return world.get(e, pair(Components.CurrentlyEquipped, item) as unknown as Entity<string>);
}

export function getPlayerMeleeWeapon(e: Entity): PlayerMeleeWeapon | undefined {
	const id = getEquippedId(e);
	if (id === undefined) {
		warnOnce(`[playerCombat] entity ${e} has nothing in pair(CurrentlyEquipped, item)`);
		return undefined;
	}
	const weapon = PlayerMeleeWeaponStats[id];
	if (weapon === undefined) warnOnce(`[playerCombat] "${id}" has no entry in PlayerMeleeWeaponStats`);
	return weapon;
}

function cannotAct(e: Entity): boolean {
	return world.has(e, Components.Dead) || world.has(e, Components.Stunned);
}

export function beginPlayerAttack(e: Entity, attack: PlayerAttackName): PlayerMeleeWeapon | undefined {
	const weapon = getPlayerMeleeWeapon(e);
	if (weapon === undefined || cannotAct(e)) return undefined;
	if (world.has(e, Components.Attacking) || world.has(e, Components.Parrying)) return undefined;

	const now = os.clock();
	const readyAt = world.get(e, Components.PlayerAttackReadyAt) ?? {};
	if (now < (readyAt[attack] ?? 0) - NETWORK_TOLERANCE) return undefined;
	readyAt[attack] = now + weapon[attack].cooldown;
	world.set(e, Components.PlayerAttackReadyAt, readyAt);

	lastToken += 1;
	world.set(e, Components.Attacking, {
		token: lastToken,
		action: attack,
		weaponId: weapon.id,
		expiresAt: now + MAX_SWING_SECONDS,
	});
	return weapon;
}

export function endPlayerAttack(e: Entity, attack: PlayerAttackName) {
	const active = world.get(e, Components.Attacking);
	if (active?.action !== attack) return;
	landed.delete(active.token);
	world.remove(e, Components.Attacking);
}

/** every living npc: model -> entity */
function npcTargets(): Map<Instance, Entity> {
	const targets = new Map<Instance, Entity>();
	for (const [e, root] of world.query(Components.Basepart).without(Components.Player, Components.Dead)) {
		const model = root.Parent;
		if (model?.IsA("Model") && model.FindFirstChildOfClass("Humanoid")) targets.set(model, e);
	}
	return targets;
}

export function resolvePlayerHit(player: Entity, character: Model, attack: PlayerAttackName, flinches: string[]) {
	const active = world.get(player, Components.Attacking);
	const weapon = getPlayerMeleeWeapon(player);
	if (active === undefined || active.action !== attack || weapon === undefined) return;
	if (active.weaponId !== weapon.id || cannotAct(player) || landed.has(active.token)) return;

	const data = weapon[attack];
	const startedAt = active.expiresAt - MAX_SWING_SECONDS;
	if (os.clock() - startedAt < data.minHitDelay) {
		warn(`[playerCombat] ${attack} hit arrived before minHitDelay. Lower it if your marker is earlier`);
		return;
	}
	landed.add(active.token);

	const root = character.FindFirstChild("HumanoidRootPart");
	if (root === undefined || !root.IsA("BasePart")) return;

	const targets = npcTargets();
	const candidates: Instance[] = [];
	for (const [model] of targets) candidates.push(model);
	const hit = meleeCast(root.CFrame, character, candidates, data.blockcast);
	if (hit === undefined) return;
	const npc = targets.get(hit.model);
	if (npc === undefined) return;

	if (attack === "shove") {
		world.remove(npc, Components.Parrying);
		world.remove(npc, Components.Attacking); // a shove breaks the npc's parry or swing
		applyStun(npc, weapon.shoveStunDuration ?? DEFAULT_SHOVE_STUN, "shove");
	} else if (world.has(npc, Components.Parrying)) {
		// the npc caught it: no damage, no stun on the player, its parry ends
		world.remove(npc, Components.Parrying);
		world.remove(npc, Components.Attacking);
		showDamageNumber(hit.model, "PARRIED");
		return;
	}

	if (data.damage <= 0) return;
	const remaining = damageNpc(npc, hit.model, data.damage);
	if (remaining === undefined) return;
	showDamageNumber(hit.model, `-${data.damage}  (${remaining})`);
	rollStatusEffects(npc, data, hit.part.Name);
	playFlinch(npc, flinches);
}

const flinchCache = new Map<Animator, Map<string, AnimationTrack>>();

function playFlinch(npc: Entity, flinches: string[]) {
	// the stun animation wins over a flinch
	if (world.has(npc, Components.Stunned) || world.has(npc, Components.Dead) || flinches.size() === 0) return;
	const animator = world.get(npc, Components.Animator);
	if (animator === undefined) return;
	const id = flinches[math.random(0, flinches.size() - 1)];

	let tracks = flinchCache.get(animator);
	if (tracks === undefined) {
		tracks = new Map<string, AnimationTrack>();
		flinchCache.set(animator, tracks);
		animator.Destroying.Once(() => flinchCache.delete(animator));
	}
	let track = tracks.get(id);
	if (track === undefined) {
		const animation = new Instance("Animation");
		animation.AnimationId = id;
		track = animator.LoadAnimation(animation);
		tracks.set(id, track);
	}
	// never hide the wind-up of an npc attack: the player has to be able to read it
	track.Priority = world.has(npc, Components.Attacking)
		? Enum.AnimationPriority.Movement
		: Enum.AnimationPriority.Action;
	track.Play(0.15);
}

/** returns the weapon when the block is accepted. `onBroken` runs if something else ends the block */
export function startPlayerBlock(e: Entity, onBroken: () => void): PlayerMeleeWeapon | undefined {
	const weapon = getPlayerMeleeWeapon(e);
	const now = os.clock();
	// print(weapon, cannotAct(e), world.has(Components.ParryDisabledUntil))
	if (weapon === undefined || cannotAct(e) || world.has(e, Components.Attacking)) return undefined;
	if (now < (world.get(e, Components.ParryDisabledUntil) ?? 0)) return undefined;
	if (now < (world.get(e, Components.PlayerBlockReadyAt) ?? 0) - NETWORK_TOLERANCE) return undefined;
	blockBroken.set(e, onBroken);
	world.add(e, Components.Parrying);
	return weapon;
}

export function stopPlayerBlock(e: Entity) {
	if (!blockBroken.has(e)) return;
	blockBroken.delete(e);
	world.remove(e, Components.Parrying);
	const cooldown = getPlayerMeleeWeapon(e)?.block.cooldown ?? 0;
	world.set(e, Components.PlayerBlockReadyAt, os.clock() + cooldown);
}

/** ends the block from the server side and tells the client to drop the pose */
export function forceEndBlock(e: Entity) {
	const notify = blockBroken.get(e);
	if (notify === undefined) return;
	stopPlayerBlock(e);
	notify();
}

/** npc shove: breaks the parry and disables parrying. It NEVER stuns the player */
export function breakPlayerParry(e: Entity, disableFor: number) {
	world.set(e, Components.ParryDisabledUntil, os.clock() + disableFor);
	forceEndBlock(e);
	world.remove(e, Components.Parrying);
}

export function isBlocking(e: Entity): boolean {
	return blockBroken.has(e);
}

/** called when an npc strike is caught by a player's parry */
export function onPlayerParried(player: Entity, npc: Entity) {
	const weapon = getPlayerMeleeWeapon(player);
	applyStun(npc, weapon?.parryStunDuration ?? DEFAULT_PARRY_STUN, "parry");
}
