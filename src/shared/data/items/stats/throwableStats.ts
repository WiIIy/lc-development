import FastCast from "@rbxts/fastcast";
import { Workspace } from "@rbxts/services";

export const ThrowablCaster = new FastCast();
export const ThrowableBehavior = FastCast.newBehavior();

export const THROWABLE_SETTINGS = {
	Knife: {
		MAX_DISTANCE: 1000,
		VELOCITY: 60,
		GRAVITY: new Vector3(0, -25, 0),
		DAMAGE: 15,
		ROTATION_OFFSET: CFrame.Angles(0, math.rad(-90), 0),
		DESPAWN_TIME: 30,
		EMBEDDED: true,
	},
	Rat: {
		MAX_DISTANCE: 1000,
		VELOCITY: 100,
		GRAVITY: new Vector3(0, -25, 0),
		DAMAGE: 15,
		ROTATION_OFFSET: CFrame.Angles(0, math.rad(-90), 0),
		DESPAWN_TIME: 30,
		EMBEDDED: true,
	},
	Molotov: {
		MAX_DISTANCE: 1000,
		VELOCITY: 80, // Base velocity (will be multiplied by charge time)
		GRAVITY: new Vector3(0, -35, 0),
		DAMAGE: 5, // Direct impact damage
		ROTATION_OFFSET: CFrame.Angles(0, 0, 0),
		DESPAWN_TIME: 10,
		EMBEDDED: false,
	},
};

export const THROWABLE_CONTAINER = Workspace.Containers.ThrowableContainer;
