import { useState, useEffect } from "@rbxts/react";
import { DossierStore } from "../stores/DossierStore";

/**
 * A custom hook to subscribe to the client-side Dossier state.
 * Returns the array of DossierData.
 */
export function useDossier(): DossierData[] {
	const [dossiers, setDossiers] = useState<DossierData[]>(() => DossierStore.getDossiers());

	useEffect(() => {
		const connection = DossierStore.onChange(() => {
			// Pull fresh dossiers and spread into a new array reference for React
			setDossiers([...DossierStore.getDossiers()]);
		});

		return () => connection.Disconnect();
	}, []);

	return dossiers;
}
