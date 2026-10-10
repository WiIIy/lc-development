import { Action, KEYBINDS } from "shared/data/profile/defaultKeybinds";

export function getDisplayStringForAction(action: Action): string {
	const binds = KEYBINDS[action];
	if (!binds || binds.size() === 0) return "?";

	const primaryBind = binds[0];

	// Handle Mouse Inputs
	if (primaryBind === Enum.UserInputType.MouseButton1) return "LMB";
	if (primaryBind === Enum.UserInputType.MouseButton2) return "RMB";
	if (primaryBind === Enum.UserInputType.MouseButton3) return "MMB";

	// Handle Keyboard Inputs
	if (tostring(primaryBind).match("KeyCode")[0] !== undefined) {
		return (primaryBind as Enum.KeyCode).Name;
	}

	return "?";
}