import { Controller, OnRender, OnStart } from "@flamework/core";
import { Players, Workspace } from "@rbxts/services";
import { MeleeLight } from "shared/skills/base/light";
import { MeleeHeavy } from "shared/skills/base/heavy";
import { MeleeBlock } from "shared/skills/base/block";
import { MeleeShove } from "shared/skills/base/shove";
import { getCurrentWCS_Character } from "shared/utils/ecs/getCurrentWcsCharacter";
import { observer, ref } from "@willy/jecs-utils";
import { subscribe } from "@rbxts/charm";

import Components from "shared/components/components";
import {
	currentStaminaAtom,
	maxStaminaAtom,
	currentHealthAtom,
	maxHealthAtom,
	currentBloodAtom,
	maxBloodAtom,
	activeStatusEffectsAtom,
	playerActionAtom,
} from "client/clientAtoms";
import world from "shared/world";
import { ClientContext } from "shared/ClientContext";
import { RemoteEvents } from "client/network";

type StateKey = keyof PlayerBehaviorState;
type StateListener<K extends StateKey> = (newState: PlayerBehaviorState[K], oldState: PlayerBehaviorState[K]) => void;

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

	constructor() {
		ClientContext.PlayerStateTrackerController = this;
	}

	onStart(): void {
		const player = Players.LocalPlayer;
		if (player.Character) this.bindCharacter(player.Character);
		player.CharacterAdded.Connect((char) => this.bindCharacter(char));

		const playerObserver = observer(world.query(Components.Player), (e) => {
			const player = world.get(e, Components.Player);

			if (player === Players.LocalPlayer) {
				ref.set(Players.LocalPlayer, e);
			}
		});

		const staminaObserver = observer(world.query(Components.Stamina), (e) => {
			if (e !== ref.find(Players.LocalPlayer)) return;

			const currStam = world.get(e, Components.Stamina)?.current;
			const maxStam = world.get(e, Components.Stamina)?.max;
			if (currStam === undefined || maxStam === undefined) return;
			currentStaminaAtom(currStam);
			maxStaminaAtom(maxStam);
		});

		const healthObserver = observer(world.query(Components.Health), (e) => {
			if (e !== ref.find(Players.LocalPlayer)) return;

			const currHealth = world.get(e, Components.Health)?.current;
			const maxHealth = world.get(e, Components.Health)?.max;
			if (currHealth === undefined || maxHealth === undefined) return;
			currentHealthAtom(currHealth);
			maxHealthAtom(maxHealth);
		});

		const bloodObserver = observer(world.query(Components.Blood), (e) => {
			if (e !== ref.find(Players.LocalPlayer)) return;

			const currStam = world.get(e, Components.Blood)?.current;
			const maxStam = world.get(e, Components.Blood)?.max;
			if (currStam === undefined || maxStam === undefined) return;
			currentBloodAtom(currStam);
			maxBloodAtom(maxStam);
		});

		const activeStatusEffectsObserver = observer(world.query(Components.ActiveStatusEffects), (e) => {
			if (e !== ref.find(Players.LocalPlayer)) return;

			const statusEffects = world.get(e, Components.ActiveStatusEffects);
			if (statusEffects === undefined) return;
			activeStatusEffectsAtom(statusEffects || []);
		});

		subscribe(playerActionAtom, (now, prev) => {
			print("wah");
			RemoteEvents.updatePlayerBehavior(now);
		});
	}

	onRender(dt: number): void {
		this.updateMovementState();
		// TODO: bodyState (crouch), speedState (sprint/dash), environmentState (hidden)
	}

	// ---------- Setters ----------

	setMovementState(state: MovementState) {
		this.set("movementState", state);
		this.updateAtomField("movementState", state);
	}

	setEnvironmentState(state: EnvironmentState) {
		this.set("environmentState", state);
		this.updateAtomField("environmentState", state);
	}

	setBodyState(state: BodyState) {
		this.set("bodyState", state);
		this.updateAtomField("bodyState", state);
	}

	setSpeedState(state: SpeedState) {
		this.set("speedState", state);
		this.updateAtomField("speedState", state);
	}

	setActionState(state: ActionState) {
		this.set("actionState", state);
		this.updateAtomField("actionState", state);
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

	private set<K extends StateKey>(key: K, value: PlayerBehaviorState[K]) {
		const old = this[key] as PlayerBehaviorState[K];
		if (old === value) return;
		(this as unknown as PlayerBehaviorState)[key] = value;

		const set = this.listeners.get(key);
		if (set) {
			for (const fn of set) (fn as unknown as StateListener<K>)(value, old);
		}
	}

	/** Helper to keep atom updates dry across all property setters */
	private updateAtomField<K extends StateKey>(key: K, value: PlayerBehaviorState[K]) {
		const prev = playerActionAtom();
		if (prev[key] === value) return; // Prevent redundant atom updates if value is unchanged

		playerActionAtom({
			actionState: key === "actionState" ? (value as ActionState) : prev.actionState,
			bodyState: key === "bodyState" ? (value as BodyState) : prev.bodyState,
			movementState: key === "movementState" ? (value as MovementState) : prev.movementState,
			environmentState: key === "environmentState" ? (value as EnvironmentState) : prev.environmentState,
			speedState: key === "speedState" ? (value as SpeedState) : prev.speedState,
		});
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

		const look = this.flatten(cam.CFrame.LookVector);
		const right = this.flatten(cam.CFrame.RightVector);
		const dir = this.flatten(moveDir);

		const forward = dir.Dot(look);
		const side = dir.Dot(right);

		if (forward >= FORWARD_THRESHOLD) {
			this.setMovementState("movingforward");
		} else if (forward <= -FORWARD_THRESHOLD) {
			this.setMovementState("movingbackward");
		} else {
			this.setMovementState(side > 0 ? "strafingright" : "strafingleft");
		}
	}
}
