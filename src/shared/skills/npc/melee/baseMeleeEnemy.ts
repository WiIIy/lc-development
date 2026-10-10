// here we go
import { Character, Message, Skill, SkillDecorator } from "@rbxts/wcs";
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
