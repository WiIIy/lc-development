	import { scheduler } from "shared/scheduler";
	import world from "shared/world";
	import { Entity, Id, Name, OnRemove, pair, Tag, TagDiscriminator, w, Wildcard } from "@rbxts/jecs";
	import { Components } from "shared/components/components";
	import Make from "@rbxts/make";
	import { Players, Workspace } from "@rbxts/services";
	import { ref } from "@willy/jecs-utils";
	import { setDescendantsNetworkOwner } from "shared/utils/world/setDescendant";
	import { MEMORY_STOP, APPROACH_TIMEOUT } from "../pathing/MemorySystem";
	import { resetPathState } from "../pathing/utils/resetPathState";

	const LOSS_GRACE = 0.3; // failed checks must persist this long before the target is dropped (two ticks)
	const UPPER_BODY = new Vector3(0, 2, 0);

	const trackerRemoved = world.query(pair(Components.Target, Wildcard)).without(Components.Tracking).cached();
	const targetRemoved = world.query(Components.TargetTransform).without(pair(Components.Target, Wildcard)).cached();

	const playerQuery = world.query(Components.Transform, Components.Player).cached();
	let timer = 0;

	const distSq = (a: Vector3, b: Vector3) => {
		const d = a.sub(b);
		return d.Dot(d);
	};

	function clearRay(eye: Vector3, to: Vector3): boolean {
		return Workspace.Raycast(eye, to.sub(eye), params) === undefined;
	}


	function setTarget(e: Entity, newTarget: Entity) {
		world.remove(e, pair(Components.Target as Entity, Wildcard) as Id<TagDiscriminator>);
		world.add(e, pair(Components.Target as Entity, newTarget) as Id<TagDiscriminator>);

		// reacquired: cancel any memory behavior, pursuit will write a fresh PathGoal
		world.remove(e, Components.MemoryState);
		world.remove(e, Components.PathGoal);

		const plr = world.get(newTarget, Components.Player);
		const model = world.get(e, Components.Basepart)?.Parent;
		const t = world.get(newTarget, Components.Transform);

		if (t) world.set(e, Components.LastSeen, { pos: t, time: os.clock(), target: newTarget, visible: true });

		if (plr && model) setDescendantsNetworkOwner(model as Model, undefined); //do NOT set it to client. its choppy and ugly
	}

	function loseTarget(e: Entity, reason: LossReason, lost: Entity, now: number) {
		world.remove(e, pair(Components.Target as Entity, Wildcard) as Id<TagDiscriminator>);

		// server takes the npc back (setDescendantsNetworkOwner must accept undefined = server)
		const model = world.get(e, Components.Basepart)?.Parent;
		if (model) setDescendantsNetworkOwner(model as Model, undefined);

		// drop combos. order matters: QueuedAttacks first so AttackOngoing's OnRemove hook doesn't re-add it
		world.remove(e, Components.ExecuteAttack);
		world.remove(e, Components.QueuedAttacks);
		world.remove(e, Components.AttackOngoing);

		resetPathState(e); // ditch the old path

		const seen = world.get(e, Components.LastSeen);
		if (reason === "gone" || seen === undefined || seen.target !== lost) {
			world.remove(e, Components.PathGoal);
			return;
		}

		const hasMemory = world.has(e, Components.PathingMemory);
		world.set(e, Components.PathGoal, {
			position: seen.pos.Position,
			stopDistance: MEMORY_STOP,
			once: !hasMemory, // no memory: walk to last known, then idle
			expiresAt: now + APPROACH_TIMEOUT,
		});
		if (hasMemory) {
			world.set(e, Components.MemoryState, {
				phase: "Approach",
				lostAt: now,
				phaseAt: now,
				lastSeenPos: seen.pos.Position,
				target: lost,
			});
		}
		print(reason)
	}


	const SIGHT_RANGE = 80;
	const FOV_COS = math.cos(math.rad(75));
	const EYE_OFFSET = new Vector3(0, 1.5, 0);
	const SWITCH_RATIO = 0.7;
	const RETARGET_INTERVAL = 0.25;

	type Sight = "visible" | "wall" | "fov" | "range";
	type LossReason = Sight | "gone";

	const params = new RaycastParams();
	params.FilterType = Enum.RaycastFilterType.Exclude;

	function sight(eye: Vector3, forward: Vector3, targetPos: Vector3, dsq: number, omniscient: boolean): Sight {
		if (dsq > SIGHT_RANGE * SIGHT_RANGE) return "range";
		const offset = targetPos.sub(eye);
		if (!omniscient && forward.Dot(offset.Unit) < FOV_COS) return "fov";
		// center or upper body: a door frame clipping one ray shouldn't lose the player
		return clearRay(eye, targetPos) || clearRay(eye, targetPos.add(UPPER_BODY)) ? "visible" : "wall";
	}


	export const TargetSettingSystem = {
		name: "TargetSettingSystem",
		system: () => {
			timer += scheduler.getDeltaTime();
			if (timer < RETARGET_INTERVAL) return;
			timer = 0;
			const now = os.clock();

			const candidates: [Entity, Vector3][] = [];
			const characters: Instance[] = [];
			for (const [pe, transform] of playerQuery) {
				const humanoid = world.get(pe, Components.Humanoid);
				if (humanoid && humanoid.Health <= 0) continue;
				candidates.push([pe, transform.Position]);
				const model = world.get(pe, Components.Basepart)?.Parent;
				if (model) characters.push(model);
			}

			for (const [e, transform, root] of world.query(Components.Transform, Components.Basepart, Components.Tracking)) {
				const pos = transform.Position;
				const eye = pos.add(EYE_OFFSET);
				const forward = transform.LookVector;
				const omniscient = world.has(e, Components.Omniscient);
				params.FilterDescendantsInstances = [...characters, root.Parent!];

				const current = world.target(e, Components.Target);
				let best: Entity | undefined;
				let bestSq = math.huge;
				let currentSq = math.huge;
				// "gone" = current target isn't a candidate (dead/disconnected), never reaches sight()
				let currentSight: LossReason | undefined = current !== undefined ? "gone" : undefined;

				for (const [pe, pPos] of candidates) {
					const dsq = distSq(pPos, pos);
					if (pe !== current && dsq >= bestSq) continue;

					const s = sight(eye, forward, pPos, dsq, omniscient);
					if (pe === current) {
						currentSq = dsq;
						currentSight = s;
					}
					if (s === "visible" && dsq < bestSq) {
						best = pe;
						bestSq = dsq;
					}
				}

				if (current === undefined) {
					if (best !== undefined) {setTarget(e, best)};
					continue;
				}

				if (currentSight === "visible") {
					const t = world.get(current, Components.Transform);
					if (t) world.set(e, Components.LastSeen, { pos: t, time: now, target: current, visible: true });

					const clearlyCloser = best !== undefined && best !== current && bestSq < currentSq * SWITCH_RATIO * SWITCH_RATIO;
					if (clearlyCloser) setTarget(e, best!);
					continue;
				}

				// current target not visible
				if (best !== undefined) {
					setTarget(e, best);
					continue;
				}
				const seen = world.get(e, Components.LastSeen);
				if (currentSight !== "gone" && seen !== undefined && seen.target === current && now - seen.time < LOSS_GRACE) {
					if (seen.visible) world.set(e, Components.LastSeen, { ...seen, visible: false });
					continue;
					}
				 // debounce: LastSeen.time only updates while visible, so no extra state is needed
				
				loseTarget(e, currentSight!, current, now);
			}
		},
	};


	export const TargetTransformTrackingSystem = {
		name: "TargetTransformTrackingSystem",
		system: () => {
			for (const [e] of world.query(pair(Components.Target, Wildcard))) {
				const plr = world.target(e, Components.Target);
				if (plr === undefined) continue;
				const t = world.get(plr, Components.Transform);
				if (t === undefined) continue;
				world.set(e, Components.TargetTransform, t);
			}
		},
	};

	export const TargetTransformCleanupSystem = {
		name: "TargetTransformCleanupSystem",
		system: () => {
			for (const [e] of trackerRemoved) {
				world.remove(e, pair(Components.Target, Wildcard));
			}

			for (const [e] of targetRemoved) {
				world.remove(e, Components.TargetTransform);
				// const neck = world.get(e, Components.NeckJoint) as Motor6D;
				// if (!neck){print("no neck component");return}
				// 	neck.C0 = new CFrame(0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);
			}
			
		},
	};

	world.set(Components.SightTracking, OnRemove, (e) => {
		const neck = world.get(e, Components.NeckJoint) as Motor6D;
		neck.C0 = new CFrame(0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);
	});
