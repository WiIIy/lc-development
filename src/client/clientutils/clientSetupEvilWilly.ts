import { Workspace } from "@rbxts/services";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { NpcMeleeBlock } from "../../shared/skills/npc/melee/npcBlock";
import { Character } from "@rbxts/wcs";
import { NpcMeleeLight } from "../../shared/skills/npc/melee/npcLight";
import { NpcMeleeHeavy } from "../../shared/skills/npc/melee/npcHeavy";
import { NpcMeleeShove } from "../../shared/skills/npc/melee/npcShove";
import Components from "shared/components/components";
import { RemoteEvents } from "client/network";
import { Id, TagDiscriminator } from "@rbxts/jecs";

export function setupEvilWilly() {
	const evilWilly = Workspace.EvilWilly;
	AnimationUtils.loadAnim(evilWilly, "stance", ANIMATION_IDS.actions.squared_up, 0, true);
	const sightTrackingButton = Workspace.evilWillyButtons["Sight Tracking"];
	const trackingButton = Workspace.evilWillyButtons["Tracking"];
	sightTrackingButton.SetAttribute("On", false);

	sightTrackingButton.ClickDetector.MouseClick.Connect(() => {
		"added sight tracking";
		const attr = sightTrackingButton.GetAttribute("On") as boolean
		const add = !attr; //if on, remove, if off, add

		RemoteEvents.addComponentToEntityReference.fire(
			evilWilly,
			Components.SightTracking as unknown as Id<TagDiscriminator>,
			add,
		);
	});
	sightTrackingButton.AttributeChanged.Connect((name) => {
		const state = sightTrackingButton.GetAttribute("On");
		if (state === true) {
			sightTrackingButton.Color = new Color3(0.02, 0.38, 0.14);
		} else {
			sightTrackingButton.Color = Color3.fromRGB(111, 36, 37);
		}
	});

	sightTrackingButton.ClickDetector.MouseClick.Connect(() => {
		"added sight tracking";
		const attr = sightTrackingButton.GetAttribute("On") as boolean
		const add = !attr; //if on, remove, if off, add

		RemoteEvents.addComponentToEntityReference.fire(
			evilWilly,
			Components.SightTracking as unknown as Id<TagDiscriminator>,
			add,
		);
	});
	sightTrackingButton.AttributeChanged.Connect((name) => {
		const state = sightTrackingButton.GetAttribute("On");
		if (state === true) {
			sightTrackingButton.Color = new Color3(0.02, 0.38, 0.14);
		} else {
			sightTrackingButton.Color = Color3.fromRGB(111, 36, 37);
		}
	});

	// Workspace.evilWillyButtons.Pathfinding.ClickDetector.MouseClick.Connect(() => {
	// 	RemoteEvents.addComponentToEntityReference.fire(evilWilly, Components.Path as unknown as Id<TagDiscriminator>);
	// });

	//initialize loop here to start pathfinding and randomize/iterate between actions
}

function setupComponentToggle(
	button: Part & { ClickDetector: ClickDetector },
	component: Id<TagDiscriminator>,
	entity: Instance,
) {
	button.SetAttribute("On", false);

	button.ClickDetector.MouseClick.Connect(() => {
		const isOn = button.GetAttribute("On") as boolean;

		RemoteEvents.addComponentToEntityReference.fire(
			entity,
			component,
			!isOn,
		);
	});

	button.AttributeChanged.Connect((attributeName) => {
		if (attributeName !== "On") return;

		const isOn = button.GetAttribute("On");

		button.Color =
			isOn === true
				? Color3.fromRGB(5, 97, 36)
				: Color3.fromRGB(111, 36, 37);
	});
}

//autorotate is false for custom look behaviors
//modes
//willy will begin by advancing to you until about 6 studs from you
//once that is reached, willy compares your distance from first time Los gained to your distance once he's within 6 studs
//if he detects that you retreated he will advance

//on second thought i think im gonna create a player state tracker that captures the many states a player can be in
//"advancing toward aggro"|"retreating from aggro"
//"shooting" | "meleeing" | "existing (neutral state)" | "eating"
// "blocking" | "parrying" | "attacking" | "getting attacked"
//"hiding" | "in the open"
//
//enemies will pick what to do depending on the state tracker to respond to what the player is doing

//willy can only block for 1-4 seconds

function evilWillyDetectPlayerAdvancingRetreating() {}

function evilWillySetTarget(player: Player) {
	//set pathfinding target
}

function evilWillyRetreat() {
	//back off a few steps
}

function evilWillyKeepDistance(distance: number) {
	//keep distance to a certain stud (willy will retreat and advance)
}

function evilWillyAdvance() {
	//advance a few steps
}

function evilWillyKeepLos() {
	//start keep los connection
}

function evilWillyBreakLos() {
	//stop los connection
}

function evilWillyMeleeLight() {
	//light attack here
}

function evilWillyMeleeHeavy() {
	//heavy attack here
}

function evilWillyMeleeStartBlock() {
	//block here
}

function evilWillyMeleeStopBlock() {
	//block here
}

function evilWillyMeleeShove() {
	//shove here
}
