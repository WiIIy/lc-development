import {
	antlerDebuggerDisplaying,
	debugMenuDisplaying,
	dossierBuildingOpen,
	dossierEditingOpen,
	dossierMenuOpen,
	gameMenuOpen,
} from "shared/sharedAtoms";

export function getMouseIconEnabled(): boolean {
	return (
		debugMenuDisplaying() ||
		antlerDebuggerDisplaying() ||
		dossierMenuOpen() ||
		gameMenuOpen() ||
		dossierBuildingOpen() ||
		dossierEditingOpen()
	);
}
