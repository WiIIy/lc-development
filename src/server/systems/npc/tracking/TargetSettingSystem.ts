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

const AGGRO_RANGE = 80; // acquire targets inside this. this will later be modified to a per NPC value
const LEASH_RANGE = 120; // keep the current target until it's beyond this
const SWITCH_RATIO = 0.7; // challenger must be within 70% of the current distance
const RETARGET_INTERVAL = 0.25;

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

//this system removes the hard coded willy player thing
// The approach:
// Snapshot all player positions once per tick, not once per NPC.
// Compare squared distances (a Dot instead of Magnitude, no sqrt).
// Retarget on a short timer (about 4 times a second) instead of every frame.
// Add hysteresis, so a challenger must be clearly closer before the NPC switches.
// Add an aggro range and a larger leash range, so a target is dropped only when it is far away.
export const TargetSettingSystem = {
    name: "TargetSettingSystem",
    system: () => {
        timer += scheduler.getDeltaTime();
        if (timer < RETARGET_INTERVAL) return;
        timer = 0;

        // snapshot once per tick, skipping dead players
        const candidates: [Entity, Vector3][] = [];
        for (const [pe, transform] of playerQuery) {
            const humanoid = world.get(pe, Components.Humanoid);
            if (humanoid && humanoid.Health <= 0) continue;
            candidates.push([pe, transform.Position]);
        }

        for (const [e, transform] of world.query( Components.Transform, Components.Tracking)) {
            const pos = transform.Position;

            // nearest candidate inside aggro range
            let best: Entity | undefined;
            let bestSq = AGGRO_RANGE * AGGRO_RANGE;
            for (const [pe, pPos] of candidates) {
                const dsq = distSq(pPos, pos);
                if (dsq < bestSq) {
                    best = pe;
                    bestSq = dsq;
                }
            }

            // current target's distance, if it's still valid
            const current = world.target(e, Components.Target);
            let currentSq = math.huge;
            if (current !== undefined) {
                const ct = candidates.find(([pe]) => pe === current);
                if (ct) currentSq = distSq(ct[1], pos);
            }

            if (currentSq <= LEASH_RANGE * LEASH_RANGE) {
                // keep current unless a challenger is clearly closer
                if (best !== undefined && best !== current && bestSq < currentSq * SWITCH_RATIO * SWITCH_RATIO) {
                    setTarget(e, best);
                }
            } else if (best !== current) {
                setTarget(e, best); // lost or dead target: pick the nearest, or clear if none
            }
        }
    },
};

//not runnin
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
