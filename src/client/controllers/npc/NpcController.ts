import Make from "@rbxts/make";
import { CollectionService, RunService } from "@rbxts/services";
import assets from "shared/assets";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { ASSET_ID_PREFIX } from "shared/data/paths";

const BASE_WALK_SPEED = 16; // studs/s the walk animation was authored for
const START_MOVING = 1.5;
const STOP_MOVING = 0.5; // lower than START so it doesn't flicker at the edge

const controllers = new Map<Model, NpcAnimController>();

// shared, created once
const walkAnim = Make("Animation", { AnimationId: assets["anims/character/npc/movement/walkingloop.rbxm"] });
const idleAnim = Make("Animation", { AnimationId: assets["anims/character/npc/movement/idleloop.rbxm"]});

function setupEnemy(enemy: Instance) {
    if (!enemy.IsA("Model") || controllers.has(enemy)) return;

    task.spawn(() => {
        // wait for streaming instead of giving up
        const humanoid = enemy.WaitForChild("Humanoid", 10) as Humanoid | undefined;
        const animator = humanoid?.WaitForChild("Animator", 10) as Animator | undefined;
        const root = enemy.WaitForChild("HumanoidRootPart", 10) as BasePart | undefined;
        if (!animator || !root || !enemy.IsDescendantOf(game) || controllers.has(enemy)) return;

        const walkTrack = animator.LoadAnimation(walkAnim);
        const idleTrack = animator.LoadAnimation(idleAnim);
        walkTrack.Looped = true;
        walkTrack.Stop();
        walkTrack.Priority = Enum.AnimationPriority.Movement;
        idleTrack.Looped = true;
        idleTrack.Priority = Enum.AnimationPriority.Idle; // lowest, so anything else overrides it
        idleTrack.Play();

        controllers.set(enemy, { model: enemy, root, walkTrack, idleTrack, moving: false });
    });
}

CollectionService.GetInstanceAddedSignal("Enemy").Connect(setupEnemy);
for (const enemy of CollectionService.GetTagged("Enemy")) setupEnemy(enemy); // already-existing ones

// removal handler stays as it was

RunService.Heartbeat.Connect(() => {
    for (const [enemy, c] of controllers) {
        if (!enemy.Parent || !c.root.Parent) {
            controllers.delete(enemy);
            continue;
        }

        const v = c.root.AssemblyLinearVelocity;
        const speed = math.sqrt(v.X * v.X + v.Z * v.Z);
        const moving = speed > (c.moving ? STOP_MOVING : START_MOVING);

        if (moving !== c.moving) {
            c.moving = moving;
            if (moving) {
                c.idleTrack!.Stop(0.2);
                c.walkTrack!.Play(0.2);
            } else {
                c.walkTrack!.Stop(0.2);
                c.idleTrack!.Play(0.2);
            }
        }

        if (moving) c.walkTrack!.AdjustSpeed(speed / BASE_WALK_SPEED); // no foot sliding
    }
});