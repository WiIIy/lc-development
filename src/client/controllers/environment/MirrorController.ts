import { Controller, OnStart, Service } from "@flamework/core";
import { Players, RunService, Workspace } from "@rbxts/services";
import { RemoteEvents } from "client/network";
import { ClientContext } from "shared/ClientContext";
import { ALL_ITEMS } from "shared/data/items/all";

//note: do NOT PUT MIRRORS WHERE the back is an actual area because the back of the mrirror is meant to be occupied for reflections.

//make sure mirror's front faces the player/renderpart
//basepart attributes:
//MirrorFix (boolean) : rotates 180 if its the wrong way round
//MirrorTransparent (boolean): keeps things transparent
@Controller({})
export class MirrorController 
// implements OnStart
  {
	forcedMirrorParts = new Set<BasePart>();

	constructor() {
		ClientContext.MirrorController = this;
	}

	private destroyMirrorConnection: (() => void) | undefined;

	// onStart() {
	// 	//for some reason parts are often nil at runtime so wait
	// 	const mirror = Workspace.WaitForChild("Mirror") as Model;
	// 	const glass = mirror.WaitForChild("Glass") as Model;
	// 	// print(mirror, mirror.GetChildren(), mirror.GetDescendants());
	// 	const mirrorPart = glass.WaitForChild("Fake1") as BasePart;
	// 	const renderPart = mirror.WaitForChild("RenderPart") as BasePart;

	// 	if (!mirror || !mirrorPart || !renderPart) {
	// 		// print(mirror, mirrorPart, renderPart);
	// 		warn("MirrorController: Missing mirror components");
	// 	}

	// 	const reflectionFolder = new Instance("Folder");
	// 	reflectionFolder.Name = "ReflectionFolder";
	// 	reflectionFolder.Parent = mirror;

	// 	const clonesMap = new Map<BasePart, BasePart>();
	// 	const mirrorModels = new Map<Model, Model>();
	// 	const clonedAccessories = new Map<Accessory, Accessory>();

	// 	const overlapParams = new OverlapParams();
	// 	overlapParams.FilterType = Enum.RaycastFilterType.Exclude;
	// 	overlapParams.FilterDescendantsInstances = [mirror];

	// 	let renderConnection: RBXScriptConnection | undefined;
	// 	let touchConnection: RBXScriptConnection | undefined;
	// 	let destroyed = false;

	// 	// The core reflection logic extracted into its own function
	// 	const processMirrorLogic = () => {
	// 		const players = Players.GetPlayers();
	// 		let playerInRoom = false;

	// 		for (const player of players) {
	// 			const character = player.Character;
	// 			if (!character || !character.PrimaryPart) continue;

	// 			const partsInRoom = Workspace.GetPartsInPart(renderPart, overlapParams);
	// 			const isPlayerInRoom = partsInRoom.some((p) => p.IsDescendantOf(character));

	// 			if (isPlayerInRoom) {
	// 				playerInRoom = true;
	// 				break;
	// 			}
	// 		}

	// 		// --- SLEEP TRIGGER ---
	// 		// If no players are left in the room, clean up and disconnect the loop
	// 		if (!playerInRoom) {
	// 			this.clearClones(clonesMap, mirrorModels, clonedAccessories, reflectionFolder);

	// 			if (renderConnection) {
	// 				renderConnection.Disconnect();
	// 				renderConnection = undefined;
	// 			}
	// 			return;
	// 		}

	// 		const mirrorNormal = mirrorPart.CFrame.LookVector;
	// 		const horizontalNormal = mirrorNormal.mul(new Vector3(1, 0, 1)).Unit;
	// 		const mirrorSurface = mirrorPart.Position.add(horizontalNormal.mul(mirrorPart.Size.Z / 2));

	// 		const partsToReflect = new Set<BasePart>();
	// 		const charactersInRoom = new Set<Model>();

	// 		for (const part of Workspace.GetPartBoundsInBox(renderPart.CFrame, renderPart.Size, overlapParams)) {
	// 			if (part.IsA("BasePart")) {
	// 				partsToReflect.add(part);

	// 				const ancestorModel = part.FindFirstAncestorWhichIsA("Model");
	// 				if (ancestorModel && ancestorModel.FindFirstChildWhichIsA("Humanoid")) {
	// 					charactersInRoom.add(ancestorModel);
	// 				}
	// 			}
	// 		}

	// 		// Detect carried or dragged ragdolls linked to the characters currently in the room
	// 		for (const character of charactersInRoom) {
	// 			const hrp = character.FindFirstChild("HumanoidRootPart");
	// 			if (!hrp) continue;

	// 			for (const child of hrp.GetChildren()) {
	// 				let attachedPart: Instance | undefined;

	// 				// Find the attachments specific to your carry/drag logic
	// 				if (child.IsA("AlignPosition") && child.Attachment0) {
	// 					attachedPart = child.Attachment0.Parent; // Target Torso
	// 				} else if (child.IsA("RopeConstraint") && child.Attachment1) {
	// 					attachedPart = child.Attachment1.Parent; // Target Torso
	// 				}

	// 				if (attachedPart && attachedPart.IsA("BasePart")) {
	// 					const ragdollModel = attachedPart.FindFirstAncestorWhichIsA("Model");

	// 					// Validate that it's actually a ragdoll and not the carrier itself
	// 					if (
	// 						ragdollModel &&
	// 						ragdollModel !== character &&
	// 						ragdollModel.GetAttribute("ragdolled") === true
	// 					) {
	// 						charactersInRoom.add(ragdollModel); // Ensures accessories/tools clone properly

	// 						// Explicitly bypass the spatial query by forcing base parts into the map
	// 						for (const desc of ragdollModel.GetDescendants()) {
	// 							if (desc.IsA("BasePart")) {
	// 								partsToReflect.add(desc);
	// 							}
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}

	// 		// Grab custom Models (weapons) or Tools, ignoring standard accessories
	// 		// Explicitly gather Tools, Models, AND Item Accessories attached to characters in the room
	// 		for (const character of charactersInRoom) {
	// 			for (const child of character.GetChildren()) {
	// 				const isItemModel = child.IsA("Model") || child.IsA("Tool");
	// 				const isItemAccessory = child.IsA("Accessory") && ALL_ITEMS.includes(child.Name);

	// 				if (isItemModel || isItemAccessory) {
	// 					for (const desc of child.GetDescendants()) {
	// 						if (desc.IsA("BasePart")) {
	// 							partsToReflect.add(desc);
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}

	// 		for (const forced of this.forcedMirrorParts) {
	// 			if (forced.IsDescendantOf(Workspace)) {
	// 				partsToReflect.add(forced);
	// 			}
	// 		}

	// 		const currentFrameParts = new Set<BasePart>();
	// 		const currentFrameModels = new Set<Model>();

	// 		for (const part of partsToReflect) {
	// 			if (!part.IsA("BasePart")) continue;

	// 			if (
	// 				part.GetAttribute("MirrorTransparent") === true ||
	// 				part.Name === "HumanoidRootPart" ||
	// 				part.Name === "Part" ||
	// 				part.Name === "AimPart" ||
	// 				part.Name === "Left Arm Collide Part" ||
	// 				part.Name === "Right Arm Collide Part" ||
	// 				part.IsA("Seat")
	// 			) {
	// 				part.Transparency = 1;
	// 			} 
	// 			// else {
	// 			// 	part.Transparency = 0;
	// 			// }

	// 			const parent = part.Parent;
	// 			const ancestorModel = part.FindFirstAncestorWhichIsA("Model");
	// 			const humanoid = ancestorModel?.FindFirstChildWhichIsA("Humanoid");

	// 			// Setup the character model structure if a Humanoid is detected
	// 			let targetParent: Instance = reflectionFolder;

	// 			if (ancestorModel && humanoid) {
	// 				currentFrameModels.add(ancestorModel);

	// 				let mirrorModel = mirrorModels.get(ancestorModel);
	// 				if (!mirrorModel) {
	// 					mirrorModel = this.createMirrorCharacter(ancestorModel, humanoid, reflectionFolder);
	// 					mirrorModels.set(ancestorModel, mirrorModel);
	// 				}
	// 				targetParent = mirrorModel;
	// 				const mirrorHum = mirrorModel?.FindFirstChildWhichIsA("Humanoid");

	// 				// If the part belongs to an Accessory, let the Humanoid handle it natively
	// 				if (parent && parent.IsA("Accessory")) {
	// 					const isItemAccessory = ALL_ITEMS.includes(parent.Name);

	// 					// If it's standard apparel (hat/hair), skip it and let clonedAccessories handle it.
	// 					// If it IS an item accessory, do NOT skip—let it fall through to clonesMap below!
	// 					if (!isItemAccessory) {
	// 						continue;
	// 					}
	// 				}
	// 			}

	// 			for (const model of currentFrameModels) {
	// 				const mirrorModel = mirrorModels.get(model);
	// 				if (!mirrorModel) continue;

	// 				const mirrorHum = mirrorModel.FindFirstChildWhichIsA("Humanoid");
	// 				if (!mirrorHum) continue;

	// 				for (const accessory of model.GetChildren()) {
	// 					if (!accessory.IsA("Accessory")) continue;
	// 					if (ALL_ITEMS.includes(accessory.Name)) continue;

	// 					if (!clonedAccessories.has(accessory)) {
	// 						const clone = accessory.Clone();
	// 						if (!clone) continue;

	// 						this.stripScriptsOnly(clone);

	// 						const handle = clone.FindFirstChild("Handle") as BasePart;
	// 						const weld = handle?.FindFirstChild("AccessoryWeld") as Weld;

	// 						if (handle && weld) {
	// 							const limbName = weld.Part1?.Name;
	// 							if (limbName === undefined) continue;

	// 							const limb = mirrorModel.FindFirstChild(limbName) as BasePart;
	// 							if (!limb) continue;

	// 							const isLegAccessory =
	// 								handle.FindFirstChild("LeftFootAttachment") !== undefined ||
	// 								handle.FindFirstChild("RightFootAttachment") !== undefined;

	// 							// In the future, you can easily add `LeftGripAttachment` or `RightCollarAttachment` to this boolean

	// 							if (isLegAccessory) {
	// 								const c0 = weld.C0;
	// 								//sometimes things that should appear on the outer leg appears in the inner leg instead. this fixes it
	// 								// Invert the X position but maintain the original Y, Z, and Rotation
	// 								weld.C0 = new CFrame(new Vector3(-c0.X, c0.Y, c0.Z)).mul(c0.Rotation);
	// 							}

	// 							weld.Part1 = limb;
	// 							clone.Parent = mirrorModel;

	// 							clonedAccessories.set(accessory, clone);
	// 						}
	// 					}
	// 				}
	// 			}

	// 			currentFrameParts.add(part);
	// 			let clone = clonesMap.get(part);

	// 			if (!clone) {
	// 				clone = part.Clone();
	// 				if (!clone) continue;

	// 				// Remove child BaseParts from the clone so sub-assemblies don't duplicate
	// 				for (const child of clone.GetChildren()) {
	// 					if (child.IsA("BasePart")) {
	// 						child.Destroy();
	// 					}
	// 				}

	// 				this.stripPhysics(clone);

	// 				for (const child of clone.GetChildren()) {
	// 					if (child.IsA("Decal") || child.IsA("Texture")) {
	// 						child.Transparency = 0;
	// 					}
	// 				}

	// 				clone.Anchored = true;
	// 				clone.CanCollide = false;
	// 				clone.CanTouch = false;
	// 				clone.CanQuery = false;
	// 				clone.Massless = true;
	// 				clone.Parent = targetParent;
	// 				clonesMap.set(part, clone);
	// 			}

	// 			// 2. Horizontal Reflection Math
	// 			const pos = part.Position;
	// 			const toPoint = pos.sub(mirrorSurface);
	// 			const distance = toPoint.Dot(horizontalNormal);
	// 			const reflectedPos = pos.sub(horizontalNormal.mul(2 * distance));

	// 			const reflectVector = (v: Vector3) => v.sub(horizontalNormal.mul(2 * v.Dot(horizontalNormal)));
	// 			const rLook = reflectVector(part.CFrame.LookVector);
	// 			const rUp = reflectVector(part.CFrame.UpVector);

	// 			clone.CFrame = CFrame.lookAt(reflectedPos, reflectedPos.add(rLook), rUp);

	// 			if (clone) {
	// 				if (clone.GetAttribute("MirrorFix") === true) {
	// 					clone.CFrame = clone.CFrame.mul(CFrame.Angles(0, math.pi, 0));
	// 				}
	// 			}

	// 			// print("clones", clonesMap.size(), clonesMap);
	// 		}

	// 		// 3. Cleanup parts and characters that left the area
	// 		for (const [original, clone] of clonesMap) {
	// 			if (!currentFrameParts.has(original) || !original.IsDescendantOf(Workspace)) {
	// 				clone.Destroy();
	// 				clonesMap.delete(original);
	// 			}
	// 		}

	// 		// Clean up dead accessories based on their original Character Model's presence
	// 		for (const [originalAcc, clonedAcc] of clonedAccessories) {
	// 			const accModel = originalAcc.FindFirstAncestorWhichIsA("Model");

	// 			const handle = clonedAcc.FindFirstChild("Handle") as BasePart | undefined;
	// 			const weld = handle?.FindFirstChild("AccessoryWeld") as Weld | undefined;

	// 			// If the mirrored limb was destroyed (e.g., player's head left the room),
	// 			// Part1 will still reference the part, but its Parent will be undefined.
	// 			const isLimbIntact = weld && weld.Part1 && weld.Part1.Parent !== undefined;

	// 			if (
	// 				!accModel ||
	// 				!currentFrameModels.has(accModel) ||
	// 				!originalAcc.IsDescendantOf(Workspace) ||
	// 				!isLimbIntact
	// 			) {
	// 				clonedAcc.Destroy();
	// 				clonedAccessories.delete(originalAcc);
	// 			}
	// 		}

	// 		for (const [originalModel, mirrorModel] of mirrorModels) {
	// 			if (!currentFrameModels.has(originalModel) || !originalModel.IsDescendantOf(Workspace)) {
	// 				mirrorModel.Destroy();
	// 				mirrorModels.delete(originalModel);
	// 			}
	// 		}
	// 	};

	// 	const destroyMirror = () => {
	// 		if (destroyed) return;
	// 		destroyed = true;

	// 		this.clearClones(clonesMap, mirrorModels, clonedAccessories, reflectionFolder);

	// 		// stop rendering loop
	// 		if (renderConnection) {
	// 			renderConnection.Disconnect();
	// 			renderConnection = undefined;
	// 		}

	// 		// stop future triggers
	// 		if (touchConnection) {
	// 			touchConnection.Disconnect();
	// 			touchConnection = undefined;
	// 		}
	// 	};

	// 	this.destroyMirrorConnection = destroyMirror;

	// 	touchConnection = renderPart.Touched.Connect((hit) => {
	// 		if (destroyed) return;
	// 		if (renderConnection?.Connected) return;

	// 		const character = hit.FindFirstAncestorWhichIsA("Model");
	// 		if (character && Players.GetPlayerFromCharacter(character)) {
	// 			renderConnection = RunService.Heartbeat.Connect(processMirrorLogic);
	// 		}
	// 	});
	// }

	destroyMirror = () => {
		this.destroyMirrorConnection?.();
	};

	// Helper function to group the character and copy its appearance
	private createMirrorCharacter(ancestorModel: Model, humanoid: Humanoid, reflectionFolder: Folder): Model {
		const mirrorModel = new Instance("Model");
		mirrorModel.Name = ancestorModel.Name + "_Mirror";
		mirrorModel.Parent = reflectionFolder;

		// Cloning the Humanoid keeps proper body proportions and scales
		const humClone = humanoid.Clone();
		this.stripScriptsOnly(humClone);
		humClone.Parent = mirrorModel;

		// Copy clothing and body colors
		for (const child of ancestorModel.GetChildren()) {
			if (
				child.IsA("Shirt") ||
				child.IsA("Pants") ||
				child.IsA("ShirtGraphic") ||
				child.IsA("BodyColors") ||
				child.IsA("CharacterMesh")
			) {
				child.Clone().Parent = mirrorModel;
			}
		}

		return mirrorModel;
	}

	private clearClones(
		clonesMap: Map<BasePart, BasePart>,
		mirrorModels: Map<Model, Model>,
		clonedAccessories: Map<Accessory, Accessory>,
		folder: Folder,
	) {
		if (clonesMap.size() === 0 && mirrorModels.size() === 0) return;
		folder.ClearAllChildren();
		clonesMap.clear();
		mirrorModels.clear();
		clonedAccessories.clear();
	}

	private stripPhysics(clone: Instance) {
		for (const child of clone.GetDescendants()) {
			if (
				child.IsA("Weld") ||
				child.IsA("Motor6D") ||
				child.IsA("WeldConstraint") ||
				child.IsA("ManualWeld") ||
				child.IsA("Script") ||
				child.IsA("LocalScript") ||
				child.IsA("BodyMover") ||
				child.IsA("Constraint") ||
				child.IsA("Beam")
			) {
				child.Destroy();
			}
		}
	}

	// We use a separate stripper for accessories/humanoids so we don't destroy attachments/welds needed by the engine to snap the accessories on.
	private stripScriptsOnly(clone: Instance) {
		for (const child of clone.GetDescendants()) {
			if (child.IsA("Script") || child.IsA("LocalScript")) {
				child.Destroy();
			}
		}
	}
}
