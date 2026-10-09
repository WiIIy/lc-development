// here we go
import { ref } from "@rbxts/jecs-utils";
import Make from "@rbxts/make";
import { Entity } from "@rbxts/jecs";
import { PathfindingService, Players, RunService, TweenService, Workspace } from "@rbxts/services";
import { Character, Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { enemyList } from "shared/atoms";
import { Components } from "shared/components/components";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AnimationUtil, AnimationUtils } from "shared/utils/animationUtil";
import { getCoverSpotsInRadius } from "shared/utils/getValidCoverSpots";
import world from "shared/world";
import { debugDrawWaypoints } from "shared/utils/drawWaypoints";
import { BaseEnemySkill } from "../baseEnemySkill";

export type BaseMeleeMoves = "light" | "heavy" | "parry";

@SkillDecorator
export class BaseMeleeEnemy extends BaseEnemySkill {
	lightAttack() {
		//play light animation
		//detect hit/miss
	}

	heavyAttack() {
		//play heavy animation
		//detect hit/miss
	}

	parry() {
		//play parry animation
		//deny hits in parry window
	}
}
