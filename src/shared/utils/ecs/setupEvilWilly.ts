import { Workspace } from "@rbxts/services";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { Character } from "@rbxts/wcs";
import Components from "shared/components/components";
import { Id, TagDiscriminator } from "@rbxts/jecs";
import { NpcMeleeBlock } from "shared/skills/npc/melee/npcBlock";
import { NpcMeleeHeavy } from "shared/skills/npc/melee/npcHeavy";
import { NpcMeleeLight } from "shared/skills/npc/melee/npcLight";
import { NpcMeleeShove } from "shared/skills/npc/melee/npcShove";
import world from "shared/world";
import { ref } from "@willy/jecs-utils";

export function setupEvilWilly() {
	const evilWillyEntity = world.entity();
	ref.set(Workspace.EvilWilly, evilWillyEntity);

	const evilWillyHrp = Workspace.EvilWilly.FindFirstChild("HumanoidRootPart") as BasePart;
	const evilWillyNeckJoint = Workspace.EvilWilly.FindFirstChild("Torso")?.FindFirstChild("Neck") as Motor6D;
	world.set(evilWillyEntity, Components.Transform, evilWillyHrp.CFrame);
	world.set(evilWillyEntity, Components.Basepart, evilWillyHrp); //needed for transform
	world.set(evilWillyEntity, Components.NeckJoint, evilWillyNeckJoint); //needed for sight behaviors
	world.set(evilWillyEntity, Components.Humanoid, Workspace.EvilWilly.FindFirstChildOfClass("Humanoid")!); //needed for pathfinding moveto
	// world.add(evilWillyEntity, Components.Tracking);
	print("setting ref evil willy, " + ref.get(Workspace.EvilWilly));

	const evilWillyWcs = new Character(Workspace.EvilWilly);
	new NpcMeleeLight(evilWillyWcs);
	new NpcMeleeHeavy(evilWillyWcs);
	new NpcMeleeShove(evilWillyWcs);
	new NpcMeleeBlock(evilWillyWcs);
}
