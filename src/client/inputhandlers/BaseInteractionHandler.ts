import { Players, ContextActionService, Workspace } from "@rbxts/services";
import { Character } from "@rbxts/wcs";
import { pointedItem, isDragging } from "client/clientAtoms";
import { RemoteEvents } from "client/network";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { HIGHLIGHTABLE_ITEMS } from "shared/data/items/highlightable";
import { Action } from "shared/data/profile/defaultKeybinds";
import { INTERACTABLE_CHARACTERS } from "shared/data/world/npcs";
import { isAiming } from "shared/sharedAtoms";
import { Dash } from "shared/skills";
import { MeleeLight } from "shared/skills/base/light";
import { Mark } from "shared/skills/mark";
import { MeleeHeavy } from "shared/skills/base/heavy";
import { getCurrentWCS_Character } from "shared/utils/ecs/getCurrentWcsCharacter";
import { mouseRaycast } from "shared/utils/input/mouseRaycast";
import { sayMonologue } from "shared/utils/ui/sayMonologue";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { setDescendantLocalTransparency } from "shared/utils/world/setDescendant";
import { MeleeBlock } from "shared/skills/base/block";
import { MeleeShove } from "shared/skills/base/shove";

export const BaseInteractionHandlers: Partial<
	Record<Action, (char: Character, input: InputObject, active: boolean) => void>
> = {
	[Action.LightAttack]: (char, input, active) => {
		if (active) {
			print("lmb");
			// AnimationUtils.loadAnim(char.Humanoid.Parent as Model, "light", ANIMATION_IDS.actions.light);
			const lightSkill = char.GetSkillFromConstructor(MeleeLight);
			lightSkill!.meleeLight();
		}
	},
	[Action.HeavyAttack]: (char, input, active) => {
		if (active) {
			const heavySkill = char.GetSkillFromConstructor(MeleeHeavy);
			heavySkill!.meleeHeavy();
		}
	},
	[Action.Parry]: (char, input, active) => {
		const blockSkill = char.GetSkillFromConstructor(MeleeBlock);
		if (active) {
			blockSkill!.meleeBlockStart();
		} else {
			blockSkill!.meleeBlockEnd();
		}
	},
	[Action.Shove]: (char, input, active) => {
		if (active) {
			const blockSkill = char.GetSkillFromConstructor(MeleeShove);
			blockSkill!.meleeShove();
		}
	},
	[Action.ShiftClick]: (char, input, active) => {
		print("shiftclick");
	},
	[Action.Crouch]: (char, input, active) => { },
	[Action.Dash]: (char, input, active) => active && char.GetSkillFromConstructor(Dash)?.Dash(),

	[Action.Yell]: (char, input, active) => {
		if (!active) return;

		sayMonologue("GET ON THE GROUND NOW!"); //make this customizable later
		const charModel = getCurrentWCS_Character()!.Player!.Character! as Model;
		RemoteEvents.requestSpawnStimulus("yell", charModel.GetPivot().Position, "auditory", 20, Players.LocalPlayer);
	},
	[Action.Mark]: (char, input, active) => {
		if (!active) return;
		char.GetSkillFromConstructor(Mark)?.placeMark();
	},
};
