import { GlobalEvents } from "shared/network";
import { RemoteEvents } from "client/network";
import { defaultDossierData } from "shared/data/profile/defaultDossierData";

let clientDossiers: DossierData[] = defaultDossierData;
let currentlySelected: DossierData = defaultDossierData[0];
let currentlyEquipped: DossierData = defaultDossierData[0];

const dossierChangedSignal = new Instance("BindableEvent");

export namespace DossierStore {
	export function getEquipped(): DossierData {
		return currentlyEquipped;
	}

	export function getSelected(): DossierData {
		return currentlySelected;
	}

	export function getDossiers(): DossierData[] {
		return clientDossiers;
	}

	/**
	 * Local draft update (used for live text preview without sending network calls)
	 */
	export function updateLocalPreview(updater: (draft: DossierData) => DossierData) {
		currentlyEquipped = updater(currentlyEquipped);
		dossierChangedSignal.Fire(currentlyEquipped);
	}

	/**
	 * Immediate update: Updates local state AND sends the payload straight to the server
	 */
	export function updateAndSave(updater: (draft: DossierData) => DossierData) {
		currentlyEquipped = updater(currentlyEquipped);

		// Keep clientDossiers in sync locally
		const index = clientDossiers.findIndex((d) => d.build.id === currentlyEquipped.build.id);
		if (index !== -1) {
			clientDossiers[index] = currentlyEquipped;
		}

		dossierChangedSignal.Fire(DossierStore.getEquipped());
		RemoteEvents.requestSaveDossier.fire(DossierStore.getEquipped());
	}

	/**
	 * Explicit Save call (triggered ONLY when clicking the "Save" button for the label text)
	 */
	export function saveCurrentLabel() {
		print(DossierStore.getEquipped());
		RemoteEvents.requestSaveDossier.fire(DossierStore.getEquipped());
	}

	export function onChange(callback: () => void) {
		return dossierChangedSignal.Event.Connect(callback);
	}

	export function setEquipped(dossierIndex: number) {
		if (clientDossiers[dossierIndex]) {
			currentlyEquipped = clientDossiers[dossierIndex];
		}
	}

	export function setShown(dossier: DossierData) {
		currentlySelected = dossier;
		dossierChangedSignal.Fire();
	}
}

// Replicate incoming state from server when save completes or profile loads
RemoteEvents.dossierSync.connect((dossiers) => {
	clientDossiers = dossiers;
	const foundEquipped = clientDossiers.find((d) => d.build.id === currentlyEquipped.build.id);
	if (foundEquipped) {
		currentlyEquipped = foundEquipped;
	} else if (clientDossiers.size() > 0) {
		currentlyEquipped = clientDossiers[0];
	}

	const foundShown = clientDossiers.find((d) => d.build.id === currentlySelected.build.id);
	if (foundShown) {
		currentlySelected = foundShown;
	} else if (clientDossiers.size() > 0) {
		currentlySelected = clientDossiers[0];
	}

	dossierChangedSignal.Fire();
});
