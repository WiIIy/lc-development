import { HoldableSkill, SkillDecorator } from "@rbxts/wcs";

@SkillDecorator
export class Block extends HoldableSkill {
	public OnConstructServer() {
		this.SetMaxHoldTime(undefined);
	}
}
