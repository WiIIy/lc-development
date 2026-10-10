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
import { Crouch } from "shared/skills/crouch";
import { Antler } from "shared/skills/antler";
import { ClientContext } from "shared/ClientContext";
import { dossierMenuOpen, gameMenuOpen, dossierBuildingOpen, dossierEditingOpen, pointedItem, isDragging, pointedInstance, isThirdPerson, hideViewmodel } from "client/clientAtoms";
import { RemoteEvents } from "client/network";
import { DossierStore } from "client/ui/stores/DossierStore";
import { InventoryStore } from "client/ui/stores/InventoryStore";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { HIGHLIGHTABLE_ITEMS } from "shared/data/items/highlightable";
import { KEYBINDS, inputIsKey, Action } from "shared/data/profile/defaultKeybinds";
import { INTERACTABLE_CHARACTERS } from "shared/data/world/npcs";
import { antlerDebuggerDisplaying, isAiming } from "shared/sharedAtoms";
import { Throw, MeleeWeapon, Parry, Dash, GrapplingHook, Chainsaw, Molotov, Jerrycan, Lighter, Pistol, Sniper, Smg } from "shared/skills";
import { Mark } from "shared/skills/mark";
import { mouseRaycast } from "shared/utils/input/mouseRaycast";
import { getCoverSpotsInRadius } from "shared/utils/npc/pathfinding/getCoverSpotInRadius";
import { sayMonologue } from "shared/utils/ui/sayMonologue";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { setDescendantLocalTransparency } from "shared/utils/world/setDescendant";
import { generateDossier } from "client/clientutils/generateDossier";
import { DoorInstance, toggleNormal, triggerSlightOpen } from "client/components/DoorComponent";
import { hideUnhideParts } from "client/clientutils/hideUnhideParts";

let dossierGenerated: boolean;
let camConn: RBXScriptConnection;
let clone: typeof ReplicatedStorage.CAAssets.misc.dossierTemplate.DossierUIBackground;
dossierGenerated = false;
let carryingRagdoll: boolean = false;
let draggingRagdoll: boolean = false;
let targetCarryModel: Model | undefined = undefined;

let walkSpeedConn: RBXScriptConnection | undefined;
let autoRotateConn: RBXScriptConnection | undefined;

let debugMenuDisplaying: boolean = false;

export function getDossierGenerated(): boolean {
	return dossierGenerated;
}

export function setDossierGenerated(to: boolean){
	dossierGenerated = to;
}

export function getMouseIconEnabled(): boolean {
	return (
		debugMenuDisplaying ||
		antlerDebuggerDisplaying() ||
		dossierMenuOpen() ||
		gameMenuOpen() ||
		dossierBuildingOpen() ||
		dossierEditingOpen()
	);
}

const MAX_TILT_DEGREES = 10; // Max tilt in either direction
const SWAY_SPEED = 0.1; // Smoothness (lower is smoother)

let tiltY = 0;
let tiltX = 0;

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export function getCurrentWCS_Character() {
	const characterModel = Players.LocalPlayer.Character;
	if (!characterModel) return undefined;
	return Character.GetCharacterFromInstance(characterModel);
}

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

const MAX_DOOR_INTERACT_DISTANCE = 8;

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

const TWEEN_INFO = new TweenInfo(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

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

// ----------------- Logic Handlers -----------------
const ActionHandlers: Record<Action, (char: Character, input: InputObject, active: boolean) => void> = {
	[Action.LightAttack]: (char, input, active) => {
		if (!active) return;

		// dont attack if throw mode active
		const throwSkill = char.GetSkillFromConstructor(Throw);
		if (throwSkill?.active) return;

		char.GetSkillFromConstructor(MeleeWeapon)?.lightAttack();
	},
	[Action.Crouch]: (char, input, active) => {
		if (!active) return;

		const humanoid =
			(Players.LocalPlayer.Character?.FindFirstChild("Humanoid") as Humanoid) ||
			(Players.LocalPlayer.CharacterAdded.Wait()[0].FindFirstChild("Humanoid") as Humanoid);

		if (humanoid.Sit) {
			return;
		}
		const crouchSkill = char.GetSkillFromConstructor(Crouch);
		if (!crouchSkill) return;
		const isCrouching = crouchSkill.crouching;
		if (!isCrouching) {
			crouchSkill.StartCrouch();
		} else {
			crouchSkill.StopCrouch();
		}
	},

	[Action.ThrowItem]: (char, input, active) => {
		if (!active) return;

		char.GetSkillFromConstructor(Throw)?.Throw();
	},

	[Action.ThrowMode]: (char, input, active) => {
		if (!active) return;

		char.GetSkillFromConstructor(Throw)?.toggleThrowMode();
	},

	[Action.Grenade]: (char, input, active) => {
		// const skill = char.GetSkillFromConstructor(Grenade);
		// if (active) {
		// 	skill?.Start();
		// } else {
		// 	skill?.Release();
		// }
	},

	[Action.HeavyAttack]: (char, input, active) => active && char.GetSkillFromConstructor(MeleeWeapon)?.heavyAttack(),
	[Action.Parry]: (char, input, active) => {
		if (isAiming()) {
			print("cant parry while aiming");
			return;
		}

		active ? char.GetSkillFromConstructor(Parry)?.startParry() : char.GetSkillFromConstructor(Parry)?.stopParry();
	},
	[Action.Dash]: (char, input, active) => active && char.GetSkillFromConstructor(Dash)?.Dash(),
	[Action.GrapplingHook]: (char, input, active) => {
		if (!active) return;
		const grappleSkill = char.GetSkillFromConstructor(GrapplingHook);
		grappleSkill?.Hook();
	},
	[Action.Chainsaw]: (char, input, active) => {
		if (!active) return;
		const chainsawSkill = char.GetSkillFromConstructor(Chainsaw);
		if (!chainsawSkill) return;

		// chainsawSkill.dbg();
		// return;

		if (chainsawSkill.running) {
			chainsawSkill.stop();
		} else if (chainsawSkill.revCount < chainsawSkill.revRequired) {
			chainsawSkill.rev();
		}
	},
	[Action.LightMolotov]: (char, input, active) => {
		if (!active) return;
		const skill = char.GetSkillFromConstructor(Molotov);
		skill?.light();
	},
	[Action.ThrowMolotov]: (char, input, active) => {
		const skill = char.GetSkillFromConstructor(Molotov);
		if (!skill?.molotovIsLit) {
			return;
		}
		if (active) {
			skill?.wind();
		} else {
			if (skill?.beingWind) {
				skill.throw();
			}
		}
	},

	[Action.Mark]: (char, input, active) => {
		if (!active) return;
		char.GetSkillFromConstructor(Mark)?.placeMark();
	},
	[Action.Yell]: (char, input, active) => {
		if (!active) return;

		sayMonologue("GET ON THE GROUND NOW!"); //make this customizable later
		const charModel = getCurrentWCS_Character()!.Player!.Character! as Model;
		RemoteEvents.requestSpawnStimulus("yell", charModel.GetPivot().Position, "auditory", 20, Players.LocalPlayer);
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
	[Action.PourOil]: (char, input, active) => {
		if (!active) return;
		const oilSkill = char.GetSkillFromConstructor(Jerrycan);
		if (!oilSkill) return;
		oilSkill.pour();
	},
	[Action.LightLighter]: (char, input, active) => {
		if (!active) return;
		const lighterSkill = char.GetSkillFromConstructor(Lighter);
		lighterSkill?.light();
	},

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
	[Action.WalkmanPlayStop]: (char, input, active) => {},
	[Action.WalkmanChangeMode]: (char, input, active) => {},
	[Action.WalkmanChangeSongs]: (char, input, active) => {},
	[Action.WalkmanThrow]: (char, input, active) => {},

	[Action.NeedlegunScrollAmpoules]: (char, input, active) => {},
	[Action.NeedlegunSelectAmpoule]: (char, input, active) => {},
	[Action.NeedlegunInsertAmpoule]: (char, input, active) => {},
	[Action.NeedlegunThrowAmpoule]: (char, input, active) => {},
	[Action.NeedlegunCrossbow]: (char, input, active) => {},
	[Action.NeedlegunAdministerTeam]: (char, input, active) => {},
	[Action.NeedlegunAdministerEnemy]: (char, input, active) => {},

	[Action.DroneTurnOnCloseUp]: (char, input, active) => {
		// if (!active) return;
		// if (!active) return;
		// const droneSkill = char.GetSkillFromConstructor(Drone);
		// if (droneSkill) {
		// 	droneSkill.turnOnCameraFeed(); // LMB
		// }
	},
	[Action.DroneDeployPickUp]: (char, input, active) => {
		// if (!active) return;
		// const droneSkill = char.GetSkillFromConstructor(Drone);
		// if (droneSkill) {
		// 	droneSkill.deployOrPickup(); // F Key
		// }
	},
	[Action.DroneUnfocusFeed]: (char, input, active) => {
		// if (!active) return;

		// const droneSkill = char.GetSkillFromConstructor(Drone);
		// if (droneSkill && droneSkill.isViewingFeed) {
		// 	droneSkill.unfocusCameraFeed(); // X Key
		// }
	},

	//reserved keys for UI
	[Action.OpenBackpack]: (char, input, active) => {
		if (!active) {
			// print("mouseIconEnabled:", getMouseIconEnabled(), "antlerOpen", antlerDebuggerDisplaying());
			UserInputService.MouseIconEnabled = false || getMouseIconEnabled(); //close on tab let go, false || true
		} else {
			// print("mouseIconEnabled:", getMouseIconEnabled());
			UserInputService.MouseIconEnabled = true || getMouseIconEnabled(); //open on tab
		}
	},
	[Action.OpenMenu]: (char, input, active) => {},
	[Action.CharacterInteract]: (char, input, active) => {},
	[Action.ContinueDialogue]: (char, input, active) => {},
	[Action.DropItem]: (char, input, active) => {
		RemoteEvents.requestDropItem("H" + InventoryStore.getCurrentSlot());
	},
	[Action.DossierMenu]: (char, input, active) => {
		if (!active) return;
		const dossierCabinet = Workspace.WaitForChild("DossierCabinet") as DossierCabinetModel;
		const camPart = dossierCabinet.WaitForChild("CameraPart") as Part;
		const currentCamera = Workspace.CurrentCamera!;

		if (!dossierGenerated) {
			dossierGenerated = true;
			generateDossier(dossierCabinet);
		}

		if (!dossierMenuOpen()) {
			// === OPEN MENU ===
			UserInputService.MouseIconEnabled = true;
			dossierMenuOpen(true);
			print("dossier menu open");
			isThirdPerson(true);
			UserInputService.MouseBehavior = Enum.MouseBehavior.Default; // Unlock the mouse
			currentCamera.FieldOfView = 90;
			const currentData = DossierStore.getDossiers();

			let camPartOffset = camPart.CFrame;
			if (currentData.size() > 25) {
				camPartOffset = camPartOffset.mul(new CFrame(0, 0, 3)); //moves camera back if theres too many dossiers
			} else if (currentData.size() > 15) {
				camPartOffset = camPartOffset.mul(new CFrame(0, 0, 2));
			}

			// Reset tilt to 0 prevents snapping when re-opening
			tiltX = 0;
			tiltY = 0;

			const dossierCabinetAddBuildButton = dossierCabinet.FindFirstChild("Add") as Part;

			//camera sway
			camConn = RunService.RenderStepped.Connect((dt) => {
				// 1. Get Screen Dimensions & Mouse Position
				const viewportSize = currentCamera.ViewportSize;
				const mousePos = UserInputService.GetMouseLocation(); // Returns Vector2 in pixels

				// 2. Calculate Center of Screen
				const centerX = viewportSize.X / 2;
				const centerY = viewportSize.Y / 2;

				// 3. Calculate Normalized Offset (-1 to 1)
				// Ex: If mouse is at left edge: (0 - center) / center = -1
				// Ex: If mouse is at right edge: (width - center) / center = 1
				const normX = (mousePos.X - centerX) / centerX;
				const normY = (mousePos.Y - centerY) / centerY;

				// 4. Determine Target Tilt (in Radians)
				const maxTiltRad = math.rad(MAX_TILT_DEGREES);

				// look towards the mouse direction slightly.
				const targetTiltX = -normX * maxTiltRad; // Yaw
				const targetTiltY = -normY * maxTiltRad; // Pitch

				tiltX = lerp(tiltX, targetTiltX, SWAY_SPEED);
				tiltY = lerp(tiltY, targetTiltY, SWAY_SPEED);

				// Apply to Camera
				currentCamera.CFrame = camPartOffset.mul(CFrame.Angles(tiltY, tiltX, 0));
			});
		} else {
			// === CLOSE MENU ===
			UserInputService.MouseIconEnabled = false;
			dossierMenuOpen(false);
			isThirdPerson(false);
			const bg = Workspace.CurrentCamera?.FindFirstChild("DossierUIBackground");
			if (bg) {
				bg.Destroy();
			}
			UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;
			currentCamera.FieldOfView = 70;

			if (camConn) {
				camConn.Disconnect();
			}
			// if (clone) {
			// 	clone.Destroy();
			// }
		}
	},
	[Action.DossierMenuNew]: (char, input, active) => {},

	[Action.FireGun]: (char, input, active) => {
		// print("fire gun runs");
		const parrySkill = char.GetSkillFromConstructor(Parry);

		if (parrySkill?.parrying) {
			print("cant aim while parrying");
			return;
		}

		//usually only one is active
		const pistolSkill = char.GetSkillFromConstructor(Pistol);
		// const rifleSkill = char.GetSkillFromConstructor(Rifle);
		const sniperSkill = char.GetSkillFromConstructor(Sniper);
		const smgSkill = char.GetSkillFromConstructor(Smg);

		if (active) {
			//only on inputbegan not inputended
			pistolSkill?.Fire();
			sniperSkill?.Fire();
			smgSkill?.startShooting();
			// rifleSkill?.startShooting();
		} else {
			smgSkill?.stopShooting();
			// rifleSkill?.stopShooting();
		}
	},
	[Action.AimGun]: (char, input, active) => {
		const parrySkill = char.GetSkillFromConstructor(Parry);

		if (parrySkill?.parrying) {
			print("cant aim while parrying");
			return;
		}

		const pistolSkill = char.GetSkillFromConstructor(Pistol);
		const smgSkill = char.GetSkillFromConstructor(Smg);
		// const rifleSkill = char.GetSkillFromConstructor(Rifle);
		const sniperSkill = char.GetSkillFromConstructor(Sniper);

		pistolSkill?.Aim(active);
		smgSkill?.Aim(active);
		// rifleSkill?.Aim(active);
		sniperSkill?.Aim(active);
	},
	[Action.QuickReload]: (char, input, active) => {
		if (!active) return;
		const pistolSkill = char.GetSkillFromConstructor(Pistol);
		const smgSkill = char.GetSkillFromConstructor(Smg);

		if (smgSkill?.magOut) {
			smgSkill.Reload();
		}
	},
	[Action.CockGun]: (char, input, active) => {
		//auto pistols dont need cocking
	},
	[Action.TakeoutMagezine]: (char, input, active) => {
		if (!active) return;
		const pistolSkill = char.GetSkillFromConstructor(Pistol);
		const smgSkill = char.GetSkillFromConstructor(Smg);
		// const rifleSkill = char.GetSkillFromConstructor(Rifle);
		const sniperSkill = char.GetSkillFromConstructor(Sniper);

		pistolSkill?.takeoutInsertMag();
		smgSkill?.takeoutInsertMag();
		// rifleSkill?.takeoutInsertMag();
		sniperSkill?.takeoutInsertMag();
	},

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
			debugMenuDisplaying = !debugMenuDisplaying;
			UserInputService.MouseIconEnabled = debugMenuDisplaying || getMouseIconEnabled();
		}
	},
	[Action.DebugMenuAlt]: (char, input, active) => {
		if (active) {
			debugMenuDisplaying = !debugMenuDisplaying;
			UserInputService.MouseIconEnabled = debugMenuDisplaying || getMouseIconEnabled();
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

	[Action.AntlerOpen]: (char, input, active) => {
		if (!active) return;

		//this context action only turns it on. it's turned off on the UI
		const antlerSkill = char.GetSkillFromConstructor(Antler);
		if (antlerSkill) {
			if (antlerDebuggerDisplaying() === false) {
				UserInputService.MouseIconEnabled = true || getMouseIconEnabled();
				antlerDebuggerDisplaying(true);
				antlerSkill.toggleDebugger(antlerDebuggerDisplaying());
				print("Antler Opened");
			}
		}
	},
	[Action.AntlerSpawnNpc]: (char, input, active) => {},
	[Action.AntlerDuplicateNpc]: (char, input, active) => {},
	[Action.AntlerMoveNpc]: (char, input, active) => {},
	[Action.AntlerDeleteNpc]: (char, input, active) => {},
	[Action.AntlerOpenNewInspect]: (char, input, active) => {
		if (!active) return;
		print("AntlerOpenNewInspect pressed");
	},
	[Action.AntlerOpenInspect]: (char, input, active) => {},
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

// ----------------- Input Listener -----------------
function handleInput(input: InputObject, gameProcessed: boolean, isInputBegan: boolean) {
	if (gameProcessed) return;

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
