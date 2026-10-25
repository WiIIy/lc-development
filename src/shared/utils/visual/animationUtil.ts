/* eslint-disable roblox-ts/lua-truthiness */
import Make from "@rbxts/make";
import { ContentProvider, Debris } from "@rbxts/services";
import { ASSET_ID_PREFIX } from "shared/data/paths";

// Interface defines the object structure: { Track: ..., Connections: ... }
interface ActiveTrack {
	Track: AnimationTrack;
	Connections: Array<RBXScriptConnection>;
}

type MarkerCallbacks = ((markerName?: string) => void) | { [markerName: string]: (markerName?: string) => void };

export class AnimationUtil {
	// Replicates: module.Anims[char][_type][animId]
	// Structure: Model -> TypeName -> AnimId -> ActiveTrack
	private anims = new Map<Model, Map<string, Map<string, ActiveTrack>>>();

	// Replicates: local preloaded = {}
	private preloaded = new Set<string>();

	/**
	 * Gets the Animator from a Humanoid or AnimationController
	 */
	public getAnimator(model: Model): Animator | undefined {
		const humanoid = model.FindFirstChildOfClass("Humanoid");
		if (humanoid) {
			return humanoid.WaitForChild("Animator", 10) as Animator | undefined;
		}

		const animController = model.FindFirstChildOfClass("AnimationController");
		if (animController) {
			return animController.WaitForChild("Animator", 10) as Animator | undefined;
		}
		return undefined;
	}

	/**
	 * 1. RemoveAnim
	 * Stops track, destroys it, disconnects events, and cleans up the Map.
	 */
	public removeAnim(model: Model, typeName: string, animId: string, fadeOutTime?: number): void {
		const charMap = this.anims.get(model);
		if (!charMap) return;

		const typeMap = charMap.get(typeName);
		if (!typeMap) return;

		const animData = typeMap.get(animId);

		if (animData) {
			// Stop and Destroy Track
			if (animData.Track) {
				animData.Track.Stop(fadeOutTime);

				if (fadeOutTime !== undefined && fadeOutTime > 0) {
					// Delay destruction so the fade out actually completes
					const trackToDestroy = animData.Track;
					task.delay(fadeOutTime, () => {
						trackToDestroy.Destroy();
					});
				} else {
					// Instantly destroy if there is no fade out
					animData.Track.Destroy();
				}
			}

			// Disconnect Connections
			if (animData.Connections) {
				animData.Connections.forEach((conn) => {
					if (conn.Connected) conn.Disconnect();
				});
			}

			// Remove specific animation entry
			typeMap.delete(animId);
		}

		// Cleanup nested maps if empty (Replicating: if next(table) == nil)
		if (typeMap.size() === 0) {
			charMap.delete(typeName);
		}

		if (charMap.size() === 0) {
			this.anims.delete(model);
		}
	}

	/**
	 * 2. IsAnim
	 * Checks if a specific animation exists and is playing.
	 */
	public isAnim(model: Model, typeName: string, animId: string): boolean {
		const entry = this.anims.get(model)?.get(typeName)?.get(animId);
		// Returns true if entry exists, track exists, and is playing. Otherwise false.
		return entry !== undefined && entry.Track !== undefined && entry.Track.IsPlaying;
	}

	/**
	 * 3. GetAnims
	 * Returns the map of animations for a character, or a specific type map.
	 */
	public getAnims(model: Model, typeName?: string) {
		const charMap = this.anims.get(model);
		if (!charMap) return undefined;

		if (typeName) {
			return charMap.get(typeName); // Returns Map<string, ActiveTrack> | undefined
		}

		return charMap; // Returns Map<string, Map<string, ActiveTrack>>
	}

	/**
	 * 4. StopAnim
	 * Handles "ALL", specific type, or specific ID.
	 */
	public stopAnim(model: Model, typeName: string, animId?: string, fadeOutTime?: number): void {
		const charMap = this.anims.get(model);
		if (!charMap) return;

		if (typeName === "ALL") {
			// Loop through all types for this character
			for (const [tName, tMap] of charMap) {
				// Loop through all IDs in that type
				for (const [id] of tMap) {
					this.removeAnim(model, tName, id, fadeOutTime);
				}
			}
		} else {
			if (animId) {
				// Stop specific animation
				this.removeAnim(model, typeName, animId, fadeOutTime);
			} else {
				// Stop all animations of this specific type
				const typeMap = charMap.get(typeName);
				if (typeMap) {
					// We iterate keys first to avoid modification issues while iterating
					for (const [id] of typeMap) {
						this.removeAnim(model, typeName, id, fadeOutTime);
					}
				}
			}
		}
	}

	public preloadAnimations(target: Model | Animator, animList: string[]): Promise<void> {
		return new Promise<void>((resolve) => {
			let animator: Animator | undefined;
			let contextParent: Instance | undefined;

			if (target.IsA("Animator")) {
				animator = target;
				contextParent = target.Parent || target;
			} else {
				animator = this.getAnimator(target);
				contextParent = target;
			}

			if (!animator) {
				resolve();
				return;
			}

			const loadPromises: Promise<void>[] = [];

			for (const animId of animList) {
				if (!this.preloaded.has(animId)) {
					this.preloaded.add(animId);

					// Wrap individual load in a promise
					loadPromises.push(
						new Promise<void>((subResolve) => {
							const animation = Make("Animation", {
								AnimationId: ASSET_ID_PREFIX + animId,
								Parent: contextParent || animator,
							});

							// Use PreloadAsync then cleanup
							ContentProvider.PreloadAsync([animation]);

							// Force internal engine load
							if (animator) {
								const track = animator.LoadAnimation(animation);
								// Just loading it is usually enough to get the Length data
								track.Destroy();
							}

							animation.Destroy();
							subResolve();
						}),
					);
				}
			}

			// Wait for all animations in the list to finish loading
			Promise.all(loadPromises).then(() => resolve());
		});
	}

	public loadAnim(
		model: Model,
		typeName: string,
		animId: string,
		fadeInTime?: number,
		isLooped: boolean = false,
		callbacks?: MarkerCallbacks, // Changed type to support object map,
	): AnimationTrack | undefined {
		if (!model || !typeName || !animId) return;

		const animator = this.getAnimator(model);
		if (!animator) {
			print("no animator");
			return;
		}

		const animation = Make("Animation", {
			AnimationId: animId.sub(0, 1) === "r" ? animId : ASSET_ID_PREFIX + animId,
		});

		// print(animation, animation.AnimationId)
		const track = animator.LoadAnimation(animation);
		track.Looped = isLooped;

		const connections: Array<RBXScriptConnection> = [];

		// Handle Callbacks
		if (callbacks) {
			if (typeIs(callbacks, "function")) {
				// Legacy: Generic KeyframeReached (less reliable on first load)
				connections.push(
					track.KeyframeReached.Connect((markerName) => {
						callbacks(markerName);
					}),
				);
			} else if (typeIs(callbacks, "table")) {
				// Modern: GetMarkerReachedSignal (Reliable)
				// eslint-disable-next-line roblox-ts/no-array-pairs
				for (const [markerName, callback] of pairs(callbacks)) {
					connections.push(
						track.GetMarkerReachedSignal(markerName as string).Connect((markerName: string | undefined) => {
							(callback as (markerName?: string) => void)(markerName);
						}),
					);
				}
			}
		}

		connections.push(
			track.Stopped.Connect(() => {
				this.removeAnim(model, typeName, animId);
			}),
		);

		if (!this.anims.has(model)) this.anims.set(model, new Map());
		const charMap = this.anims.get(model)!;

		if (!charMap.has(typeName)) charMap.set(typeName, new Map());
		const typeMap = charMap.get(typeName)!;

		typeMap.set(animId, {
			Track: track,
			Connections: connections,
		});

		// Use the fadeInTime when playing
		track.Play(fadeInTime);

		if (!isLooped) {
			// Clean up animation instance (not the track) to save memory
			Debris.AddItem(animation, 1);
		}

		return track;
	}

	/**
	 * Randomly picks an animation from an array of IDs and plays it using loadAnim.
	 */
	public randomizeAnim(
		model: Model,
		typeName: string,
		animIdList: string[],
		fadeInTime?: number,
		isLooped: boolean = false,
		callbacks?: MarkerCallbacks,
	): AnimationTrack | undefined {
		if (!animIdList || animIdList.size() === 0) {
			print("no anim id list provided");
			return;
		};
		const randomIndex = math.random(0, animIdList.size() - 1);
		const selectedAnimId = animIdList[randomIndex];
		return this.loadAnim(model, typeName, selectedAnimId, fadeInTime, isLooped, callbacks);
	}

	public clearAllAnimations(model: Model, fadeTime: number = 0, excludedTypes?: string[]): void {
		const animator = this.getAnimator(model);
		if (!animator) return;

		const charMap = this.anims.get(model);
		if (!charMap) return;

		// Iterate through all tracked typeNames for this model
		for (const [typeName, typeMap] of charMap) {
			// If this typeName is in our exclusion list, skip it entirely
			if (excludedTypes && excludedTypes.includes(typeName)) {
				continue;
			}

			// Otherwise, stop and clean up all animations under this typeName
			for (const [animId, trackData] of typeMap) {
				const track = trackData.Track;
				const connections = trackData.Connections;

				// Disconnect all marker events and the Stopped event
				for (const conn of connections) {
					conn.Disconnect();
				}

				track.Stop(fadeTime);
				track.Destroy();

				// Remove from map
				typeMap.delete(animId);
			}

			// If the map for this typeName is now empty, clean it up
			if (typeMap.size() === 0) {
				charMap.delete(typeName);
			}
		}

		// If the model has no more tracked animations, clean up the root map entry
		if (charMap.size() === 0) {
			this.anims.delete(model);
		}
	}
}

export const AnimationUtils = new AnimationUtil();
