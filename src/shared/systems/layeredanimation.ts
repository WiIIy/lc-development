import { observer } from "@willy/jecs-utils";
import Components from "shared/components/components";
import world from "shared/world";
import Make from "@rbxts/make";
import { RunService } from "@rbxts/services";
import { ASSET_ID_PREFIX } from "shared/data/paths";

// Helper to load and play a track
function playTrack(animator: Animator, rawId: string, priority: Enum.AnimationPriority): AnimationTrack {
	const animId = `${ASSET_ID_PREFIX}${rawId}`;
	const track = animator.LoadAnimation(Make("Animation", { AnimationId: animId }));
	track.Priority = priority;
	track.Play(0.2); // Smooth fade-in
	return track;
}

const layerTracks = new Map<number, Map<string, AnimationTrack>>();

// --- SIMULTANEOUS LAYERS OBSERVER ---
observer(world.query(Components.Animator, Components.AnimationLayers), (entity) => {
	const layers = world.get(entity, Components.AnimationLayers) || {};
	const animator = world.get(entity, Components.Animator)!;

	if (!layerTracks.has(entity)) layerTracks.set(entity, new Map());
	const active = layerTracks.get(entity)!;

	// Stop tracks no longer in the component
	active.forEach((track, slot) => {
		if (!layers[slot as keyof typeof layers]) {
			track.Stop(0.2);
			active.delete(slot);
		}
	});

	// Play new tracks
	for (const [slot, id] of pairs(layers)) {
		if (!active.has(slot as string)) {
			const priority = slot === "Base" ? Enum.AnimationPriority.Movement : Enum.AnimationPriority.Action;
			const track = playTrack(animator, id as string, priority);
			active.set(slot as string, track);
		}
	}
});
