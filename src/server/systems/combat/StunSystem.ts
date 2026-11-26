// Owns everything a stun DOES: lift timer, stopping npc movement, stagger animation.
// Take this system out and stuns have no effect or expiry. Start stuns with applyStun().
//src/server/systems/StunSystem.ts
import { Entity, OnRemove } from "@rbxts/jecs";
import world from "shared/world";
import { Components } from "shared/components";
import { DEFAULT_COMBAT_ANIMATIONS } from "shared/data/npcs/stats/combatDefaults";
import { getNpcWeapon } from "shared/utils/npc/attack/getNpcWeapon";

type Effect = { track?: AnimationTrack; walkSpeed?: number; speedPending: boolean };

const effects = new Map<Entity, Effect>();
const tracks = new Map<Entity, Map<string, AnimationTrack>>();

function staggerTrack(e: Entity): AnimationTrack | undefined {
	const animator = world.get(e, Components.Animator);
	if (animator === undefined) {
		warn(`[StunSystem] entity ${e} has no Animator, stunned without animation`);
		return undefined;
	}
	const id = getNpcWeapon(e)?.animations.stagger ?? DEFAULT_COMBAT_ANIMATIONS.stagger;
	let cache = tracks.get(e);
	if (cache === undefined) {
		cache = new Map<string, AnimationTrack>();
		tracks.set(e, cache);
	}
	let track = cache.get(id);
	if (track === undefined) {
		const animation = new Instance("Animation");
		animation.AnimationId = id;
		track = animator.LoadAnimation(animation);
		cache.set(id, track);
	}
	return track;
}

/** stretch whatever is left of the animation over whatever is left of the stun */
function fitSpeed(effect: Effect, timer: StunTimer, now: number) {
	const track = effect.track;
	if (track === undefined || !effect.speedPending || track.Length <= 0) return; // not downloaded yet
	const remaining = timer.liftAt - now;
	if (remaining <= 0) return;
	track.AdjustSpeed(math.max(0.01, track.Length - track.TimePosition) / remaining);
	effect.speedPending = false;
}

function begin(e: Entity, timer: StunTimer, now: number): Effect {
	const effect: Effect = { speedPending: true };
	effects.set(e, effect);
	if (world.has(e, Components.Player)) return effect; // npc-only effects below

	const humanoid = world.get(e, Components.Humanoid);
	const root = world.get(e, Components.Basepart);
	if (humanoid !== undefined) {
		effect.walkSpeed = humanoid.WalkSpeed;
		humanoid.WalkSpeed = 0; // holds against every MoveTo, whichever system sends it
		if (root !== undefined) humanoid.MoveTo(root.Position);
	}

	effect.track = staggerTrack(e);
	if (effect.track !== undefined) {
		effect.track.Priority = Enum.AnimationPriority.Action3;
		effect.track.Looped = false;
		effect.track.Play(0.1);
		fitSpeed(effect, timer, now); // AdjustSpeed only works after Play
	}
	return effect;
}

export const StunSystem = {
	name: "StunSystem",
	system: () => {
		const now = os.clock();
		for (const [e] of world.query(Components.Stunned).without(Components.StunTimer)) {
			warn(`[StunSystem] ${e} was tagged Stunned without applyStun(), removing it`);
			world.remove(e, Components.Stunned);
		}
		for (const [e, timer] of world.query(Components.StunTimer).with(Components.Stunned)) {
			if (now >= timer.liftAt || world.has(e, Components.Dead)) {
				world.remove(e, Components.Stunned); // hook below undoes the effects
				world.remove(e, Components.StunTimer);
				continue;
			}
			const effect = effects.get(e) ?? begin(e, timer, now);
			fitSpeed(effect, timer, now);

			// standing still on purpose must not count as "stuck" for pathfinding (it would jump)
			const path = world.get(e, Components.PathState);
			if (path !== undefined) path.lastProgressAt = now;
		}
		for (const [e, cache] of tracks) {
			if (world.contains(e)) continue;
			for (const [, track] of cache) track.Destroy();
			tracks.delete(e);
		}
	},
};

world.set(Components.Stunned, OnRemove, (e: Entity) => {
	const effect = effects.get(e);
	if (effect === undefined) return;
	effects.delete(e);
	effect.track?.Stop(0.15);
	if (effect.walkSpeed !== undefined && world.contains(e)) {
		const humanoid = world.get(e, Components.Humanoid);
		if (humanoid !== undefined) humanoid.WalkSpeed = effect.walkSpeed;
	}
});
