import FastCast from "@rbxts/fastcast";
import { ReplicatedStorage, RunService, Workspace } from "@rbxts/services";

export const FirearmCaster = new FastCast();
export const FirearmBehavior = FastCast.newBehavior();

let color;
color = new Color3(0, 0, 0);
if (RunService.IsClient()) {
	color = new Color3(1, 0, 0);
}
if (RunService.IsServer()) {
	color = new Color3(0, 1, 0);
}

export type BulletType = "7.62" | ".45 ACP" | "Fuel";
export type FireMode = "SEMI" | "AUTO";

export const tracerFolder = ReplicatedStorage.CAAssets.tracers;
export const casingFolder = ReplicatedStorage.CAAssets.casings;
export const RANDOM_CASING_DIRECTION = new Vector3(math.random(10, 20), math.random(10, 20), math.random(10, 20));

const firearmSoundFolder = ReplicatedStorage.CAAssets.audio.firearm;

export const PISTOL_SETTINGS = {
	Vag73: {
		FIRE_MODE: "SEMI" as FireMode,
		CAPACITY: 7,
		DAMAGE: 70,
		HEAD_DAMAGE: 100,
		BULLET_TYPE: "7.62",
		COOLDOWN: 0.5,

		GRAVITY: new Vector3(0, -1, 0),
		MAX_DISTANCE: 1000,
		VELOCITY: 100,
		ROTATION_OFFSET: CFrame.Angles(0, 0, 0),
		BULLET_HOLE_DECAL_ID: "rbxassetid://140024170331628",
		BULLET_HOLE_SIZE: new Vector3(0.1, 0.1, 0.01),

		RECOIL_STRENGTH: 30, // Vertical climb velocity
		RECOIL_HORIZONTAL_MAX: 5, // Random range for X axis
		RECOIL_DAMPING: 8,

		FLASH: tracerFolder.Flash,
		TRACER: tracerFolder.Beam1,
		FIRE_SOUND: firearmSoundFolder.Vag73.fire.fire1,
		FIRE_SOUND_RADIUS: 30,

		CASING: casingFolder[762],
		DELAY_BETWEEN_SHOTS: 0,
		NPC_DELAY_BETWEEN_SHOTS: 0.3,
		NPC_RELOAD_TIME: 2,
		NPC_INITIAL_PERCEPTION: 1,
	},
	Taurus: {
		FIRE_MODE: "SEMI" as FireMode,
		CAPACITY: 6,
		DAMAGE: 70,
		HEAD_DAMAGE: 100,
		BULLET_TYPE: "7.62",
		COOLDOWN: 0.5,

		GRAVITY: new Vector3(0, -1, 0),
		MAX_DISTANCE: 1000,
		VELOCITY: 100,
		ROTATION_OFFSET: CFrame.Angles(0, 0, 0),
		BULLET_HOLE_DECAL_ID: "rbxassetid://140024170331628",
		BULLET_HOLE_SIZE: new Vector3(0.1, 0.1, 0.01),

		RECOIL_STRENGTH: 30, // Vertical climb velocity
		RECOIL_HORIZONTAL_MAX: 5, // Random range for X axis
		RECOIL_DAMPING: 8,

		FLASH: tracerFolder.Flash,
		TRACER: tracerFolder.Beam1,
		FIRE_SOUND: firearmSoundFolder.Vag73.fire.fire1,
		FIRE_SOUND_RADIUS: 30,

		CASING: casingFolder[762],
		DELAY_BETWEEN_SHOTS: 0.1,
		NPC_DELAY_BETWEEN_SHOTS: 0.3,
		NPC_RELOAD_TIME: 2,
		NPC_INITIAL_PERCEPTION: 1,
	},
};

export const SMG_SETTINGS = {
	M10: {
		FIRE_MODE: "AUTO" as FireMode,
		CAPACITY: 30,
		DAMAGE: 25,
		HEAD_DAMAGE: 60,
		BULLET_TYPE: ".45 ACP",
		COOLDOWN: 0.5,

		GRAVITY: new Vector3(0, -1, 0),
		MAX_DISTANCE: 1000,
		VELOCITY: 100,
		ROTATION_OFFSET: CFrame.Angles(0, 0, 0),
		BULLET_HOLE_DECAL_ID: "rbxassetid://140024170331628",
		BULLET_HOLE_SIZE: new Vector3(0.1, 0.1, 0.01),

		RECOIL_STRENGTH: 10, // Vertical climb velocity
		RECOIL_HORIZONTAL_MAX: 15, // Random range for X axis
		RECOIL_DAMPING: 8,

		FLASH: tracerFolder.Flash,
		TRACER: tracerFolder.Beam1,
		CASING: casingFolder[45],
		FIRE_SOUND: firearmSoundFolder.M10.fire.fire1,
		FIRE_SOUND_RADIUS: 30,

		DELAY_BETWEEN_SHOTS: 0.1,
		NPC_DELAY_BETWEEN_SHOTS: 0.3,
		NPC_RELOAD_TIME: 3,
		NPC_INITIAL_PERCEPTION: 1,
	},
};

//add spread later
export const RIFLE_SETTINGS = {
	Serpent: {
		FIRE_MODE: "AUTO" as FireMode,
		CAPACITY: 60,
		DAMAGE: 25,
		HEAD_DAMAGE: 60,
		BULLET_TYPE: ".45 ACP",
		COOLDOWN: 0.5,

		GRAVITY: new Vector3(0, -1, 0),
		MAX_DISTANCE: 1000,
		VELOCITY: 100,
		ROTATION_OFFSET: CFrame.Angles(0, 0, 0),
		BULLET_HOLE_DECAL_ID: "rbxassetid://140024170331628",
		BULLET_HOLE_SIZE: new Vector3(0.1, 0.1, 0.01),

		RECOIL_STRENGTH: 10, // Vertical climb velocity
		RECOIL_HORIZONTAL_MAX: 15, // Random range for X axis
		RECOIL_DAMPING: 8,

		FLASH: tracerFolder.Flash,
		TRACER: tracerFolder.Beam1,
		CASING: casingFolder[762],
		FIRE_SOUND: firearmSoundFolder.Serpent.fire.fire1,
		FIRE_SOUND_RADIUS: 30,

		DELAY_BETWEEN_SHOTS: 0.1,
		SPREAD_ANGLE: 2.5, // Degrees of spread
		MUZZLE_OFFSETS: [
			new Vector3(-0.1, 0, 0), // Left barrel
			new Vector3(0.1, 0, 0), // Right barrel
		],
		NPC_DELAY_BETWEEN_SHOTS: 0.16,
		NPC_RELOAD_TIME: 3,
		NPC_INITIAL_PERCEPTION: 1,
	},
};

export const SNIPER_SETTINGS = {
	R50: {
		FIRE_MODE: "AUTO" as FireMode,
		CAPACITY: 6,
		DAMAGE: 30,
		HEAD_DAMAGE: 80,
		BULLET_TYPE: ".45 ACP",
		COOLDOWN: 0.5,

		GRAVITY: new Vector3(0, -1, 0),
		MAX_DISTANCE: 1000,
		VELOCITY: 100,
		ROTATION_OFFSET: CFrame.Angles(0, 0, 0),
		BULLET_HOLE_DECAL_ID: "rbxassetid://140024170331628",
		BULLET_HOLE_SIZE: new Vector3(0.1, 0.1, 0.01),

		RECOIL_STRENGTH: 10, // Vertical climb velocity
		RECOIL_HORIZONTAL_MAX: 15, // Random range for X axis
		RECOIL_DAMPING: 8,

		FLASH: tracerFolder.Flash,
		TRACER: tracerFolder.Beam1,
		CASING: casingFolder[762],
		FIRE_SOUND: firearmSoundFolder.R50.fire.fire1,
		FIRE_SOUND_RADIUS: 30,

		DELAY_BETWEEN_SHOTS: 0.1,
		NPC_DELAY_BETWEEN_SHOTS: 0.3,
		NPC_RELOAD_TIME: 5,
		NPC_INITIAL_PERCEPTION: 1,
	},
};

export const ALL_FIREARM_SETTINGS = {
	...PISTOL_SETTINGS,
	...SMG_SETTINGS,
	...RIFLE_SETTINGS,
	...SNIPER_SETTINGS,
};

export const BULLET_CONTAINER = Workspace.BulletContainer;

export type tracer = Model & {
	Beam: Beam;
	Start: BasePart & {
		Attachment: Attachment;
	};
	End: BasePart & {
		Attachment: Attachment;
	};
};
