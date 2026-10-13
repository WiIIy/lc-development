import { Character } from "@rbxts/wcs";
import { Action } from "shared/data/profile/defaultKeybinds";

export const WalkmanHandlers: Partial<Record<Action, (char: Character, input: InputObject, active: boolean) => void>> =
	{
		[Action.WalkmanPlayStop]: (char, input, active) => {},
		[Action.WalkmanChangeMode]: (char, input, active) => {},
		[Action.WalkmanChangeSongs]: (char, input, active) => {},
		[Action.WalkmanThrow]: (char, input, active) => {},
	};
