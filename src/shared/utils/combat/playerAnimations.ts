// CLIENT: animation playback and local swing gating for the player's melee skills.
// The server makes the real decision. These checks only stop animations it would refuse anyway.
import { PlayerMeleeWeaponStats } from "shared/data/items/playerMeleeWeaponStats";

export const PLAYER_WEAPON_ATTRIBUTE = "MeleeWeapon"; // written by PlayerCombatSystem
export const PARRY_DISABLED_ATTRIBUTE = "ParryDisabled";

const BLOCK_FADE = 0.15;
const MAX_SWING_SECONDS = 2;

type State = {
	character: Model;
	tracks: Map<string, AnimationTrack>;
	readyAt: { [attack: string]: number };
	swinging: number; // id of the current swing, 0 = none
	blockTrack?: AnimationTrack;
};

let state: State | undefined;
let lastSwing = 0;

function getState(character: Model): State {
	if (state === undefined || state.character !== character) {
		// new character: forget everything, so a respawn can't leave a stuck block or swing
		state = { character, tracks: new Map<string, AnimationTrack>(), readyAt: {}, swinging: 0 };
	}
	return state;
}

export function getClientWeapon(character: Model): PlayerMeleeWeapon | undefined {
	const id = character.GetAttribute(PLAYER_WEAPON_ATTRIBUTE);
	if (!typeIs(id, "string")) {
		warn(`[playerAnimations] no "${PLAYER_WEAPON_ATTRIBUTE}" attribute. Is a weapon equipped on the server?`);
		return undefined;
	}
	return PlayerMeleeWeaponStats[id];
}

function getTrack(current: State, animationId: string): AnimationTrack | undefined {
	const cached = current.tracks.get(animationId);
	if (cached !== undefined) return cached;
	const animator = current.character.FindFirstChildOfClass("Humanoid")?.FindFirstChildOfClass("Animator");
	if (animator === undefined) {
		warn("[playerAnimations] character has no Animator");
		return undefined;
	}
	const animation = new Instance("Animation");
	animation.AnimationId = animationId;
	const track = animator.LoadAnimation(animation);
	current.tracks.set(animationId, track);
	return track;
}

export function preloadWeapon(character: Model) {
	const weapon = getClientWeapon(character);
	if (weapon === undefined) return;
	const current = getState(character);
	const { light, heavy, shove, block } = weapon.animations;
	for (const id of [light, heavy, shove, block]) getTrack(current, id);
}

/** `onStart` tells the server first, so the swing exists there before the hit can arrive */
export function playSwing(
	character: Model,
	attack: PlayerAttackName,
	onStart: () => void,
	onHit: () => void,
	onFinish: () => void,
) {
	const weapon = getClientWeapon(character);
	if (weapon === undefined) return;
	const current = getState(character);
	const now = os.clock();
	if (current.swinging !== 0 || current.blockTrack !== undefined) return;
	if (now < (current.readyAt[attack] ?? 0)) return;
	const track = getTrack(current, weapon.animations[attack]);
	if (track === undefined) return;

	lastSwing += 1;
	const id = lastSwing;
	current.swinging = id;
	current.readyAt[attack] = now + weapon[attack].cooldown;

	const connections: RBXScriptConnection[] = [];
	const finish = () => {
		if (current.swinging !== id) return;
		current.swinging = 0;
		for (const connection of connections) connection.Disconnect();
		onFinish();
	};
	let fired = false;
	connections.push(
		track.GetMarkerReachedSignal("hit").Connect(() => {
			if (fired || current.swinging !== id) return;
			fired = true;
			onHit();
		}),
		track.Stopped.Connect(() => {
			if (!fired) warn(`[playerAnimations] ${attack} stopped before its "hit" marker`);
			finish();
		}),
		track.DidLoop.Connect(() => {
			warn(`[playerAnimations] ${attack} animation is looping, turn Looped off`);
			track.Stop();
		}),
	);
	task.delay(MAX_SWING_SECONDS, () => {
		if (current.swinging !== id) return;
		track.Stop();
		finish();
	});

	onStart();
	track.Priority = Enum.AnimationPriority.Action;
	track.Looped = false;
	track.Play();
}

export function playBlock(character: Model, onStart: () => void) {
	const weapon = getClientWeapon(character);
	if (weapon === undefined) return;
	const current = getState(character);
	if (current.swinging !== 0 || current.blockTrack !== undefined) return;
	if (character.GetAttribute(PARRY_DISABLED_ATTRIBUTE) === true) return;
	const track = getTrack(current, weapon.animations.block);
	if (track === undefined) return;

	current.blockTrack = track;
	onStart();
	track.Priority = Enum.AnimationPriority.Action;
	track.Looped = true;
	track.Play(BLOCK_FADE);
}

export function stopBlock(character: Model): boolean {
	const current = getState(character);
	if (current.blockTrack === undefined) return false;
	current.blockTrack.Stop(BLOCK_FADE);
	current.blockTrack = undefined;
	return true;
}
