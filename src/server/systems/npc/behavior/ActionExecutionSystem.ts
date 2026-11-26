// The ONLY code that plays combat animations. It does not know or care which brain asked.
import { Entity, OnRemove, pair, Wildcard } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { MoveCallbacks } from "shared/data/npcs/stats/moveCallbacks";
import {
	DEFAULT_COMBAT_ANIMATIONS,
	MAX_ACTION_SECONDS,
	PARRY_CHAIN_WINDOW,
	PARRY_FADE_IN,
	PARRY_FADE_OUT,
	PARRY_RELEASE_BUFFER,
} from "shared/data/npcs/stats/combatDefaults";
import { getNpcWeapon } from "shared/utils/npc/attack/getNpcWeapon";
import { actionRange, flatDistance, isCapable, isFree } from "shared/utils/npc/attack/combatRules";

type Runtime = { track: AnimationTrack; connections: RBXScriptConnection[]; fadeOut: number; isParry: boolean };

// Roblox handles stay here, so cleanup never depends on reading a component while it is being removed
const runtimes = new Map<Entity, Runtime>();
let lastToken = 0;

// one track per npc per animation, reused. Loading a new one per action piles tracks up on the Animator
const trackCache = new Map<Entity, Map<string, AnimationTrack>>();

function describe(track: AnimationTrack): string {
	return `time=${track.TimePosition} length=${track.Length} playing=${track.IsPlaying} looped=${track.Looped}`;
}

function loadTrack(e: Entity, animationId: string): AnimationTrack | undefined {
	let tracks = trackCache.get(e);
	const cached = tracks?.get(animationId);
	if (cached !== undefined) return cached;

	const animator = world.get(e, Components.Animator);
	if (animator === undefined) {
		warn(`[ActionExecution] entity ${e} has no Animator`);
		return undefined;
	}
	const animation = new Instance("Animation");
	animation.AnimationId = animationId;
	const [ok, result] = pcall(() => animator.LoadAnimation(animation));
	if (!ok) {
		warn(`[ActionExecution] could not load "${animationId}": ${result}`);
		return undefined;
	}
	const track = result as AnimationTrack;
	if (tracks === undefined) {
		tracks = new Map<string, AnimationTrack>();
		trackCache.set(e, tracks);
	}
	tracks.set(animationId, track);
	return track;
}

function animationFor(weapon: NpcWeapon, action: string): string | undefined {
	let id: string | undefined;
	if (action === "parry") id = weapon.animations.parry ?? DEFAULT_COMBAT_ANIMATIONS.parry;
	else if (action === "shove") id = weapon.animations.shove ?? DEFAULT_COMBAT_ANIMATIONS.shove;
	else id = weapon.animations.moves[action];
	return id === "" ? undefined : id;
}

function isCurrent(e: Entity, token: number): boolean {
	return world.contains(e) && world.get(e, Components.Attacking)?.token === token;
}

/** safe to call any time. The OnRemove hook below does the actual cleanup */
export function endAction(e: Entity): void {
	world.remove(e, Components.Attacking);
}

/** natural completion: end it and apply the pause between moves */
function finishAction(e: Entity, active: ActiveAction, now: number) {
	const weapon = getNpcWeapon(e);
	let lock = weapon?.moveDelay ?? 0;
	// a caught parry never gets here (resolveNpcParry ends it), so reaching the end means it caught nothing
	if (active.action === "parry") lock += weapon?.parryBehavior?.recovery ?? 0;
	endAction(e);
	world.set(e, Components.ActionLockedUntil, now + lock);
}

function startAction(e: Entity, weapon: NpcWeapon, action: string, now: number): boolean {
	const animationId = animationFor(weapon, action);
	if (animationId === undefined) {
		warn(`[ActionExecution] weapon "${weapon.id}" has no animation for "${action}"`);
		return false;
	}
	const callback = action === "parry" ? undefined : MoveCallbacks[action];
	if (action !== "parry" && callback === undefined) {
		warn(`[ActionExecution] no MoveCallbacks entry for "${action}" (weapon "${weapon.id}")`);
		return false;
	}
	const track = loadTrack(e, animationId);
	if (track === undefined) return false;

	lastToken += 1;
	const token = lastToken;
	const runtime: Runtime = { track, connections: [], fadeOut: 0.1, isParry: action === "parry" };
	let expiresAt = now + MAX_ACTION_SECONDS;
	track.Priority = Enum.AnimationPriority.Action;

	if (action === "parry") {
		// code owns the length. The animation is only a looped pose
		const behavior = weapon.parryBehavior!;
		expiresAt = now + behavior.minLength + math.random() * (behavior.maxLength - behavior.minLength);
		track.Looped = true;
		runtime.fadeOut = PARRY_FADE_OUT;
	} else {
		const move = callback!;
		let fired = false;
		track.Looped = false;
		runtime.connections.push(
			track.GetMarkerReachedSignal(move.marker).Connect(() => {
				if (fired || !isCurrent(e, token)) return;
				fired = true;
				print(`[ActionExecution] "${action}" marker: ${describe(track)}`);
				move.run({ entity: e, moveName: action, weapon });
			}),
			track.DidLoop.Connect(() => {
				if (!isCurrent(e, token)) return;
				warn(`[ActionExecution] "${action}" animation is looping. Turn Looped off and re-export it`);
				finishAction(e, world.get(e, Components.Attacking)!, os.clock());
			}),
			track.Ended.Connect(() => {
				// IsPlaying: a late Ended from the previous play of this reused track
				if (!isCurrent(e, token) || track.IsPlaying) return;
				if (!fired) warn(`[ActionExecution] "${action}" ended without reaching marker "${move.marker}"`);
				finishAction(e, world.get(e, Components.Attacking)!, os.clock());
			}),
		);
	}

	runtimes.set(e, runtime);
	world.set(e, Components.Attacking, { token, action, weaponId: weapon.id, expiresAt });

	if (action === "parry") {
		const state = world.get(e, Components.ParryState);
		world.set(e, Components.ParryState, { streak: (state?.streak ?? 0) + 1, readyAt: math.huge, chainUntil: 0 });
		world.add(e, Components.Parrying);
		track.Play(PARRY_FADE_IN);
	} else {
		const state = world.get(e, Components.ParryState);
		if (state !== undefined) state.streak = 0; // any other action breaks the streak. The timeout stays
		track.Play();
	}
	return true;
}

/** call from the player's hit code when it lands on an npc. true = parried, skip the damage */
export function resolveNpcParry(defender: Entity, attacker: Entity, stunTime: number): boolean {
	const active = world.get(defender, Components.Attacking);
	if (active?.action !== "parry" || !world.has(defender, Components.Parrying)) return false;
	endAction(defender);
	world.remove(defender, Components.ActionLockedUntil); // success skips recovery
	const now = os.clock();
	world.set(attacker, Components.Stunned, { startTime: now, endTime: now + stunTime });
	return true;
}

world.set(Components.Attacking, OnRemove, (e: Entity) => {
	const runtime = runtimes.get(e);
	if (runtime === undefined) return;
	runtimes.delete(e);
	for (const connection of runtime.connections) connection.Disconnect(); // before Stop, so Ended can't re-enter
	runtime.track.Stop(runtime.fadeOut);
	if (runtime.isParry && world.contains(e)) world.remove(e, Components.Parrying);
});

/** true once the target has left parry range (applies to both brains) */
function parryOutOfRange(e: Entity): boolean {
	const weapon = getNpcWeapon(e);
	const transform = world.get(e, Components.Transform);
	const targetTransform = world.get(e, Components.TargetTransform);
	if (weapon === undefined || transform === undefined || targetTransform === undefined) return false;
	const distance = flatDistance(transform.Position, targetTransform.Position);
	return distance > actionRange(weapon, "parry") + PARRY_RELEASE_BUFFER;
}

const lostTarget = world.query(Components.Attacking).without(pair(Components.Target, Wildcard)).cached();

/** ends actions: parry length reached, stun/death, target or combat lost, weapon swapped, stuck animation */
export const ActionLifecycleSystem = {
	name: "ActionLifecycleSystem",
	system: () => {
		const now = os.clock();

		for (const [e, stun] of world.query(Components.Stunned)) {
			if (now >= stun.endTime) world.remove(e, Components.Stunned);
		}
		for (const [e, tracks] of trackCache) {
			if (world.contains(e)) continue;
			for (const [, track] of tracks) track.Destroy();
			trackCache.delete(e);
		}

		// only actions this executor started: players may carry Attacking too, managed by their WCS skills
		for (const [e] of lostTarget) if (runtimes.has(e)) endAction(e);

		for (const [e, active] of world.query(Components.Attacking)) {
			if (!runtimes.has(e)) continue;
			if (
				world.has(e, Components.Dead) ||
				world.has(e, Components.Stunned) ||
				world.has(e, Components.Parried) ||
				!world.has(e, Components.MeleeAttacks) ||
				getNpcWeapon(e)?.id !== active.weaponId
			) {
				endAction(e);
			} else if (active.action === "parry" && parryOutOfRange(e)) {
				finishAction(e, active, now); // lower the guard, the parry timeout starts as usual
			} else if (now >= active.expiresAt) {
				if (active.action !== "parry") {
					const track = runtimes.get(e)!.track;
					warn(`[ActionLifecycle] "${active.action}" timed out on ${e}: ${describe(track)}`);
				}
				finishAction(e, active, now);
			}
		}

		// parry bookkeeping runs off state, so it also covers parries that were interrupted
		for (const [e, state] of world.query(Components.ParryState).without(Components.Attacking)) {
			if (state.readyAt !== math.huge) continue;
			const timeout = getNpcWeapon(e)?.parryBehavior?.timeout ?? 0;
			state.readyAt = now + timeout;
			state.chainUntil = now + PARRY_CHAIN_WINDOW;
		}
	},
};

/** consumes every request the same frame. Accepted or dropped, nothing is ever queued */
export const ActionExecutionSystem = {
	name: "ActionExecutionSystem",
	system: () => {
		const now = os.clock();
		for (const [e, request] of world.query(Components.ActionRequest)) {
			world.remove(e, Components.ActionRequest);
			const weapon = getNpcWeapon(e);
			if (weapon === undefined || !isFree(e, now) || !isCapable(e, weapon, request.action, now)) continue;
			if (!startAction(e, weapon, request.action, now)) {
				world.set(e, Components.ActionLockedUntil, now + 1); // don't spam the warning every frame
			}
		}
	},
};