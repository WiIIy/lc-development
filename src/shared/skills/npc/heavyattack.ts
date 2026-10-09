import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { t } from "@rbxts/t";

@SkillDecorator
export class HeavyAttack extends Skill {
	heavyAttack() {
		print("yeah the dude heavied");
		this.serverHeavyAttack();
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	protected serverHeavyAttack(): void {
		print("dude heavied");
	}
}
