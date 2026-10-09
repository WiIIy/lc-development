import { defaultDossierData } from "./defaultDossierData";

export const defaultProfileData: ProfileData = {
	Scrips: 0,
	Items: [
		...["H1", "H2", "H3", "H4", "H5", "H6", "H7"].map((slot) => ({
			slot,
			slotType: "Hotbar" as SlotType,
			name: "",
			icon: "",
		})),
		...["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"].map((slot) => ({
			slot,
			slotType: "Backpack" as SlotType,
			name: "",
			icon: "",
		})),
	],
	currentSlot: "1",

	dossiers: defaultDossierData.map((dossier) => ({ ...dossier })),
	equippedDossier: { ...defaultDossierData[0] }, //later save the equipped dossier

	recycledDossierIDs: [],

	TotalPlaytime: 0,
};