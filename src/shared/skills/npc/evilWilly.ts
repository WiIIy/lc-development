import { Workspace } from "@rbxts/services";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { NpcMeleeBlock } from "./melee/npcBlock";
import { Character } from "@rbxts/wcs";
import { NpcMeleeLight } from "./melee/npcLight";
import { NpcMeleeHeavy } from "./melee/npcHeavy";
import { NpcMeleeShove } from "./melee/npcShove";

export function setupEvilWilly() {
	const evilWilly = Workspace.FindFirstChild("EvilWilly") as Model;
	AnimationUtils.loadAnim(evilWilly, "stance", ANIMATION_IDS.actions.squared_up, 0, true);

	const evilWillyWcs = new Character(evilWilly);
	new NpcMeleeLight(evilWillyWcs);
	new NpcMeleeHeavy(evilWillyWcs);
	new NpcMeleeShove(evilWillyWcs);
	new NpcMeleeBlock(evilWillyWcs);
	//initialize loop here to start pathfinding and randomize/iterate between actions
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

function evilWillyDetectPlayerAdvancingRetreating(){

}

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
