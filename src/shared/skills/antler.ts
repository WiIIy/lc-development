import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { antlerDebuggerDisplaying } from "shared/sharedAtoms";

@SkillDecorator
export class Antler extends Skill {
	public toggleDebugger(isOpen: boolean) {
		if (isOpen) {
			print("Antler debugger opened");
			antlerDebuggerDisplaying(true);
		} else {
			print("Antler debugger closed");
			antlerDebuggerDisplaying(false);
		}
	}
}
