import { setDescendantLocalTransparency } from "shared/utils/world/setDescendant";

const INVISIBLE_PARTS = new Set(["Head", "Left Arm", "Right Arm", "Torso"]);

export function hideUnhideParts(character: Model, hide: boolean) {
	if (!character) return;

	for (const descendant of character.GetDescendants()) {
		if (descendant.GetAttribute("firstpersonshow") === true) {
			setDescendantLocalTransparency(descendant, hide ? 1 : 0);
			continue;
		} else if (descendant.IsA("BasePart")) {
			if (INVISIBLE_PARTS.has(descendant.Name)) {
				descendant.LocalTransparencyModifier = hide ? 1 : 0;
			}
		} else if (descendant.IsA("Accessory") && descendant.GetAttribute("firstpersonshow") !== true) {
			const handle = descendant.FindFirstChild("Handle") as BasePart; // Hide Hats/Hair
			if (handle) {
				handle.LocalTransparencyModifier = hide ? 1 : 0;
			}
		} else if (descendant.IsA("Tool")) {
			changeLocalTransparencyModifier(descendant, hide); // Hide standard Roblox Tools
		} else if (descendant.IsA("Model")) {
			if (descendant.Name !== "Viewmodel") {
				changeLocalTransparencyModifier(descendant, hide); // Hide custom welded models
			}
		} else if (descendant.IsA("Decal")) {
			descendant.Transparency = hide ? 1 : 0; // Hide Decals
		}
	}
}


function changeLocalTransparencyModifier(parent: Instance, transparent: boolean) {
	let tnum;
	if (transparent) {
		tnum = 1;
	} else {
		tnum = 0;
	}

	for (const descendant of parent.GetDescendants()) {
		if (descendant.IsA("BasePart")) {
			descendant.LocalTransparencyModifier = tnum;
		}
	}
}
