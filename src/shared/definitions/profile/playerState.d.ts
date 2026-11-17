type MovementState = "idle" | "movingforward" | "movingbackward" | "strafingleft" | "strafingright";
type EnvironmentState = "plainsight" | "hidden";
type BodyState = "crouching" | "standing";
type SpeedState = "walking" | "sprinting" | "dashing";
type ActionState = "idle" | "meleelight" | "meleeheavy" | "parrying" | "shoving";

type PlayerBehaviorState = {
	movementState: MovementState;
	environmentState: EnvironmentState;
	bodyState: BodyState;
	speedState: SpeedState;
	actionState: ActionState;
};
