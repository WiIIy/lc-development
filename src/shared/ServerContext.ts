import { ReplicatedStorage } from "@rbxts/services";
import type { DamageRequest } from "server/services/DamageService";
import { ProfileData } from "./data/ProfileData";
import { Profile } from "@rbxts/profile-store";
import { Entity } from "@rbxts/replecs/out/jecs";

// shared interface for server stuff
export interface IInventoryService {
	syncClientInventory(player: Player): void;
	updateClientInventory(player: Player): void;
	addItemToProfile(player: Player, itemName: string, iconId: string, existingEntity: Entity | undefined): boolean;
	setCurrentSlotInProfile(player: Player, slotNumber: string): boolean;
	moveOrSwapItemInProfile(player: Player, draggedSlot: string, targetSlot: string): boolean;
	removeItemFromProfile(player: Player, slot: string): boolean;
	equipDossier(player: Player, dossierName: string): void;
	getCurrentHotbarSlot(player: Player): string | undefined;
	getProfile(player: Player): Profile<ProfileData> | undefined;
}

export interface IDamageService {
	processHit(request: DamageRequest): void;
}

// Export a global container
export const ServerContext = {
	InventoryService: undefined as IInventoryService | undefined,
	DamageService: undefined as IDamageService | undefined,
};
