import { PathfindingService } from "@rbxts/services";
import world from "shared/world";
import { Components } from "shared/components/components";

const AGENT_PARAMS = { AgentRadius: 2, AgentHeight: 5, AgentCanJump: true };

const WAYPOINT_REACHED = 3; // studs (XZ)
const STOP_DISTANCE = 6; // stop this close to the target
const REPATH_INTERVAL = 0.5; // min seconds between computes
const REPATH_MOVED = 6; // target must move this far to trigger a repath
const MOVETO_REFRESH = 6; // re-issue MoveTo before Humanoid's 8s timeout
const STUCK_TIME = 1.5;
const STUCK_DIST = 0.75;

const flat = (v: Vector3) => new Vector3(v.X, 0, v.Z);

// 1) Create state when the tag appears
const needsState = world.query(Components.Pathfinding).without(Components.PathState).cached();

export const PathSetupSystem = {
    name: "PathSetupSystem",
    system: () => {
        for (const [e] of needsState) {
            const state: PathState = {
                path: PathfindingService.CreatePath(AGENT_PARAMS),
                waypoints: [],
                index: 0,
                issuedIndex: -1,
                issuedAt: 0,
                goal: Vector3.zero,
                computing: false,
                stale: true, // compute immediately
                requestId: 0,
                lastComputeAt: 0,
                lastProgressPos: Vector3.zero,
                lastProgressAt: os.clock(),
            };
            state.blockedConn = state.path.Blocked.Connect((blockedIdx) => {
                if (blockedIdx >= state.index) state.stale = true;
            });
            world.set(e, Components.PathState, state);
        }
    },
};

// 2) Decide when to (re)compute
function requestPath(state: PathState, from: Vector3, goal: Vector3) {
    state.computing = true;
    state.stale = false;
    state.goal = goal;
    state.lastComputeAt = os.clock();
    const id = ++state.requestId;

    task.spawn(() => {
        const [ok] = pcall(() => state.path.ComputeAsync(from, goal));
        if (id !== state.requestId) return; // entity lost the tag while computing
        state.computing = false;

        if (ok && state.path.Status === Enum.PathStatus.Success) {
            state.waypoints = state.path.GetWaypoints();
            state.index = 1; // skip waypoint 0, it's the start
            state.issuedIndex = -1;
        } else {
            state.waypoints = [];
            state.index = 0;
        }
    });
}

export const PathRequestSystem = {
    name: "PathRequestSystem",
    system: () => {
        const now = os.clock();
        for (const [e, state, root, targetTransform] of world
            .query(Components.PathState, Components.Basepart, Components.TargetTransform)
            .with(Components.Pathfinding)) {
            if (state.computing) continue; // one Path object = one compute at a time
            if (now - state.lastComputeAt < REPATH_INTERVAL) continue;

            const goal = targetTransform.Position;
            const targetMoved = goal.sub(state.goal).Magnitude > REPATH_MOVED;
            const idle = state.waypoints.size() === 0 && goal.sub(root.Position).Magnitude > STOP_DISTANCE;

            if (state.stale || targetMoved || idle) requestPath(state, root.Position, goal);
        }
    },
};

// 3) Walk the waypoints
export const PathFollowSystem = {
    name: "PathFollowSystem",
    system: () => {
        const now = os.clock();
        for (const [e, state, humanoid, root, targetTransform] of world
            .query(Components.PathState, Components.Humanoid, Components.Basepart, Components.TargetTransform)
            .with(Components.Pathfinding)) {
            const pos = root.Position;

            // close enough to the target: stop
            if (flat(targetTransform.Position.sub(pos)).Magnitude < STOP_DISTANCE) {
                if (state.waypoints.size() > 0) {
                    state.waypoints = [];
                    humanoid.MoveTo(pos);
                }
                continue;
            }

            const wp = state.waypoints[state.index];
            if (wp === undefined) continue; // nothing to follow (computing, or no path)

            // reached this waypoint, advance
            if (flat(wp.Position.sub(pos)).Magnitude < WAYPOINT_REACHED) {
                state.index++;
                if (state.waypoints[state.index] === undefined) {
                    state.waypoints = []; // path finished, the request system will compute again if needed
                }
                continue;
            }

            // issue MoveTo once per waypoint, and refresh before the 8s timeout
            if (state.issuedIndex !== state.index || now - state.issuedAt > MOVETO_REFRESH) {
                humanoid.MoveTo(wp.Position);
                if (wp.Action === Enum.PathWaypointAction.Jump) humanoid.Jump = true;
                state.issuedIndex = state.index;
                state.issuedAt = now;
            }

            // stuck detection: barely moved in STUCK_TIME, so jump and repath
            if (pos.sub(state.lastProgressPos).Magnitude > STUCK_DIST) {
                state.lastProgressPos = pos;
                state.lastProgressAt = now;
            } else if (now - state.lastProgressAt > STUCK_TIME) {
                humanoid.Jump = true;
                state.stale = true;
                state.lastProgressAt = now;
            }
        }
    },
};

// 4) Cleanup when the tag is removed
const pathRemoved = world.query(Components.PathState).without(Components.Pathfinding).cached();

export const PathCleanupSystem = {
    name: "PathCleanupSystem",
    system: () => {
        for (const [e, state] of pathRemoved) {
            state.requestId++; // any in-flight compute now discards its result
            state.blockedConn?.Disconnect();
            state.path.Destroy();

            const root = world.get(e, Components.Basepart);
            const humanoid = world.get(e, Components.Humanoid);
            if (root && humanoid) humanoid.MoveTo(root.Position); // cancel the walk

            world.remove(e, Components.PathState);
        }
    },
};