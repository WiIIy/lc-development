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
import { BaseMeleeEnemy, BaseMeleeMoves } from "./baseMeleeEnemy";

type KnifeMoves = BaseMeleeMoves | "Throw" | "Retrieve";

//melee if close
//throw if far enough

@SkillDecorator
export class KnifeNpc extends BaseMeleeEnemy {


}
