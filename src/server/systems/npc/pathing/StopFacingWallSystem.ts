import { Entity, OnAdd, OnRemove } from "@rbxts/jecs";
import { Players, Workspace } from "@rbxts/services";
import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Components } from "shared/components/components";
import { releaseBody, turnBody, bodyFacing } from "../utils/bodyTurn";

const RAY_COUNT = 8;
const STEP = 360 / RAY_COUNT; // compass directions relative to the npc, 0 = straight ahead
const LOOK_RANGE = 40; // rays stop here, so a huge open room doesn't dwarf everything else
const WALL_DIST = 8; // clear distance straight ahead below this = "staring at a wall"
const SIDE_WEIGHT = 0.5; // neighbors count half: approximates what fits in the 150 degree FOV
const STAY_BONUS = 1.25; // another direction must be 25% better than the current one, or stay (no flip-flopping)
const SCAN_INTERVAL = 0.4; // also the beat the npc waits after going idle before it reacts
const TURN_RATE = 5; // slower than combat tracking, a relaxed look-around (about 0.6s for a 180)
const EYE_OFFSET = new Vector3(0, 1.5, 0); // same as TargetSettingSystem

const rp = new RaycastParams();
rp.FilterType = Enum.RaycastFilterType.Exclude;
rp.RespectCanCollide = true;

function refreshParams(npcModel: Instance | undefined) {
	const ignore: Instance[] = [];
	if (npcModel) ignore.push(npcModel);
	for (const p of Players.GetPlayers()) if (p.Character) ignore.push(p.Character);
	rp.FilterDescendantsInstances = ignore;
}

// anything that means the body belongs to another behavior right now
function busy(e: Entity): boolean {
	if (
		world.has(e, Components.PathGoal) ||
		world.has(e, Components.MemoryState) ||
		world.has(e, Components.AttackOngoing) ||
		world.has(e, Components.Dead) ||
		world.target(e, Components.Target) !== undefined
	)
		return true;
	const humanoid = world.get(e, Components.Humanoid);
	return humanoid !== undefined && humanoid.MoveDirection.Magnitude > 0.1; // still decelerating
}

function measure(eye: Vector3, forward: Vector3): number[] {
	const lens: number[] = [];
	for (let i = 0; i < RAY_COUNT; i++) {
		const d = CFrame.Angles(0, math.rad(i * STEP), 0).mul(forward);
		const hit = Workspace.Raycast(eye, d.mul(LOOK_RANGE), rp);
		lens.push(hit ? hit.Position.sub(eye).Magnitude : LOOK_RANGE);
	}
	return lens;
}

// own ray plus the two neighbors: a lone narrow slit scores lower than a wide open room
function score(lens: number[], i: number): number {
	return lens[i] + SIDE_WEIGHT * (lens[(i + RAY_COUNT - 1) % RAY_COUNT] + lens[(i + 1) % RAY_COUNT]);
}

// undefined = stay as is
function pickFacing(eye: Vector3, forward: Vector3): Vector3 | undefined {
	const lens = measure(eye, forward);
	if (lens[0] >= WALL_DIST) return undefined; // forward is open enough, people only turn when they're facing a wall

	let bestI = 0;
	let bestScore = score(lens, 0) * STAY_BONUS;
	for (let i = 1; i < RAY_COUNT; i++) {
		const s = score(lens, i);
		if (s > bestScore) {
			bestScore = s;
			bestI = i;
		}
	}
	if (bestI === 0) return undefined;
	return CFrame.Angles(0, math.rad(bestI * STEP), 0).mul(forward);
}

export const StopFacingWallsSystem = {
	name: "StopFacingWallsSystem",
	system: () => {
		const now = os.clock();
		const dt = scheduler.getDeltaTime();

		for (const [e, transform, root, joint, wall] of world
			.query(Components.Transform, Components.Basepart, Components.RootJoint, Components.WallLook)
			.with(Components.StopFacingWalls)) {
			if (busy(e)) {
				// walking/fighting is about to use the HRP, fold our twist into it first
				if (wall.posing) {
					releaseBody(root, joint);
					wall.posing = false;
				}
				wall.goal = undefined;
				wall.nextScanAt = now + SCAN_INTERVAL;
				continue;
			}

			// mid-turn toward the direction we picked
			if (wall.goal !== undefined) {
				wall.posing = true;
				if (turnBody(root, joint, wall.goal, TURN_RATE, dt)) wall.goal = undefined;
				continue;
			}

			if (now < wall.nextScanAt) continue;
			wall.nextScanAt = now + SCAN_INTERVAL;

			refreshParams(root.Parent);
			// Transform is the torso (TransformSystem), so this already includes any twist we're holding
			wall.goal = pickFacing(transform.Position.add(EYE_OFFSET), bodyFacing(root, joint));
		}
	},
};

world.set(Components.StopFacingWalls, OnAdd, (e) => {
	world.set(e, Components.WallLook, { nextScanAt: 0, posing: false });
});

world.set(Components.StopFacingWalls, OnRemove, (e) => {
	const root = world.get(e, Components.Basepart);
	if (root) releaseBody(root, world.get(e, Components.RootJoint));
	const wall = world.get(e, Components.WallLook);
	if (wall) {
		wall.posing = false;
		wall.goal = undefined;
	}
});