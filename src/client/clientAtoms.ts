import { atom } from "@rbxts/charm";
import { DossierStore } from "./ui/stores/DossierStore";

export const pointedItem = atom<string | undefined>("");

export const pointedInstance = atom<Instance | undefined>();
export const isHoldingPistol = atom<boolean>(false);
export const isThirdPerson = atom<boolean>(false);
export const isDragging = atom<boolean>(false);

export const gameMenuOpen = atom<boolean>(false);
export const dossierMenuOpen = atom<boolean>(false);
export const dossierEditingOpen = atom<boolean>(false);
export const dossierBuildingOpen = atom<boolean>(false);

//purely visual. if you modify it from the client itd change the display but not the real stat on the server lol
export const maxHealthAtom = atom<number>(100);
export const maxBloodAtom = atom<number>(100);
export const maxStaminaAtom = atom<number>(100);
export const currentHealthAtom = atom<number>(80);
export const currentBloodAtom = atom<number>(80);
export const currentStaminaAtom = atom<number>(80);
export const activeStatusEffectsAtom = atom<StatusEffect[]>([]); //not to be confused with wcs statuseffect
export const hideViewmodel = atom<boolean>(false);

//misc
export const hideServerInfo = atom<boolean>(false);
export const regionAtom = atom<string>("unknown");
export const clientPing = atom<string>("00");

export const custom_color_dark = atom<Color3>(new Color3(0, 0, 0));
export const custom_color_mid_dark = atom<Color3>(new Color3(0.25, 0.25, 0.25));
export const custom_color_mid = atom<Color3>(new Color3(0.5, 0.5, 0.5));
export const custom_color_mid_light = atom<Color3>(new Color3(0.75, 0.75, 0.75));
export const custom_color_light = atom<Color3>(new Color3(1, 1, 1));

//npc state
export const updateNpcUiState = atom<NpcData>({
	entity: "100",
	npcType: "Civilian",
	outfit: "Office",
	ai: "lol",
	tags: [],
	state: "idle",
	dialogue: "Dialogue1",

	visibleInteractableEntities: [],
	alertness: 10,
	alertnessMultiplier: 1,
	morale: 0,
	moraleMultiplier: 1,
	hearingRange: 40,

	perks: [],
	statusEffects: [],
	systemsAtWork: ["System1", "System2", "System3"],
	displayPathfinding: false,
	highlighted: true,
	hostile: true,
});

export const updateEntityCounter = atom<WorldEntityData>();
export const currentlySelectedNpcCF = atom<CFrame>();
export const entityCountData = atom<WorldEntityData>();

export const equippedDossier = atom<DossierData>(); //currently equipped. you will spawn with this
export const equippedDossierActivePage = atom<"1" | "2">("1");
export const selectedPreviewDossier = atom<DossierData>(DossierStore.getEquipped()); //current selected. this build's data will be displayed
//havent figured out a way to select. probably just slap another button
export const currentlyEditedDossierData = atom<DossierData>(); //currently edited only
export const currentlyEditedDossierActivePage = atom<"1" | "2">("1");
