import { scheduler } from "shared/scheduler";
import world from "shared/world";
import { Entity, Id, Name, OnRemove, pair, Tag, TagDiscriminator, w, Wildcard } from "@rbxts/jecs";
import { Components } from "shared/components/components";
import Make from "@rbxts/make";
import { Players, Workspace } from "@rbxts/services";
import { ref } from "@willy/jecs-utils";
import { setDescendantsNetworkOwner } from "shared/utils/world/setDescendant";

const trackerRemoved = world.query(pair(Components.Target, Wildcard)).without(Components.Tracking).cached();
const targetRemoved = world.query(Components.TargetTransform).without(pair(Components.Target, Wildcard)).cached();

const playerQuery = world.query(Components.Transform, Components.Player).cached();
let timer = 0;

const distSq = (a: Vector3, b: Vector3) => {
    const d = a.sub(b);
    return d.Dot(d);
};

function setTarget(e: Entity, newTarget: Entity | undefined) {
    world.remove(e, pair(Components.Target as Entity, Wildcard) as Id<TagDiscriminator>);
    if (newTarget === undefined) return;
    world.add(e, pair(Components.Target as Entity, newTarget) as Id<TagDiscriminator>);

    // hand physics ownership to the new target (only on change, not every tick)
    const plr = world.get(newTarget, Components.Player);
    const model = world.get(e, Components.Basepart)?.Parent;
    if (plr && model) setDescendantsNetworkOwner(model as Model, plr);
}

const SIGHT_RANGE = 80;
const LEASH_RANGE = 120;
const FOV_COS = math.cos(math.rad(75)); // 150° total view cone
const EYE_OFFSET = new Vector3(0, 1.5, 0);
const MEMORY = 3; // seconds a lost target is remembered
const SWITCH_RATIO = 0.7;
const RETARGET_INTERVAL = 0.25;

const lastSeen = new Map<Entity, number>(); // NPC entity -> os.clock() when target was last visible
const params = new RaycastParams();
params.FilterType = Enum.RaycastFilterType.Exclude;

function canSee(eye: Vector3, forward: Vector3, targetPos: Vector3, dsq: number, omniscient: boolean): boolean {
    if (dsq > SIGHT_RANGE * SIGHT_RANGE) return false;
    const offset = targetPos.sub(eye);
    if (!omniscient && forward.Dot(offset.Unit) < FOV_COS) return false;
    // ray ends exactly at the target; players are filtered out, so any hit is a wall
    return Workspace.Raycast(eye, offset, params) === undefined;
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
            let currentVisible = false;

            for (const [pe, pPos] of candidates) {
                const dsq = distSq(pPos, pos);
                if (pe !== current && dsq >= bestSq) continue; // can't beat the current best, skip the raycast

                const visible = canSee(eye, forward, pPos, dsq, omniscient);
                if (pe === current) {
                    currentSq = dsq;
                    currentVisible = visible;
                }
                if (visible && dsq < bestSq) {
                    best = pe;
                    bestSq = dsq;
                }
            }

            if (currentVisible) lastSeen.set(e, now);

            const holding =
                current !== undefined &&
                currentSq <= LEASH_RANGE * LEASH_RANGE &&
                (currentVisible || now - (lastSeen.get(e) ?? 0) < MEMORY);

            if (holding) {
                const clearlyCloser = best !== undefined && bestSq < currentSq * SWITCH_RATIO * SWITCH_RATIO;
                if (best !== undefined && best !== current && (!currentVisible || clearlyCloser)) {
                    setTarget(e, best);
                    lastSeen.set(e, now);
                }
            } else if (best !== current) {
                setTarget(e, best); // nearest visible, or clear if nobody is visible
                lastSeen.set(e, now);
            }
        }
    },
};

export const TargetTransformTrackingSystem = {
	name: "TargetTransformTrackingSystem",
	system: () => {
		for (const [e] of world.query(pair(Components.Target, Wildcard))) {
			// print("a")
			const plrEntity = world.target(e, Components.Target);
			const plrTrsfrm = world.get(plrEntity!, Components.Transform);
			// print("player transform", plrTrsfrm);
			world.set(e, Components.TargetTransform, plrTrsfrm!);
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
			const neck = world.get(e, Components.NeckJoint) as Motor6D;
			neck.C0 = new CFrame(0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);
		}
	},
};

world.set(Components.SightTracking, OnRemove, (e) => {
	const neck = world.get(e, Components.NeckJoint) as Motor6D;
	neck.C0 = new CFrame(0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0);
});
