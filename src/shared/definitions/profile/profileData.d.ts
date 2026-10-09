type ProfileData = {
	Scrips: number;
	Items: ItemData[]; // The consolidated, single list of ALL inventory slots (Hotbar + Backpack)
	currentSlot: string;
	// Mods: AccessoryKey[]; //mods are

	//old
	dossiers: DossierData[];
	equippedDossier: DossierData;

	recycledDossierIDs: string[];

	TotalPlaytime: number; // seconds
}
