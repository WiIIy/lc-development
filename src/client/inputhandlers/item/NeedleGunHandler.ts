import { Character } from "@rbxts/wcs";
import { Action } from "shared/data/profile/defaultKeybinds";

export const NeedlegunHandlers: Partial<
	Record<Action, (char: Character, input: InputObject, active: boolean) => void>
> = {
	[Action.NeedlegunScrollAmpoules]: (char, input, active) => {
		// Scroll ampoules logic...
	},
	[Action.NeedlegunSelectAmpoule]: (char, input, active) => {
		// Select ampoule logic...
	},
	[Action.NeedlegunThrowAmpoule]: (char, input, active) => {
		// Throw ampoule logic...
	},
	[Action.NeedlegunInsertAmpoule]: (char, input, active) => {
		// Insert ampoule logic...
	},
	[Action.NeedlegunCrossbow]: (char, input, active) => {
		// Crossbow logic...
	},
	[Action.NeedlegunAdministerTeam]: (char, input, active) => {
		// Team administration logic...
	},
	[Action.NeedlegunAdministerEnemy]: (char, input, active) => {
		// Enemy administration logic...
	},
};
