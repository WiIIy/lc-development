import { atom } from "@rbxts/charm";

export const GAME_VERSION = "0.0.1 pre-alpha";

//client
export const displayedDamages = atom<{ id: number; value: number }[]>([]);
export const isAiming = atom<boolean>(false);
export const monologue = atom<string>("");
export const hotbarLocked = atom<boolean>(false);
export const isDroneFocusing = atom(false);

export const droneDeployed = atom(false);
export const isHoldingThrow = atom(false);
export const antlerDebuggerDisplaying = atom(false);

export const gameMenuOpen = atom<boolean>(false);
export const dossierMenuOpen = atom<boolean>(false);
export const dossierEditingOpen = atom<boolean>(false);
export const dossierBuildingOpen = atom<boolean>(false);
export const debugMenuDisplaying = atom<boolean>(false);

//server
export const enemyList = atom<Model[]>([]); //
