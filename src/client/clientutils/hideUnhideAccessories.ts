import { isThirdPerson } from "client/clientAtoms";

//accessories that checkChild flagged as head/face/hair gear
const trackedAccessories = new Set<Accessory>();

function applyAccessoryTransparency(accessory: Accessory, hidden: boolean) {
	const value = hidden ? 1 : 0;
	for (const descendant of accessory.GetDescendants()) {
		if (descendant.IsA("BasePart")) {
			descendant.LocalTransparencyModifier = value;
		}
	}
}

/** Start tracking an accessory. It is hidden or shown immediately to match the current camera mode. */
export function registerAccessory(accessory: Accessory) {
	if (trackedAccessories.has(accessory)) return;
	trackedAccessories.add(accessory);
	accessory.Destroying.Connect(() => trackedAccessories.delete(accessory));
	applyAccessoryTransparency(accessory, !isThirdPerson());
}

/** hide = true for first person, false for third person. Callable from anywhere. */
export function hideUnhideAccessories(hide: boolean) {
	for (const accessory of trackedAccessories) {
		applyAccessoryTransparency(accessory, hide);
	}
}
