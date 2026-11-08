import { Players, Workspace } from "@rbxts/services";
import { Entity, OnAdd } from "@rbxts/jecs";
import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components/components";

export const MEMORY_STOP = 1.5;
export const APPROACH_TIMEOUT = 15; // waiting for the snapshot, walking toward last seen
const WALK_TIMEOUT = 12;
const TURN_TIMEOUT = 0.8;
const TURN_SPEED = 10; // lerp rate per second, settles in about 0.35s like the old tween
const TURN_COS = math.cos(math.rad(8));
const ARRIVE_PAD = 0.75;
const MIN_WALK = 3;
const MOVING_SPEED = 4; // studs/s: slower than this, the player's velocity says nothing about heading
const SCAN_ANGLES = [0, 12.5, -12.5, 25, -25]; // center first so ties prefer straight

const flat = (v: Vector3) => new Vector3(v.X, 0, v.Z);

export const DEFAULT_MEMORY_CFG: MemoryConfig = { snapshotDelay: 0.5, stopShort: 2, maxWalk: 60, maxScan: 150 };

function getCfg(e: Entity): MemoryConfig {
	const override = world.get(e, Components.MemoryBehaviors);
	return { ...DEFAULT_MEMORY_CFG, ...override };
}

function finish(e: Entity) {
	world.remove(e, Components.MemoryState);
	world.remove(e, Components.PathGoal); // PathGoalClearSystem stops the walk
}

// one shared params object, refreshed only when a scan or floor drop actually happens
const rp = new RaycastParams();
rp.FilterType = Enum.RaycastFilterType.Exclude;
rp.RespectCanCollide = true;

function refreshParams(npcModel: Instance | undefined) {
	const ignore: Instance[] = [];
	if (npcModel) ignore.push(npcModel);
	for (const p of Players.GetPlayers()) if (p.Character) ignore.push(p.Character);
	rp.FilterDescendantsInstances = ignore;
}

// ComputeAsync needs a reachable goal, so drop points to the floor
function dropToFloor(pos: Vector3): Vector3 {
	const hit = Workspace.Raycast(pos.add(new Vector3(0, 3, 0)), new Vector3(0, -20, 0), rp);
	return hit ? hit.Position : pos;
}

function setGoal(e: Entity, position: Vector3, expiresAt: number) {
	world.set(e, Components.PathGoal, { position, stopDistance: MEMORY_STOP, expiresAt });
	const state = world.get(e, Components.PathState);
	if (state) state.stale = true; // repath even if the new goal is close to the old one
}

// smooth body turn, returns true once facing dir
function turnToward(root: BasePart, dir: Vector3, dt: number): boolean {
    const cf = root.CFrame;
    const p = cf.Position;
    const goal = CFrame.lookAt(p, p.add(dir)).Rotation;

    root.CFrame = cf.Rotation.Lerp(goal, math.clamp(TURN_SPEED * dt, 0, 1)).add(p);

    const look = flat(root.CFrame.LookVector);
    return look.Magnitude > 0.001 && look.Unit.Dot(dir) > TURN_COS;
}

export const MemorySystem = {
	name: "MemorySystem",
	system: () => {
		const now = os.clock();
		const dt = scheduler.getDeltaTime();

		// capability removed mid-memory
		for (const [e] of world.query(Components.MemoryState).without(Components.PathingMemory)) finish(e);

		for (const [e, mem, transform, root] of world
			.query(Components.MemoryState, Components.Transform, Components.Basepart)
			.with(Components.PathingMemory)) {
			if (world.has(e, Components.Dead)) {
				finish(e);
				continue;
			}
			const cfg = getCfg(e);
			const pos = transform.Position;

			// snapshot: sampled once. it becomes the goal, the npc assumes that's where the player went
			if (mem.snapshot === undefined && now - mem.lostAt >= cfg.snapshotDelay) {
				const t = world.get(mem.target, Components.Transform);
				if (t === undefined) {
					finish(e);
					continue;
				}
				const snap = t.Position;
				mem.snapshot = snap;

				// heading: player's velocity now > displacement since last seen > npc facing (decided at turn time)
				const hrp = world.get(mem.target, Components.Basepart);
				const vel = hrp !== undefined ? flat(hrp.AssemblyLinearVelocity) : Vector3.zero;
				const disp = flat(snap.sub(mem.lastSeenPos));
				if (vel.Magnitude > MOVING_SPEED) mem.heading = vel.Unit;
				else if (disp.Magnitude > 1) mem.heading = disp.Unit;

				refreshParams(root.Parent);
				setGoal(e, dropToFloor(snap), now + WALK_TIMEOUT);
				mem.phaseAt = now;
			}

			if (mem.phase === "Approach") {
				if (now - mem.phaseAt > APPROACH_TIMEOUT) {
					finish(e);
					continue;
				}
				if (mem.snapshot !== undefined) {
					// walking to the snapshot. goal vanishing means it expired or the path failed
					if (world.get(e, Components.PathGoal) === undefined) {
						finish(e);
						continue;
					}
					if (flat(mem.snapshot.sub(pos)).Magnitude < MEMORY_STOP + ARRIVE_PAD) {
						world.remove(e, Components.PathGoal); // stand still while turning
						mem.phase = "Turn";
						mem.phaseAt = now;
					}
				}
			} else if (mem.phase === "Turn") {
				if (mem.heading === undefined) {
					const look = flat(root.CFrame.LookVector);
					mem.heading = look.Magnitude > 0.001 ? look.Unit : new Vector3(0, 0, -1);
				}
				const facing = turnToward(root, mem.heading, dt);
				if (facing || now - mem.phaseAt > TURN_TIMEOUT) {
					mem.phase = "Scan";
					mem.phaseAt = now;
				}
			} else if (mem.phase === "Scan") {
				const heading = mem.heading!;
				const origin = mem.snapshot!; // the player stood here, so it's open space and rays won't clip the corridor wall
				refreshParams(root.Parent);

				let bestLen = -1;
				let bestDir = heading;
				for (const angle of SCAN_ANGLES) {
					const d = CFrame.Angles(0, math.rad(angle), 0).mul(heading);
					const hit = Workspace.Raycast(origin, d.mul(cfg.maxScan), rp);
					const len = hit ? hit.Position.sub(origin).Magnitude : cfg.maxScan;
					if (len > bestLen) {
						bestLen = len;
						bestDir = d;
					}
				}

				const walkLen = math.min(bestLen - cfg.stopShort, cfg.maxWalk);
				if (walkLen < MIN_WALK) {
					finish(e);
					continue;
				}

				setGoal(e, dropToFloor(origin.add(bestDir.mul(walkLen))), now + WALK_TIMEOUT);
				mem.phase = "Walk";
				mem.phaseAt = now;
			} else {
				// Walk: finish on arrival, timeout, or the goal expiring (path failed)
				const g = world.get(e, Components.PathGoal);
				if (
					g === undefined ||
					now - mem.phaseAt > WALK_TIMEOUT ||
					flat(g.position.sub(pos)).Magnitude < MEMORY_STOP + ARRIVE_PAD
				) {
					finish(e);
				}
			}
		}
	},
};

world.set(Components.PathingMemory, OnAdd, (e) => {
	if (!world.has(e, Components.MemoryBehaviors)) world.set(e, Components.MemoryBehaviors, {});
});