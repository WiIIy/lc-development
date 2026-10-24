import { Controller, OnRender, OnStart } from "@flamework/core";
import { Players, Workspace } from "@rbxts/services";
import { MeleeLight } from "shared/skills/base/light";
import { MeleeHeavy } from "shared/skills/base/heavy";
import { MeleeBlock } from "shared/skills/base/block";
import { MeleeShove } from "shared/skills/base/shove";
import { getCurrentWCS_Character } from "shared/utils/ecs/getCurrentWcsCharacter";

export type MovementState = "idle" | "advancing" | "retreating" | "strafingleft" | "strafingright";
export type EnvironmentState = "plainsight" | "hidden";
export type BodyState = "crouching" | "standing";
export type SpeedState = "walking" | "sprinting" | "dashing";
export type ActionState = "idle" | "meleelight" | "meleeheavy" | "melee";

interface StateMap {
	movementState: MovementState;
	environmentState: EnvironmentState;
	bodyState: BodyState;
	speedState: SpeedState;
	actionState: ActionState;
}

type StateKey = keyof StateMap;
type StateListener<K extends StateKey> = (newState: StateMap[K], oldState: StateMap[K]) => void;

// Tweak to taste.
const MOVE_DEADZONE = 0.1; // MoveDirection magnitude under this counts as standing still
const FORWARD_THRESHOLD = 0.5; // forward/back component needed to count as advancing/retreating

@Controller({})
export class PlayerStateController implements OnStart, OnRender {
	movementState: MovementState = "idle";
	environmentState: EnvironmentState = "plainsight";
	bodyState: BodyState = "standing";
	speedState: SpeedState = "walking";
	actionState: ActionState = "idle";

	private humanoid?: Humanoid;
	private listeners = new Map<StateKey, Set<(n: never, o: never) => void>>();

	onStart(): void {
		const player = Players.LocalPlayer;
		if (player.Character) this.bindCharacter(player.Character);
		player.CharacterAdded.Connect((char) => this.bindCharacter(char));
	}

	onRender(dt: number): void {
		this.updateMovementState();
		this.updateActionState();
		// TODO: bodyState (crouch), speedState (sprint/dash), environmentState (hidden)
	}

	// ---------- Setters ----------

	setMovementState(state: MovementState) {
		this.set("movementState", state);
	}

	setEnvironmentState(state: EnvironmentState) {
		this.set("environmentState", state);
	}

	setBodyState(state: BodyState) {
		this.set("bodyState", state);
	}

	setSpeedState(state: SpeedState) {
		this.set("speedState", state);
	}

	setActionState(state: ActionState) {
		this.set("actionState", state);
	}

	// ---------- Getters / helpers ----------

	isMeleeing(): boolean {
		return this.actionState !== "idle";
	}

	isStrafing(): boolean {
		return this.movementState === "strafingleft" || this.movementState === "strafingright";
	}

	/** Subscribe to changes of one state. Returns a disconnect function. */
	onChange<K extends StateKey>(key: K, listener: StateListener<K>): () => void {
		let set = this.listeners.get(key);
		if (!set) {
			set = new Set();
			this.listeners.set(key, set);
		}
		const fn = listener as unknown as (n: never, o: never) => void;
		set.add(fn);
		return () => set!.delete(fn);
	}

	// ---------- Internals ----------

	private set<K extends StateKey>(key: K, value: StateMap[K]) {
		const old = this[key] as StateMap[K];
		if (old === value) return;
		(this as unknown as StateMap)[key] = value;

		const set = this.listeners.get(key);
		if (set) {
			for (const fn of set) (fn as unknown as StateListener<K>)(value, old);
		}
	}

	private bindCharacter(char: Model) {
		this.humanoid = char.WaitForChild("Humanoid") as Humanoid;
		this.setMovementState("idle");
		this.setActionState("idle");
	}

	/** Flattens a vector onto the XZ plane and normalizes it. */
	private flatten(v: Vector3): Vector3 {
		const flat = new Vector3(v.X, 0, v.Z);
		return flat.Magnitude > 0 ? flat.Unit : Vector3.zero;
	}

	private updateMovementState() {
		const humanoid = this.humanoid;
		const cam = Workspace.CurrentCamera;
		if (!humanoid || !cam) return;

		const moveDir = humanoid.MoveDirection;
		if (moveDir.Magnitude < MOVE_DEADZONE) {
			this.setMovementState("idle");
			return;
		}

		// Compare input direction against where the player is *looking* (camera),
		// not where the character model is facing.
		const look = this.flatten(cam.CFrame.LookVector);
		const right = this.flatten(cam.CFrame.RightVector);
		const dir = this.flatten(moveDir);

		const forward = dir.Dot(look);
		const side = dir.Dot(right);

		// Forward/back wins on diagonals (W+A is still "advancing").
		if (forward >= FORWARD_THRESHOLD) {
			this.setMovementState("advancing");
		} else if (forward <= -FORWARD_THRESHOLD) {
			this.setMovementState("retreating");
		} else {
			this.setMovementState(side > 0 ? "strafingright" : "strafingleft");
		}
	}

	private updateActionState() {
		const wcsChar = getCurrentWCS_Character();
		if (!wcsChar) return;

		// Polls the WCS skills' active state so this stays in sync no matter
		// what triggered them (input, AI, server, etc).
		const heavy = wcsChar.GetSkillFromConstructor(MeleeHeavy)?.GetState().IsActive;
		if (heavy) return this.setActionState("meleeheavy");

		const light = wcsChar.GetSkillFromConstructor(MeleeLight)?.GetState().IsActive;
		if (light) return this.setActionState("meleelight");

		// Generic "melee": other melee-category skills (block / shove).
		const block = wcsChar.GetSkillFromConstructor(MeleeBlock)?.GetState().IsActive;
		const shove = wcsChar.GetSkillFromConstructor(MeleeShove)?.GetState().IsActive;
		if (block || shove) return this.setActionState("melee");

		this.setActionState("idle");
	}
}
