import {
	ContextActionService,
	Players,
	ReplicatedStorage,
	RunService,
	TweenService,
	UserInputService,
	Workspace,
} from "@rbxts/services";
import { Character } from "@rbxts/wcs";
// import { Crouch } from "shared/skills/crouch";
import { ClientContext } from "shared/ClientContext";
import { pointedItem, isDragging, pointedInstance, isThirdPerson, hideViewmodel } from "client/clientAtoms";
import { RemoteEvents } from "client/network";
import { DossierStore } from "client/ui/stores/DossierStore";
import { InventoryStore } from "client/ui/stores/InventoryStore";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { HIGHLIGHTABLE_ITEMS } from "shared/data/items/highlightable";
import { KEYBINDS, inputIsKey, Action } from "shared/data/profile/defaultKeybinds";
import { INTERACTABLE_CHARACTERS } from "shared/data/world/npcs";
import { antlerDebuggerDisplaying, debugMenuDisplaying, isAiming } from "shared/sharedAtoms";
import { MeleeWeapon, Dash } from "shared/skills";
import { Mark } from "shared/skills/mark";
import { mouseRaycast } from "shared/utils/input/mouseRaycast";
import { getCoverSpotsInRadius } from "shared/utils/npc/pathfinding/getCoverSpotInRadius";
import { sayMonologue } from "shared/utils/ui/sayMonologue";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { setDescendantLocalTransparency } from "shared/utils/world/setDescendant";
import { generateDossier } from "client/clientutils/generateDossier";
import { DoorInstance, toggleNormal, triggerSlightOpen } from "client/components/DoorComponent";
import { hideUnhideParts } from "client/clientutils/hideUnhideParts";
import {
	BaseInteractionHandlers,
	GunInteractionHandlers,
	EnvironmentInteractionHandlers,
	AntlerHandlers,
	NeedlegunHandlers,
	WalkmanHandlers,
	DroneHandlers,
	FireItemHandlers,
	ThrowableHandlers,
	DossierHandlers,
	UIHandlers,
} from "client/inputhandlers";
import { getCurrentWCS_Character } from "shared/utils/ecs/getCurrentWcsCharacter";
import { getMouseIconEnabled } from "shared/utils/ui/getMouseIconEnabled";

// Helper to handle Left/Right modifier key variants seamlessly
function isModifierActive(keyCode: Enum.KeyCode): boolean {
	if (keyCode === Enum.KeyCode.LeftShift || keyCode === Enum.KeyCode.RightShift) {
		return (
			UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) || UserInputService.IsKeyDown(Enum.KeyCode.RightShift)
		);
	}
	if (keyCode === Enum.KeyCode.LeftControl || keyCode === Enum.KeyCode.RightControl) {
		return (
			UserInputService.IsKeyDown(Enum.KeyCode.LeftControl) ||
			UserInputService.IsKeyDown(Enum.KeyCode.RightControl)
		);
	}
	if (keyCode === Enum.KeyCode.LeftAlt || keyCode === Enum.KeyCode.RightAlt) {
		return UserInputService.IsKeyDown(Enum.KeyCode.LeftAlt) || UserInputService.IsKeyDown(Enum.KeyCode.RightAlt);
	}
	return UserInputService.IsKeyDown(keyCode);
}

export function isActionBound(action: Action, input: InputObject): boolean {
	const binds = KEYBINDS[action];
	if (!binds || binds.size() === 0) return false;

	// 1. Check if the triggering input belongs to this action's bound keys
	const matchesInput = binds.some((key) => inputIsKey(input, key));
	if (!matchesInput) return false;

	// 2. Check that ALL required keys in this bind are held down
	for (const key of binds) {
		if (inputIsKey(input, key)) continue;

		if (typeIs(key, "EnumItem") && key.EnumType === Enum.KeyCode) {
			if (!isModifierActive(key as Enum.KeyCode)) {
				return false;
			}
		}

		if (typeIs(key, "EnumItem") && key.EnumType === Enum.UserInputType) {
			if (!UserInputService.IsMouseButtonPressed(key as Enum.UserInputType)) {
				return false;
			}
		}
	}

	// 3. Prevent single-key binds from firing if unneeded modifiers (Shift/Ctrl/Alt) are pressed
	const hasShift = binds.some((k) => k === Enum.KeyCode.LeftShift || k === Enum.KeyCode.RightShift);
	const hasCtrl = binds.some((k) => k === Enum.KeyCode.LeftControl || k === Enum.KeyCode.RightControl);
	const hasAlt = binds.some((k) => k === Enum.KeyCode.LeftAlt || k === Enum.KeyCode.RightAlt);

	const shiftPressed =
		UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) || UserInputService.IsKeyDown(Enum.KeyCode.RightShift);
	const ctrlPressed =
		UserInputService.IsKeyDown(Enum.KeyCode.LeftControl) || UserInputService.IsKeyDown(Enum.KeyCode.RightControl);
	const altPressed =
		UserInputService.IsKeyDown(Enum.KeyCode.LeftAlt) || UserInputService.IsKeyDown(Enum.KeyCode.RightAlt);

	if (shiftPressed && !hasShift) return false;
	if (ctrlPressed && !hasCtrl) return false;
	if (altPressed && !hasAlt) return false;

	return true;
}

// ----------------- Logic Handlers -----------------
const ActionHandlers = {
	...BaseInteractionHandlers,
	...GunInteractionHandlers,
	...EnvironmentInteractionHandlers,
	...AntlerHandlers,
	...NeedlegunHandlers,
	...WalkmanHandlers,
	...DroneHandlers,
	...FireItemHandlers,
	...ThrowableHandlers,
	...DossierHandlers,
	...UIHandlers,

	[Action.GrapplingHook]: (char, input, active) => {
		// if (!active) return;
		// const grappleSkill = char.GetSkillFromConstructor(GrapplingHook);
		// grappleSkill?.Hook();
	},
	[Action.Chainsaw]: (char, input, active) => {
		// if (!active) return;
		// const chainsawSkill = char.GetSkillFromConstructor(Chainsaw);
		// if (!chainsawSkill) return;
		// // chainsawSkill.dbg();
		// // return;
		// if (chainsawSkill.running) {
		// 	chainsawSkill.stop();
		// } else if (chainsawSkill.revCount < chainsawSkill.revRequired) {
		// 	chainsawSkill.rev();
		// }
	},

	//reserved keys for UI

	[Action.DebugTracks]: (char, input, active) => {
		if (!active) return;
		const animator = AnimationUtils.getAnimator(Players.LocalPlayer.Character!);
		const vm = Workspace.CurrentCamera!.FindFirstChild("BaseViewmodel") as Model;
		const animator2 = AnimationUtils.getAnimator(vm);
		const tracks = animator?.GetPlayingAnimationTracks();
		const vmtracks = animator2?.GetPlayingAnimationTracks();
		print("===Character===");
		tracks?.forEach((track) => {
			const animId = track.Animation?.AnimationId;
			const id = animId?.split("=")[1];

			print(id, track.Animation?.Name, track.Priority);
		});
		print("===Viewmodel===");
		vmtracks?.forEach((track) => {
			const animId = track.Animation?.AnimationId;
			const id = animId?.split("=")[1];

			print(id, track.Animation?.Name, track.Priority);
		});
	},
	[Action.DebugMenu]: (char, input, active) => {
		if (active) {
			debugMenuDisplaying(!debugMenuDisplaying);
			UserInputService.MouseIconEnabled = getMouseIconEnabled();
		}
	},
	[Action.DebugMenuAlt]: (char, input, active) => {
		if (active) {
			debugMenuDisplaying(!debugMenuDisplaying);
			UserInputService.MouseIconEnabled = getMouseIconEnabled();
		}
	},
	[Action.DefaultCamera]: (char, input, active) => {
		if (!active) return; //only fires on inputbegan
		print("?");
		if (!isThirdPerson()) {
			//go to third person

			isThirdPerson(true);

			if (ClientContext.ViewmodelController) {
				ClientContext.ViewmodelController.camera = Workspace.CurrentCamera!;
			}

			const hum =
				(Players.LocalPlayer.Character?.FindFirstChild("Humanoid") as Humanoid) ||
				(Players.LocalPlayer.CharacterAdded.Wait()[0].FindFirstChild("Humanoid") as Humanoid);

			Workspace.CurrentCamera!.CameraSubject = hum;
			Workspace.CurrentCamera!.CameraType = Enum.CameraType.Custom;
			hideUnhideParts(Players.LocalPlayer.Character!, false);
		} else {
			//make it first person
			isThirdPerson(false);

			if (ClientContext.ViewmodelController) {
				ClientContext.ViewmodelController.camera = Workspace.CurrentCamera!;
			}
			Workspace.CurrentCamera!.CameraType = Enum.CameraType.Scriptable;
			hideUnhideParts(Players.LocalPlayer.Character!, true);
		}
	},
	[Action.LoadoutSelector]: (char, input, active) => {},
	[Action.HideViewmodel]: (char, input, active) => {
		if (!active) return;

		const prev = hideViewmodel();
		const nextState = !prev;
		hideViewmodel(nextState);

		const cam = Workspace.CurrentCamera;
		if (!cam) return;
		const vm = cam.FindFirstChild("BaseViewmodel") as Model | undefined;
		if (!vm) return;

		for (const desc of vm.GetDescendants()) {
			if (desc.IsA("BasePart")) {
				desc.LocalTransparencyModifier = nextState ? 1 : 0;
			}
		}
	},
	[Action.SeeEnemyHidingSpots]: (char, input, active) => {
		if (!active) return;

		getCoverSpotsInRadius(Players.LocalPlayer, undefined);
	},
} as Record<Action, (char: Character, input: InputObject, active: boolean) => void>;;

// ----------------- Input Listener -----------------
function handleInput(input: InputObject, gameProcessed: boolean, isInputBegan: boolean) {
	// print(input.KeyCode, input.UserInputState, input.UserInputType)
	if (gameProcessed) return;
	// print("no proc")

	const character = getCurrentWCS_Character();
	if (!character) return;

	// 1. Gather all actions that match the current input state
	const matchedActions: Action[] = [];
	for (const [actionName] of pairs(KEYBINDS)) {
		const action = actionName as Action;
		if (isActionBound(action, input)) {
			matchedActions.push(action);
		}
	}
	// print("matched", matchedActions)

	if (matchedActions.size() === 0) return;

	// 2. Sort actions so multi-key combos (Shift + LMB) run before single keys (LMB)
	matchedActions.sort((a, b) => {
		const sizeA = KEYBINDS[a]?.size() ?? 0;
		const sizeB = KEYBINDS[b]?.size() ?? 0;

		if (sizeA !== sizeB) {
			return sizeA > sizeB;
		}
		return false;
	});

	// 3. Execute handlers for all matching actions that have defined logic
	for (const action of matchedActions) {
		const handler = ActionHandlers[action];
		if (handler) {
			handler(character, input, isInputBegan);
		}
	}
}

UserInputService.InputBegan.Connect((input, gp) => handleInput(input, gp, true));
UserInputService.InputEnded.Connect((input, gp) => handleInput(input, gp, false));
