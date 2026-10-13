import { ContextActionService, Players, TweenService, Workspace } from "@rbxts/services";
import { Character } from "@rbxts/wcs";
import { isDragging, pointedInstance, pointedItem } from "client/clientAtoms";
import { DoorInstance, toggleNormal, triggerSlightOpen } from "client/components/DoorComponent";
import { RemoteEvents } from "client/network";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { HIGHLIGHTABLE_ITEMS } from "shared/data/items/highlightable";
import { Action } from "shared/data/profile/defaultKeybinds";
import { INTERACTABLE_CHARACTERS } from "shared/data/world/npcs";
import { isAiming } from "shared/sharedAtoms";
import { mouseRaycast } from "shared/utils/input/mouseRaycast";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { setDescendantLocalTransparency } from "shared/utils/world/setDescendant";

let carryingRagdoll: boolean = false;
let draggingRagdoll: boolean = false;
let targetCarryModel: Model | undefined = undefined;

let walkSpeedConn: RBXScriptConnection | undefined;
let autoRotateConn: RBXScriptConnection | undefined;

const MAX_DOOR_INTERACT_DISTANCE = 8;
const TWEEN_INFO = new TweenInfo(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

export const EnvironmentInteractionHandlers: Partial<
	Record<Action, (char: Character, input: InputObject, active: boolean) => void>
> = {
	[Action.EnvironmentInteract]: (char, input, active) => {
		if (!active) return;
		const target = pointedInstance();
		if (!target) return;
		handleDoorInteraction(target, true); // E = Push by default
		handleVentInteraction(target);
	},
	[Action.DoorPull]: (char, input, active) => {
		if (!active) return;
		const target = pointedInstance();
		if (!target) return;
		handleDoorInteraction(target, false); // F = Pull
	},
	[Action.CharacterInteract]: (char, input, active) => {
		// Character interact logic...
	},
	[Action.DragCarryRagdoll]: (char, input, active) => {
		if (!active) return;

		const currentPointedItem = pointedItem(); // Prevent conflicts with Pickups and Dialogue
		// print(pointedItem());
		const interactables = [...INTERACTABLE_CHARACTERS, ...HIGHLIGHTABLE_ITEMS];
		if (currentPointedItem !== undefined && interactables.includes(currentPointedItem)) {
			return;
		}

		const testingCarry = false; // Set to false to test dragging
		const charModel = Players.LocalPlayer.Character as Model;
		const hum = charModel.FindFirstChild("Humanoid") as Humanoid;

		// 3. Drop/Stop Dragging Logic
		if (carryingRagdoll === true || draggingRagdoll === true || targetCarryModel !== undefined) {
			isDragging(false);
			isAiming(false);
			carryingRagdoll = false;
			draggingRagdoll = false;
			ContextActionService.UnbindAction("DisableForward");
			setDescendantLocalTransparency(targetCarryModel!, 0);

			walkSpeedConn?.Disconnect();
			autoRotateConn?.Disconnect();
			walkSpeedConn = undefined;
			autoRotateConn = undefined;

			hum.WalkSpeed = 16;
			hum.AutoRotate = true;
			const vm = Workspace.CurrentCamera?.FindFirstChild("BaseViewmodel") as Model;
			AnimationUtils.stopAnim(vm, "carrying");

			RemoteEvents.requestCarryRagdolledModel(targetCarryModel!, charModel, "drop");
			targetCarryModel = undefined;
		} else {
			const result = mouseRaycast(10); //100 for testing nly
			if (
				!result ||
				!result.Instance ||
				!result.Instance.Parent ||
				!result.Instance.Parent.IsA("Model") ||
				result.Instance.Parent === Workspace
			) {
				return;
			}

			// Carry/Drag Logic
			const target = result.Instance.Parent as Model;

			if (target.GetAttribute("ragdolled") === true) {
				if (testingCarry) {
					carryingRagdoll = true;
					RemoteEvents.requestCarryRagdolledModel(target, charModel, "carry");
					const vm = Workspace.CurrentCamera?.FindFirstChild("BaseViewmodel") as Model;
					AnimationUtils.loadAnim(vm, "carrying", ANIMATION_IDS.noitem.vmCarrying);
					setDescendantLocalTransparency(target, 1);
				} else {
					draggingRagdoll = true;
					isAiming(true); //to stop weird head behaviors

					const vm = Workspace.CurrentCamera?.FindFirstChild("BaseViewmodel") as Model;
					AnimationUtils.loadAnim(vm, "carrying", ANIMATION_IDS.noitem.vmDragging);

					// APPLY Dragging restrictions
					hum.WalkSpeed = 4;

					walkSpeedConn = hum.GetPropertyChangedSignal("WalkSpeed").Connect(() => {
						hum.WalkSpeed = 4;
					});
					autoRotateConn = hum.GetPropertyChangedSignal("AutoRotate").Connect(() => {
						hum.AutoRotate = false;
					});

					hum.AutoRotate = false;
					ContextActionService.BindAction(
						"DisableForward",
						() => Enum.ContextActionResult.Sink,
						false,
						Enum.KeyCode.W,
					); // Sinks forward input entirely
					isDragging(true);
					RemoteEvents.requestCarryRagdolledModel(target, charModel, "drag");
				}
				targetCarryModel = target;
			}
		}
	},
	[Action.SitUnsit]: (char, input, active) => {
		if (!active) return;
		// print(pointedInstance(), pointedItem(), pointedInstance()?.Name.sub(7));
		const humanoid =
			(Players.LocalPlayer.Character?.FindFirstChild("Humanoid") as Humanoid) ||
			(Players.LocalPlayer.CharacterAdded.Wait()[0].FindFirstChild("Humanoid") as Humanoid);
		if (humanoid.Sit) {
			const seat = humanoid.SeatPart as Seat;
			seat.Disabled = true;
			humanoid.Sit = false;
		} else if (pointedInstance() && pointedInstance()?.IsA("Seat")) {
			// print(pointedInstance(), pointedItem());

			const seat = pointedInstance() as Seat;
			seat.Disabled = false;
			seat.Sit(humanoid);
		}
	},
};

function handleDoorInteraction(target: Instance, isPush: boolean) {
	if (target.Name !== "OpenHitbox" && target.Name !== "OpenSlightHitbox") return;

	const doorModel = target.Parent as DoorInstance;
	if (!doorModel || !doorModel.IsA("Model")) return;

	// Distance Check
	const localPlayer = Players.LocalPlayer;
	const char = localPlayer.Character;
	if (!char || !char.PrimaryPart) return;

	const distance = char.PrimaryPart.Position.sub((target as BasePart).Position).Magnitude;
	if (distance > MAX_DOOR_INTERACT_DISTANCE) return;

	// Trigger Unified Functions
	if (target.Name === "OpenHitbox") {
		toggleNormal(doorModel, isPush);
	} else if (target.Name === "OpenSlightHitbox") {
		triggerSlightOpen(doorModel, isPush);
	}
}

function handleVentInteraction(target: Instance) {
	if (target.Name !== "Vent" && target.Name !== "VentOpening") return;
	const ventModel = target.Parent as Model;
	if (!ventModel || !ventModel.PrimaryPart) return;

	const char = Players.LocalPlayer.Character;
	if (!char || !char.PrimaryPart) return;

	if (target.Name === "Vent") {
		const isOpen = ventModel.GetAttribute("Open") as boolean;

		const offsetMagnitude = 3;

		if (isOpen) {
			ventModel.SetAttribute("Open", false);

			const closedCFrame = ventModel.GetAttribute("ClosedCFrame") as CFrame;
			const tween = TweenService.Create(ventModel.PrimaryPart, TWEEN_INFO, { CFrame: closedCFrame }); // Tween back to the original closed position
			tween.Play();
			RemoteEvents.ventInteract.fire(ventModel, closedCFrame);
		} else {
			ventModel.SetAttribute("Open", true);

			const ventCFrame = ventModel.GetPivot();
			const toPlayer = char.PrimaryPart.Position.sub(ventCFrame.Position); // Calculate vector pointing from the vent to the player
			const localToPlayer = ventCFrame.VectorToObjectSpace(toPlayer); // Transform the player vector into the vent's local object space

			const isPlayerInFront = localToPlayer.Z < 0; // Restrict left/right (X). Determine if player is standing on the LookVector side (Forward/Backward). If localToPlayer.Z < 0, player is in front. If > 0, player is behind.

			// Determine the local direction vector (always parallel to LookVector, never RightVector)
			// If player is in front, push it away/pull it towards depending on your asset's design.
			const localDirection = isPlayerInFront
				? new Vector3(0, 0.2, -offsetMagnitude) //add 0.2 vertically
				: new Vector3(0, 0.2, offsetMagnitude);

			const targetCFrame = ventCFrame.ToWorldSpace(new CFrame(localDirection)); // Convert the chosen local translation back into a world CFrame

			const tween = TweenService.Create(ventModel.PrimaryPart, TWEEN_INFO, { CFrame: targetCFrame });
			tween.Play();
			RemoteEvents.ventInteract.fire(ventModel, targetCFrame);
		}
	} else if (target.Name === "VentOpening") {
		//TODO PLAY SOUND
		const isOpen = ventModel.GetAttribute("Open") as boolean;
		if (isOpen) {
			ventModel.SetAttribute("Open", false);
			const closedCFrame = ventModel.GetAttribute("ClosedCFrame") as CFrame;
			const tween = TweenService.Create(ventModel.PrimaryPart, TWEEN_INFO, { CFrame: closedCFrame }); // Tween back to the original closed position
			tween.Play();
			RemoteEvents.ventInteract.fire(ventModel, closedCFrame);
		} else {
			ventModel.SetAttribute("Open", true);

			const openDir = new Vector3(0, 0, 3.5);

			const ventCFrame = ventModel.GetPivot();
			const targetCFrame = ventCFrame.ToWorldSpace(new CFrame(openDir));

			const tween = TweenService.Create(ventModel.PrimaryPart, TWEEN_INFO, { CFrame: targetCFrame });
			tween.Play();
			RemoteEvents.ventInteract.fire(ventModel, targetCFrame);
		}
	}
}
