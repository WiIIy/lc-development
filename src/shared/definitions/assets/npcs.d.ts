type PathState = {
	path: Path;
	waypoints: PathWaypoint[];
	index: number; // waypoint currently walking toward (TS arrays are 0-based)
	issuedIndex: number; // last index we called MoveTo for, -1 = none
	issuedAt: number; // os.clock() of last MoveTo, to beat the 8s MoveTo timeout
	goal: Vector3; // goal used for the last compute
	computing: boolean;
	stale: boolean; // set by Path.Blocked, forces a repath
	requestId: number; // invalidates in-flight computes on removal
	lastComputeAt: number;
	lastProgressPos: Vector3; // stuck detection
	lastProgressAt: number;
	blockedConn?: RBXScriptConnection;
};

type NpcAnimController = {
	model: Model;
	root: BasePart;
	walkTrack: AnimationTrack | undefined;
	idleTrack: AnimationTrack | undefined;
	moving: boolean;
};
