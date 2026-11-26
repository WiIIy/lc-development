import { Entity } from "@rbxts/jecs";
import world from "../world";
import { component } from "shared/utils/ecs/componentUtil";

export const ItemComponents = {
	//Item related
	Item: component<{ name: string }>(),

	ChamberedAmmo: component<number>(),
	NpcOwnedAmmo: component<number>(),

	Chainsaw: component<{
		fuel: number;
		temp: number;
		overheated: boolean;
	}>(),

	Drone: component<{
		deployed: boolean;
		instance: Model | undefined;
		speed: number;
		cframe: CFrame;
	}>(),

	Owner: component<Entity>(),
	WorldItem: world.entity(), // item exists in world
	InventoryItem: component<{ slot: string; slotType: SlotType }>(), // item inside inventory

	Prop: world.entity(), // Tag to mark entities as props
	CarriedProp: component<Entity>(), // Stores the entity ID of the prop a player is carrying

	//generic melee = CharacterMotor6D, MeleeAnimationData
	// static MeleeAnimationData = world.component<MeleeAnimationData>();

	ItemContainerObject: component<ItemContainerObject>(),

	Merchant: component<{ merchantName: string; wares: [] }>(),

	// Reload state
	IsReloading: component<boolean>(),
};