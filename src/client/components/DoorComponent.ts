// client/components/door.ts

import { Component, BaseComponent } from "@flamework/components";
import { TweenService, CollectionService, Players } from "@rbxts/services";
import { RemoteEvents } from "client/network";

//open slightly still not giving physics property
// add grab handle to pull? F physics state is useless 
export interface DoorInstance extends Model {
	Door: BasePart & {
		WeldConstraint?: WeldConstraint;
	};
	Hinge: BasePart & {
		WeldConstraint?: WeldConstraint;
	};
	OpenHitbox: BasePart;
	OpenSlightHitbox: BasePart;
}

@Component({ tag: "Door" })
export class DoorClientComponent extends BaseComponent<{}, DoorInstance> {
	private defaultCFrame!: CFrame;

	constructor() {
		super();
		this.defaultCFrame = this.instance.Hinge.CFrame;
		if (this.instance.GetAttribute("DefaultCF") === undefined) {
			this.instance.SetAttribute("DefaultCF", this.defaultCFrame);
		}
		if (this.instance.GetAttribute("State") === undefined) {
			this.instance.SetAttribute("State", "Close");
		}
	}
}

const tweenInfo = new TweenInfo(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

/**
 * Calculates the dynamic direction multiplier based on the player's position
 * and whether the hinge is on their relative left or right.
 */
function getRelativeDirectionMultiplier(door: DoorInstance, isPush: boolean): number {
	const char = Players.LocalPlayer.Character;
	if (!char || !char.PrimaryPart) return 1;

	const doorPart = door.Door;
	const toPlayer = char.PrimaryPart.Position.sub(doorPart.Position);

	// 1. Determine if the player is facing the Front or Back side of the door
	const isFront = doorPart.CFrame.LookVector.Dot(toPlayer) > 0;

	// 2. Identify if the hinge is located on the right or left side of the door part
	const hingeLocalPos = doorPart.CFrame.ToObjectSpace(door.Hinge.CFrame).Position;
	const isHingeOnRight = hingeLocalPos.X > 0;

	// 3. Resolve the rotational angle direction
	let multiplier = isFront ? (isPush ? 1 : -1) : isPush ? -1 : 1;

	// If the hinge setup is inverted (on the left side), flip the final rotation direction
	if (!isHingeOnRight) {
		multiplier *= -1;
	}

	return multiplier;
}

export function toggleNormal(door: DoorInstance, isPush: boolean = true) {
	if (isDoorLocked(door)) return;

	const state = door.GetAttribute("State");
	if (state === "Close" || state === "Physics") {
		openNormally(door, isPush);
	} else if (state === "Open") {
		closeNormally(door);
	}
}

export function openNormally(door: DoorInstance, isPush: boolean) {
	door.SetAttribute("State", "Open");

	// Re-enable rigid weld tracking before running our structural tween
	const weld =
		door.Hinge.FindFirstChildOfClass("WeldConstraint") || door.Door.FindFirstChildOfClass("WeldConstraint");
	if (weld) weld.Enabled = true;

	const dir = getRelativeDirectionMultiplier(door, isPush);
	const defaultCF = door.GetAttribute("DefaultCF") as CFrame;
	const openGoal = defaultCF.mul(CFrame.Angles(0, math.rad(90 * dir), 0));

	// CAAssets.audio.shing.Play();
	// TweenService.Create(door.Hinge, tweenInfo, { CFrame: openGoal }).Play();

	RemoteEvents.doorInteract.fire(door, "Open", openGoal);
}

export function closeNormally(door: DoorInstance) {
	door.SetAttribute("State", "Close");

	const weld =
		door.Hinge.FindFirstChildOfClass("WeldConstraint") || door.Door.FindFirstChildOfClass("WeldConstraint");
	if (weld) weld.Enabled = true;

	// CAAssets.audio.shing.Play();
	const defaultCF = door.GetAttribute("DefaultCF") as CFrame;
	// TweenService.Create(door.Hinge, tweenInfo, { CFrame: defaultCF }).Play();

	RemoteEvents.doorInteract.fire(door, "Close", defaultCF);
}

export function triggerSlightOpen(door: DoorInstance, isPush: boolean) {
	if (isDoorLocked(door)) return;
	if (door.GetAttribute("State") === "Open") return;

	const shouldClose = door.GetAttribute("State") === "Physics";
	const defaultCF = door.GetAttribute("DefaultCF") as CFrame;
	const weld = door.Hinge.FindFirstChildOfClass("WeldConstraint");

	let slightGoal: CFrame;
	let tween: Tween;

	if (shouldClose) {
		print("slight closing");
		door.SetAttribute("State", "Close"); // Local state change for prediction
		RemoteEvents.doorInteract.fire(door, "Close", defaultCF);
	} else {
		print("slight opening");
		const dir = getRelativeDirectionMultiplier(door, isPush);
		const slightGoal = defaultCF.mul(CFrame.Angles(0, math.rad(12 * dir), 0));

		door.SetAttribute("State", "Physics"); // Local state change for prediction
		RemoteEvents.doorInteract.fire(door, "Physics", slightGoal);
	}

	// CAAssets.audio.shing.Play();
}

function isDoorLocked(door: Model) {
	return CollectionService.HasTag(door, "keylocked") || CollectionService.HasTag(door, "keycardlocked");
}
