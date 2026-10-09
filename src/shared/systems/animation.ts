import { observer } from "@willy/jecs-utils";
import Components from "../components/components";
import world from "../world";
import Make from "@rbxts/make";
import { RunService } from "@rbxts/services";
import { Entity, Id, TagDiscriminator } from "@rbxts/jecs";
import { ASSET_ID_PREFIX } from "shared/data/paths";
import { AnimationUtils } from "shared/utils/visual/animationUtil";

interface ActiveAnimation {
	track: AnimationTrack;
	id: string;
	isStartedNext: boolean; // Prevents triggering the next animation multiple times
}

// Stores the internal state of animations for each entity
const activeSequences = new Map<
	Entity,
	{
		tracks: ActiveAnimation[];
		currentIndex: number;
		queue: string[];
	}
>();

const FADE_TIME = 0.2; // Seconds for smooth blending

/**
 * Loads and plays a track with default settings
 */
function playTrack(animator: Animator, rawId: string): AnimationTrack {
	const animId = `${ASSET_ID_PREFIX}${rawId}`;
	const animInstance = Make("Animation", { AnimationId: animId });
	const track = animator.LoadAnimation(animInstance);

	// You can customize priority here or based on the animation ID
	track.Priority = Enum.AnimationPriority.Action;
	track.Play(FADE_TIME);

	animInstance.Destroy();
	return track;
}

// 1. Observer: Only handles logic when the Queue changes
observer(world.query(Components.Animator, Components.AnimationQueue), (entity) => {
	const queue = (world.get(entity, Components.AnimationQueue) || []) as string[];
	const animator = world.get(entity, Components.Animator)! as Animator;
	const animatorModel = animator.Parent?.Parent as Model;

	const existing = activeSequences.get(entity);
	if (existing) {
		existing.tracks.forEach((t) => t.track.Stop(FADE_TIME));
		activeSequences.delete(entity);
	}

	// If queue is cleared, stop everything
	if (queue.size() === 0) {
		const state = activeSequences.get(entity);
		state?.tracks.forEach((t) => t.track.Stop(FADE_TIME));
		activeSequences.delete(entity);
		return;
	}

	// Initialize state and play the first animation
	// const firstTrack = playTrack(animator, queue[0]);
	const firstTrack = AnimationUtils.loadAnim(animatorModel, "first", queue[0]);
	if (!firstTrack) {
		print("something wrong with animation observer; Model: ", animatorModel, "|queue: ", queue);
		return;
	}

	activeSequences.set(entity, {
		queue: queue,
		currentIndex: 0,
		tracks: [{ track: firstTrack, id: queue[0], isStartedNext: false }],
	});
});

// 2. Heartbeat System: Processes the 90% logic every frame
RunService.Heartbeat.Connect(() => {
	for (const [entity, state] of activeSequences) {
		const currentData = state.tracks[state.tracks.size() - 1]; // Get latest playing animation
		if (!currentData) continue;

		const track = currentData.track;
		const animator = world.get(entity, Components.Animator) as Animator;
		const animatorModel = animator?.Parent?.Parent as Model;

		if (!animator) continue;

		// Calculate progress (0 to 1)
		if (track.Length <= 0) continue;

		const progress = track.TimePosition / track.Length;

		// CHECK: If 90% done and there's a next animation in the queue
		if (progress >= 0.9 && !currentData.isStartedNext) {
			const nextIndex = state.currentIndex + 1;

			if (nextIndex < state.queue.size()) {
				currentData.isStartedNext = true; // Mark so we don't spam-play
				state.currentIndex = nextIndex;

				const nextId = state.queue[nextIndex];
				// const nextTrack = playTrack(animator, nextId);
				const nextTrack = AnimationUtils.loadAnim(animatorModel, "next", nextId);
				if (!nextTrack) continue;

				state.tracks.push({ track: nextTrack, id: nextId, isStartedNext: false });

				// Cleanup old tracks that are finished or fading out
				if (state.tracks.size() > 2) {
					const old = state.tracks.shift();
					old?.track.Stop(FADE_TIME);
				}
			}
		}
	}
});
