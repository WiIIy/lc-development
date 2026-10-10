/* eslint-disable roblox-ts/lua-truthiness */
import { Service, OnStart } from "@flamework/core";
import { Players, ReplicatedStorage, Teams, Workspace } from "@rbxts/services";
import ProfileStore, { Profile } from "@rbxts/profile-store";
import { RemoteEvents } from "server/network";
import { ref } from "@willy/jecs-utils";
import world from "shared/world";
import Components from "shared/components/components";
import { Entity, Id, Name, pair, TagDiscriminator, Wildcard } from "@rbxts/jecs";
import none from "shared/movesets/none";
import { Character, Skill } from "@rbxts/wcs";
import { ServerContext } from "shared/ServerContext";
import { AccessoryNames } from "shared/data/items/accessories/allaccessories";
import {
	ALL_THROWABLES,
	ALL_PISTOLS,
	ALL_SMGS,
	ALL_MELEE_WEAPONS,
	ALL_RIFLES,
	ALL_SNIPERS,
	CHAINSAW,
	MOLOTOV,
	FLASHLIGHT,
	JERRYCAN,
	LIGHTER,
	WALKMAN,
	DRONE,
	ANTLER,
	ALL_ITEMS,
	PICKUPABLE_PROPS,
	ALL_STACKABLE_ITEMS,
	ALL_FIREARMS,
	EMPTY_ITEM_NAME,
	VALID_HOTBAR_SLOTS,
	ItemAliases,
} from "shared/data/items/all";
import { ITEM_ICON_MAP } from "shared/data/items/icons";
import { ItemAssets } from "shared/data/items/modelassets";
import { AUDIO_PATH } from "shared/data/paths";
import { defaultProfileData } from "shared/data/profile/defaultProfileData";
import { findItemBySlot, findFirstEmptySlotIndex } from "shared/utils/profile/findInventoryItem";
// import {
// 	AccessoryAssets,
// 	AccessoryAddingCallBack,
// 	ItemAccessoryContainer,
// } from "shared/data/items/accessories/accessoryCode";
import { FIREARM_SETTINGS } from "shared/data/items/stats/gunStats";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { giveCharacterAccessory } from "shared/utils/visual/giveCharacterAccessory";
import { createEmptyItem } from "shared/utils/profile/createEmptyItem";
import { setDescendantCollisionGroup } from "shared/utils/world/setDescendant";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { MeleeWeapon } from "shared/skills";
import { Parry } from "shared/skills/parry";

const PROFILE_STORE_NAME = "PlayerInventoryData";

export const DataStore = ProfileStore.New(PROFILE_STORE_NAME, defaultProfileData);


export const Profiles = new Map<Player, Profile<ProfileData> | undefined>();
const SessionStart = new Map<Player, number>();

//throwable is a skill
//melee is a moveset
const SKILL_REGISTRY = [
	// { items: ALL_THROWABLES, skill: Throw },
	// { items: ALL_PISTOLS, skill: Pistol },
	// { items: ALL_SMGS, skill: Smg },
	{ items: ALL_MELEE_WEAPONS, skill: MeleeWeapon },
	// { items: ALL_RIFLES, skill: Rifle },
	// { items: ALL_SNIPERS, skill: Sniper },
	// { items: CHAINSAW, skill: Chainsaw },
	// { items: MOLOTOV, skill: Molotov },
	// { items: FLASHLIGHT, skill: Flashlight },
	// { items: JERRYCAN, skill: Jerrycan },
	// { items: LIGHTER, skill: Lighter },
	// { items: WALKMAN, skill: Walkman },
	// { items: DRONE, skill: Drone },
	// { items: ANTLER, skill: Antler },
];

@Service({})
export class InventoryService implements OnStart {
	constructor() {
		ServerContext.InventoryService = this;
	}

	onStart() {
		Players.PlayerAdded.Connect((player) => {
			this.playerAdded(player);
		});

		// Players.PlayerAdded.Connect((player) => {
		// 	player.CharacterAdded.Connect((character) => {
		// 		const profile = this.getProfile(player);

		// 		if (!profile) return;
		// 		this.equipAccessories(player, profile.Data.equippedDossier.skills);
		// 		if (player.Parent === Players) {
		// 			this.createInventoryEntities(player, profile.Data.Items);
		// 		}
		// 		print("Profile loaded for player ", player.Name);
		// 		this.syncClientInventory(player);

		// 		//TODO: consider which stats are given to player etc.
		// 		RemoteEvents.statisticsSync.fire(player, profile.Data.TotalPlaytime);
		// 	});
		// });

		Players.GetPlayers().forEach((player) => this.playerAdded(player));

		RemoteEvents.requestMoveOrSwapItem.connect((player, draggedSlot, targetSlot) => {
			this.moveOrSwapItemInProfile(player, draggedSlot, targetSlot);
		});

		RemoteEvents.requestEquipLoadout.connect((player: Player, dossierName: string) => {
			this.equipDossier(player, dossierName);
		});

		RemoteEvents.requestDropItem.connect((player, slot) => {
			const playerEntity = ref.find(player);
			const profile = this.getProfile(player);
			if (!playerEntity || !profile) return;

			const inventory = world.get(playerEntity, Components.Inventory);
			const itemEntity = inventory?.find((e) => {
				return world.get(e, Components.InventoryItem)?.slot === slot;
			});

			const carriedPropEntity = world.get(playerEntity, Components.CarriedProp);
			if (carriedPropEntity !== undefined) {
				this.dropProp(player, playerEntity, carriedPropEntity);
				return;
			}

			if (itemEntity !== undefined) {
				const newInv = inventory!.filter((e) => e !== itemEntity); // Move the entity from the Player's Inventory to the World
				world.set(playerEntity, Components.Inventory, newInv);

				// Remove Inventory tags and add World tags. This triggers the monitor in models.ts to spawn the model
				world.remove(itemEntity, Components.InventoryItem);
				world.add(itemEntity, Components.WorldItem);

				const dropCFrame = player.Character?.PrimaryPart?.CFrame.mul(new CFrame(0, 0, -5)) ?? new CFrame();
				world.set(itemEntity, Components.Transform, dropCFrame);
			}

			this.removeItemFromProfile(player, slot);
		});

		RemoteEvents.requestSetCurrentSlot.connect((player: Player, slotNumber: string) => {
			this.setCurrentSlotInProfile(player, slotNumber);
		});

		RemoteEvents.requestPickUpItem.connect((player, instance) => {
			const playerEntity = ref.find(player);

			if (playerEntity === undefined) return;
			const itemEntity = ref.find(instance); //reference to item entities is set to world items in itemhandling.ts
			// print("[INVSERVICE: REQUESTPICKUPITEM] entity", e, instance.Name);

			if (instance.Name === "Drone" && instance.Parent === Workspace) {
				const inventory = world.get(playerEntity, Components.Inventory);
				if (!inventory) return;

				// Search player's inventory for the Droneremote entity linked to THIS specific instance
				const remoteEntity = inventory.find((e) => {
					const d = world.get(e, Components.Drone);
					return d !== undefined && d.instance === instance;
				});

				if (remoteEntity) {
					// Success! The player has the matching remote. Recall it.
					instance.Destroy();
					const dData = world.get(remoteEntity, Components.Drone)!;
					world.set(remoteEntity, Components.Drone, {
						...dData,
						deployed: false,
						instance: undefined,
					});
					this.syncClientInventory(player);
					print(`${player.Name} recalled their drone.`);
				} else {
					// Player doesn't have the right remote
					print("You need the matching Drone Remote to pick this up!");
				}
				return;
			}

			if (ALL_ITEMS.includes(instance.Name)) {
				instance.Destroy();

				this.addItemToProfile(player, instance.Name, ITEM_ICON_MAP[instance.Name], itemEntity);
			} else if (PICKUPABLE_PROPS.includes(instance.Name)) {
				print("PROP PICKUP");
				//prop handling
				if (world.get(playerEntity, Components.CarriedProp) !== undefined) return;

				// 2. Reject if the current hotbar slot is occupied
				const profile = this.getProfile(player);
				if (!profile) return;
				const currentSlotItem = findItemBySlot(profile.Data.Items, "H" + profile.Data.currentSlot);

				if (currentSlotItem && currentSlotItem.name !== EMPTY_ITEM_NAME) {
					return; // Current hand is not empty!
				}

				// 3. Pick up and equip the prop
				const propName = instance.Name;
				instance.Destroy();
				this.equipProp(player, playerEntity, propName);
			}
		});
	}

	private playerAdded(player: Player) {
		const profile = DataStore.StartSessionAsync(`${player.UserId}`, {
			Cancel: () => {
				return player.Parent !== Players;
			},
		});

		if (profile) {
			SessionStart.set(player, os.time());
			profile.AddUserId(player.UserId);
			profile.Reconcile();

			//these lines reset your items
			// profile.Data.Items = defaultProfileData.Items.map((item) => ({ ...item }));
			// print(profile.Data.Items);

			// print("CLEAR!")
			// profile.Data.dossiers.clear();
			// profile.Data.dossiers = defaultDossierData.map((dossier) => ({ ...dossier }));
			// profile.Data.equippedDossier = profile.Data.dossiers[0];

			// this.equipAccessories(player, profile.Data.equippedDossier.build.skills);

			if (player.Parent === Players) {
				Profiles.set(player, profile);

				this.createInventoryEntities(player, profile.Data.Items);
				print("Profile loaded for player ", player.Name);
				this.syncClientInventory(player);

				//TODO: consider which stats are given to player etc.
				RemoteEvents.dossierSync.fire(player, profile.Data.dossiers);
				RemoteEvents.statisticsSync.fire(player, profile.Data.TotalPlaytime);
			} else {
				profile.EndSession();
			}
		} else {
			player.Kick("profile load fail");
		}
	}

	public getProfile(player: Player): Profile<ProfileData> | undefined {
		return Profiles.get(player);
	}

	/** Broadcasts server data for client displaying (changing items, dropping item cleanup, etc) */
	public syncClientInventory(player: Player) {
		const profile = this.getProfile(player);
		// print("syncing");
		if (!profile) return;

		// Keep profile item stats synced with ECS item entity state
		this.syncItemComponentsToProfile(player);

		RemoteEvents.inventorySync.fire(player, profile.Data.Items, profile.Data.currentSlot);
		const currentSlotItem = findItemBySlot(profile.Data.Items, "H" + profile.Data.currentSlot) as ItemData;
		const playerEntity = ref.find(player);
		const assetModel = ItemAssets[currentSlotItem.name];

		const currentItemName = currentSlotItem?.name ?? EMPTY_ITEM_NAME;
		this.syncItemAccessories(player, profile.Data.Items, currentItemName);

		// print(playerEntity);
		if (playerEntity === undefined) return;
		if (world.get(playerEntity, Components.CarriedProp) !== undefined) return; //dont sync inventory if carrying prop

		const wcsCharacter = world.get(playerEntity, Components.WCSCharacter);
		const oldItemEntity = world.target(playerEntity, Components.CurrentlyEquipped);

		// print(wcsCharacter, oldItemEntity)
		if (oldItemEntity !== undefined) {
			// print("WIPED OLD RELATIONSHIP", world.target(playerEntity, Components.CurrentlyEquipped));
			world.remove(playerEntity, pair(Components.CurrentlyEquipped, oldItemEntity)); //item entity persists.relationship is severed
			world.remove(oldItemEntity, Components.ItemModel); //prevent flinging when re equipping
			world.set(playerEntity, Components.AnimationQueue, []); //clear animations

			SKILL_REGISTRY.forEach((entry) => {
				wcsCharacter?.GetSkillFromConstructor(entry.skill as never)?.Destroy(); //remove all previous skills
			});
			wcsCharacter?.GetSkillFromConstructor(Parry)?.Destroy(); //parry class has different animations depending on current item
		}

		//========== Manage equipping item ====================//

		const inventory = world.get(playerEntity, Components.Inventory);
		// print(inventory, currentSlotItem.name)
		if (inventory === undefined) return;

		if (currentSlotItem.name === undefined || currentSlotItem.name === EMPTY_ITEM_NAME) {
			//ignored if slot is empty
			return;
		}

		if (!assetModel) {
			print("SYNCCLIENTINVENTORY: asset model missing");
			return;
		}

		const itemEntity = inventory.find((e) => {
			const data = world.get(e, Components.InventoryItem) as { slot: string; slotType: SlotType };
			if (data === undefined) return false;
			return data.slot === "H" + profile.Data.currentSlot;
		});

		if (itemEntity === undefined) return;

		//set new item before registering skill
		const soundFolder = (AUDIO_PATH.ItemSounds.Melee.Fists) as ItemSounds;

		world.set(itemEntity, Components.ItemModel, {
			baseModel: assetModel, //the template is passed, not a clone, cloning is handled within observers
			soundFolder: soundFolder,
		});
		//after it gets auto cloned the componnent correctly has the item

		// print("setting currentlyequipped", world.has(playerEntity, pair(Components.CurrentlyEquipped, Wildcard)));
		world.set(playerEntity, pair(Components.CurrentlyEquipped, itemEntity) as Id, currentSlotItem.name);
		// print("done setting currentlyequipped", world.has(playerEntity, pair(Components.CurrentlyEquipped, Wildcard)));

		const item = world.get(itemEntity, Components.ItemModel);
		const char = world.get(playerEntity, Components.Model);

		if (!item || !char) {
			print("no item or model component");
			return;
		}

		if (item?.baseModel) {
			item!.baseModel.Parent = char;
		}

		const charAsModel = char as Model;
		//---- item checks ------------//
		if (!wcsCharacter) {
			print("no wcs character");
			return;
		}

		//can parry only if holding item
		if (!wcsCharacter.GetSkillFromConstructor(Parry)) {
			new Parry(wcsCharacter!);
		}

		// eslint-disable-next-line prettier/prettier

		// animation handling is handled in animation.ts by an observer

		//assign skill depending on item type within skill registry
		for (const entry of SKILL_REGISTRY) {
			const shouldHaveSkill = (entry.items as readonly string[]).includes(currentSlotItem.name);
			wcsCharacter.SkillAdded.Fire(entry.skill as never);

			this.reconcileSkill(wcsCharacter, entry.skill, shouldHaveSkill, charAsModel);
		}
	}

	/**this function only sends the inventorySync remote, updates just data, not repacking the whole item entity (for ammo displays)*/
	public updateClientInventory(player: Player) {
		const profile = this.getProfile(player);

		if (!profile) return;

		this.syncItemComponentsToProfile(player);

		RemoteEvents.inventorySync.fire(player, profile.Data.Items, profile.Data.currentSlot);
	}

	public getCurrentHotbarSlot(player: Player): string | undefined {
		//returns H[slot]
		const profile = this.getProfile(player);
		if (!profile) return;
		return "H" + profile.Data.currentSlot;
	}

	// --- Inventory Modification Methods ---

	/* existingEntity = undefined means the entity is newly created. this will always use the existing entity if one exists for that item */
	public addItemToProfile(
		player: Player,
		itemName: string,
		iconId: string,
		existingEntity: Entity | undefined,
	): boolean {
		// print("attempt to add item");
		const profile = this.getProfile(player);
		if (!profile) return false;

		const inventory = profile.Data.Items;
		const numericSlot = profile.Data.currentSlot;
		const fullHotbarSlotId = `H${numericSlot}`;

		const isStackable = ALL_STACKABLE_ITEMS.includes(itemName);

		if (isStackable) {
			// Find first existing item with the same name anywhere in inventory
			const existingStackIndex = inventory.findIndex((i) => i.name === itemName);

			if (existingStackIndex !== -1) {
				// Ensure current amount exists, default to 1 if somehow missing on a non-empty item
				const currentAmount = inventory[existingStackIndex].amount || 1;
				inventory[existingStackIndex].amount = currentAmount + 1;

				print(
					`[AddItem] Player ${player.Name} stacked ${itemName}. New amount: ${inventory[existingStackIndex].amount}`,
				);
				this.syncClientInventory(player);
				return true;
			}
		}

		let targetIndex = -1;
		let isUpdatingCurrentSlot = false;

		// check if the player's currentSlot is empty
		const currentSlotIndex = inventory.findIndex((i) => i.slot === fullHotbarSlotId);

		if (currentSlotIndex !== -1 && inventory[currentSlotIndex].name === EMPTY_ITEM_NAME) {
			// if hotbar slot is empty, put the new item in this slot
			targetIndex = currentSlotIndex;
			isUpdatingCurrentSlot = true;
		} else {
			// if the currentSlot is not empty -> find the first general empty slot
			targetIndex = findFirstEmptySlotIndex(inventory);
		}

		if (targetIndex !== -1) {
			// Modifying profile.Data directly triggers the library's internal change detection
			const newItem: ItemData = {
				slot: inventory[targetIndex].slot,
				slotType: inventory[targetIndex].slotType,
				name: itemName,
				icon: iconId,
				amount: 1,
			};

			if (!existingEntity) {
				if (ALL_FIREARMS.includes(itemName)) {
					const capacity = FIREARM_SETTINGS[itemName as keyof typeof FIREARM_SETTINGS].CAPACITY;
					newItem.currentAmmo = capacity;
					newItem.maxAmmo = capacity;
				}

				if (CHAINSAW.includes(itemName)) {
					newItem.currentFuel = 50;
					newItem.maxFuel = 100;
					newItem.overheated = false;
				}
			}

			inventory[targetIndex] = newItem;

			this.makeItemToEntity(player, inventory[targetIndex], existingEntity);

			if (isUpdatingCurrentSlot) {
				print(
					`[AddItem] Player ${player.Name} automatically placed ${itemName} into current slot: ${fullHotbarSlotId}`,
				);
			} else {
				print(`[AddItem] Player ${player.Name} placed ${itemName} into empty slot at index: ${targetIndex}`);
			}

			this.syncClientInventory(player);
			return true;
		}

		// No empty slot found
		return false;
	}

	public setCurrentSlotInProfile(player: Player, slotNumber: string): boolean {
		const profile = this.getProfile(player);
		const playerEntity = ref.find(player);
		// print(profile, playerEntity)
		if (!profile) return false;
		if (playerEntity === undefined) return false;

		//insert conditions where you cant switch items here
		const char = player.Character;
		const wcsChar = Character.GetCharacterFromInstance(char!);
		// const molotovSkill = wcsChar?.GetSkillFromConstructor(Molotov);
		// // print(char, wcsChar)
		// if (molotovSkill?.molotovIsLit) {
		// 	print("molotov is lit cant switch slots");
		// 	return false;
		// }

		// const droneSkill = wcsChar?.GetSkillFromConstructor(Drone);
		// if (droneSkill?.isViewingFeed) {
		// 	print("drone is viewing feed cant switch slots");
		// 	return false;
		// }

		if (!VALID_HOTBAR_SLOTS.includes(slotNumber)) {
			warn(`[SetCurrentSlot] Player ${player.Name} attempted to set invalid slot: ${slotNumber}`);
			return false;
		}

		if (profile.Data.currentSlot === slotNumber) {
			return true;
		}

		if (playerEntity && world.get(playerEntity, Components.CarriedProp) !== undefined) {
			return false; // Can't switch slots with a prop in hands
		}

		// Modifying Data tracks changes automatically
		profile.Data.currentSlot = slotNumber;

		this.syncClientInventory(player);
		// print(`[SetCurrentSlot] Player ${player.Name} selected slot ${slotNumber}`);
		return true;
	}

	public moveOrSwapItemInProfile(player: Player, draggedSlot: string, targetSlot: string): boolean {
		const profile = this.getProfile(player);
		const playerEntity = ref.find(player);
		if (!profile || !playerEntity) return false;

		const currentActiveSlotId = "H" + profile.Data.currentSlot;
		const inventoryComponent = world.get(playerEntity, Components.Inventory);

		//Update ECS InventoryItem Component
		const targetSlotType: SlotType = targetSlot.sub(1, 1) === "B" ? "Backpack" : "Hotbar";
		const draggedSlotType: SlotType = draggedSlot.sub(1, 1) === "B" ? "Backpack" : "Hotbar";

		const draggedItemEntity = inventoryComponent?.find((e) => {
			const data = world.get(e, Components.InventoryItem);
			if (data === undefined) return false;
			return data?.slot === draggedSlot;
		});

		const targetItemEntity = inventoryComponent?.find((e) => {
			const data = world.get(e, Components.InventoryItem);
			if (data === undefined) return false;
			return data?.slot === targetSlot;
		});

		if (draggedItemEntity) {
			world.set(draggedItemEntity, Components.InventoryItem, {
				slot: targetSlot,
				slotType: targetSlotType,
			});
		}

		if (targetItemEntity) {
			world.set(targetItemEntity, Components.InventoryItem, {
				slot: draggedSlot,
				slotType: draggedSlotType,
			});
		}

		//----- set in profile store
		const inventory = profile.Data.Items;
		const draggedIndex = inventory.findIndex((i) => i.slot === draggedSlot);
		const targetIndex = inventory.findIndex((i) => i.slot === targetSlot);

		if (draggedIndex === -1 || targetIndex === -1) return false;

		const draggedItem: ItemData = inventory[draggedIndex];
		const targetItem: ItemData = inventory[targetIndex];

		if (draggedItem.name === EMPTY_ITEM_NAME) return false;

		inventory[targetIndex] = {
			...draggedItem,
			slot: targetItem.slot,
			slotType: targetItem.slotType,
		};
		inventory[draggedIndex] = {
			...targetItem,
			slot: draggedItem.slot,
			slotType: draggedItem.slotType,
		};

		this.syncClientInventory(player);
		print(`[MoveOrSwap] Player ${player.Name} moved ${draggedSlot} to ${targetSlot}`);
		return true;
	}

	public removeItemFromProfile(player: Player, slot: string): boolean {
		const profile = this.getProfile(player);
		const playerEntity = ref.find(player);
		if (!profile || !playerEntity) return false;

		const inventory = profile.Data.Items;
		const droppedIndex = inventory.findIndex((i) => i.slot === slot);

		if (droppedIndex === -1) return false;

		const item = inventory[droppedIndex];
		if (item.name === EMPTY_ITEM_NAME) return false;

		//Purge item from ECS inventory
		const ecsInventory = world.get(playerEntity, Components.Inventory);
		if (ecsInventory) {
			const itemEntity = ecsInventory.find((e) => {
				const data = world.get(e, Components.InventoryItem);
				return data?.slot === slot;
			});

			if (itemEntity !== undefined) {
				// The entity is still in the inventory. This means it was consumed (like Molotov).
				// Remove it from the inventory array and delete it completely!
				const newInv = ecsInventory.filter((e) => e !== itemEntity);
				world.set(playerEntity, Components.Inventory, newInv);
				world.delete(itemEntity);
			}
		}

		inventory[droppedIndex] = createEmptyItem(item.slot, item.slotType);

		this.syncClientInventory(player);
		print(`[RemoveItem] Player ${player.Name} dropped item ${item.name} from slot ${slot}`);
		return true;
	}

	// --- Main function for swapping loadouts
	public equipDossier(player: Player, dossierName: string) {
		const profile = this.getProfile(player);
		if (!profile) return;

		// Find the selected dossier in the profile data
		const newDossier = profile.Data.dossiers.find((d) => d.build.buildName === dossierName);
		print("newDossier: ", newDossier, dossierName, profile.Data.dossiers);
		if (!newDossier) return;

		profile.Data.equippedDossier = newDossier;

		this.clearPlayerInventory(profile); // Clear current inventory and game-specific accessories
		// this.clearGameAccessories(player);
		RemoteEvents.deleteAccessoriesFromPlayerViewmodel(player);

		// const itemsToEquip = [newDossier.item1, newDossier.item2, newDossier.item3, newDossier.item4]; //Grant new loadout items

		// this.equipItem(player, itemsToEquip[0]);
		// this.equipItem(player, itemsToEquip[1]);
		// this.equipItem(player, itemsToEquip[2]);
		// this.equipItem(player, itemsToEquip[3]);

		// this.equipAccessories(player, newDossier.build.skills); // Equip new accessories based on the new skills

		this.syncClientInventory(player); // Push updates to the client
		print(`Successfully equipped loadout [${dossierName}] for ${player.Name}`);
	}

	private equipItem(player: Player, item: string | { item: string; amount?: number } | undefined) {
		if (item === undefined) return;

		let itemName = "";
		let amount = 1;

		if (typeOf(item) === "string") {
			itemName = item as string;
		} else {
			const itemObj = item as { item: string; amount?: number };
			itemName = itemObj.item;
			amount = itemObj.amount ?? 1;
		}

		if (itemName === "TBA" || itemName === "None") return;

		const internalName = ItemAliases[itemName] ?? itemName; // Convert external dossier name to internal asset name ---

		if (ALL_ITEMS.includes(internalName)) {
			// Use internalName for all subsequent checks
			if (!ALL_FIREARMS.includes(internalName)) {
				for (let i = 0; i < amount; i++) {
					this.addItemToProfile(player, internalName, ITEM_ICON_MAP[internalName] || "", undefined);
				}
			} else {
				//firearm amount coresponds to bullet. you do not have 15 R50 guns
				this.addItemToProfile(player, internalName, ITEM_ICON_MAP[internalName] || "", undefined);
			}
		} else {
			print(
				`[${itemName}] (Internal: ${internalName}) doesn't exist yet! Attempted to give loadout to ${player.Name}`,
			);
		}
	}

	// Helper: Wipes the hotbar and backpack
	private clearPlayerInventory(profile: Profile<ProfileData>) {
		profile.Data.Items.forEach((item) => {
			item.name = EMPTY_ITEM_NAME;
			item.icon = "";
			item.amount = 0;
		});
		profile.Data.currentSlot = "1";
	}

	// Destroys game-assigned accessories without touching base Roblox avatar accessories
	// private clearGameAccessories(player: Player) {
	// 	const character = player.Character;
	// 	if (!character) return;

	// 	const gameAccessoryNames = new Set<string>(); // Collect the exact names of all custom assets
	// 	// eslint-disable-next-line roblox-ts/no-array-pairs
	// 	for (const [_, asset] of pairs(AccessoryAssets)) {
	// 		if (asset) gameAccessoryNames.add((asset as { Name: string }).Name);
	// 	}

	// 	character.GetChildren().forEach((child) => {
	// 		// Iterate through the character and destroy matching accessories
	// 		if (child.IsA("Accessory") && gameAccessoryNames.has(child.Name)) {
	// 			child.Destroy();
	// 		}
	// 	});
	// }

	// Takes skill array and calls skill equipping callbacks
	// public equipAccessories(player: Player, SkillList: string[]) {
	// 	const character = player.Character;
	// 	if (!character) return;

	// 	SkillList.forEach((skillName) => {
	// 		const internalName = AccessoryNames[skillName];
	// 		// print(skillName, internalName);
	// 		if (!internalName) return; // If the skill isn't mapped to an accessory, safely skip it.

	// 		// Resolve the exact key using the internal name mapped above
	// 		const callback = AccessoryAddingCallBack[internalName];

	// 		if (callback) {
	// 			task.spawn(() => callback(player)); // Run in separate thread
	// 		}
	// 	});
	// }

	private reconcileSkill(
		wcsCharacter: Character,
		SkillConstructor: new (character: Character) => Skill,
		shouldHave: boolean,
		charModel: Model,
	) {
		const existingSkill = wcsCharacter.GetSkillFromConstructor(SkillConstructor as never);

		if (shouldHave) {
			// print("should have", SkillConstructor);
			if (!existingSkill) {
				const newSkill = new SkillConstructor(wcsCharacter);
				// print("skill equipped" , newSkill.GetName(), shouldHave);
				newSkill.Destroyed.Connect(() => {
					AnimationUtils.clearAllAnimations(charModel, 0.2, ["carrying", "dragging1", "dragging2"]);
				});
			}
		} else {
			if (existingSkill) {
				// Hook up cleanup logic before destroying
				existingSkill.Destroyed.Connect(() => {
					print("does this even run bro");
					AnimationUtils.clearAllAnimations(charModel, 0.2, ["carrying", "dragging1", "dragging2"]);
				});
				existingSkill.Destroy();
			}
		}
	}

	//
	//
	//   ==========================   ECS UTILS    ========================= //
	//
	//

	createInventoryEntities(player: Player, items: ItemData[]) {
		for (const item of items) {
			if (item.name !== EMPTY_ITEM_NAME) {
				this.makeItemToEntity(player, item, undefined);
			}
		}
	}

	makeItemToEntity(player: Player, item: ItemData, existingEntity: Entity | undefined) {
		const playerEntity = ref.find(player);
		if (playerEntity === undefined) return;

		const inv = world.get(playerEntity, Components.Inventory);
		if (inv === undefined) return;

		// 1. Reuse the existing entity, or create a new one if it doesn't exist
		const itemEntity = existingEntity ?? world.entity();

		world.set(itemEntity, Name, item.name);

		world.set(itemEntity, Components.InventoryItem, {
			slot: item.slot,
			slotType: item.slotType,
		});

		// 2. If it's recovered, clean up World tags. If new, set up default states.
		if (existingEntity) {
			world.remove(itemEntity, Components.WorldItem);
			world.remove(itemEntity, Components.Transform);
		} else {
			// Initialize default data strictly for NEW entities
			if (CHAINSAW.includes(item.name)) {
				const startingFuel = 50;
				world.set(itemEntity, Components.Chainsaw, {
					fuel: startingFuel,
					temp: 30,
					overheated: false,
				});
				item.currentFuel = item.currentFuel ?? startingFuel;
				item.maxFuel = item.maxFuel ?? 100;
				item.overheated = item.overheated ?? false;
			}

			if (ALL_FIREARMS.includes(item.name)) {
				const capacity = FIREARM_SETTINGS[item.name as keyof typeof FIREARM_SETTINGS].CAPACITY;
				world.set(itemEntity, Components.ChamberedAmmo, capacity);
				item.currentAmmo = item.currentAmmo ?? capacity;
				item.maxAmmo = item.maxAmmo ?? capacity;
			}

			if (DRONE.includes(item.name)) {
				world.set(itemEntity, Components.Drone, {
					deployed: false,
					speed: 15,
					cframe: new CFrame(),
					instance: undefined,
				});
			}
		}

		const newInv = [...inv];
		newInv.push(itemEntity);

		world.set(playerEntity, Components.Inventory, newInv);
	}

	private syncItemComponentsToProfile(player: Player) {
		const profile = this.getProfile(player);
		if (!profile) return;

		const playerEntity = ref.find(player);
		if (!playerEntity) return;

		const inventoryEntities = world.get(playerEntity, Components.Inventory);
		if (!inventoryEntities) return;

		for (const entity of inventoryEntities) {
			const invData = world.get(entity, Components.InventoryItem);
			if (!invData) continue;

			const item = profile.Data.Items.find((i) => i.slot === invData.slot);
			if (!item || item.name === "") continue;

			if (ALL_FIREARMS.includes(item.name)) {
				const ammo = world.get(entity, Components.ChamberedAmmo);
				const capacity = FIREARM_SETTINGS[item.name as keyof typeof FIREARM_SETTINGS].CAPACITY;
				if (ammo !== undefined) item.currentAmmo = ammo;
				item.maxAmmo = capacity;
			}

			if (CHAINSAW.includes(item.name)) {
				const chainsawData = world.get(entity, Components.Chainsaw);
				if (chainsawData) {
					item.currentFuel = chainsawData.fuel;
					const defaultFuelCapacity = 50;
					item.maxFuel = item.maxFuel ?? defaultFuelCapacity;
					item.overheated = chainsawData.overheated;
				}
			}

			if (DRONE.includes(item.name)) {
				const droneData = world.get(entity, Components.Drone);
				if (droneData) {
					item.droneDeployed = droneData.deployed ?? false;
					item.droneSpeed = droneData.speed ?? 15;
				}
			}
		}
	}

	private syncItemAccessories(player: Player, inventory: ItemData[], equippedItemName: string) {
		const character = player.Character;
		if (!character) return;

		// 1. Calculate the total count of each item in the player's inventory
		const itemCounts = new Map<string, number>();
		for (const item of inventory) {
			if (item.name && item.name !== EMPTY_ITEM_NAME) {
				itemCounts.set(item.name, (itemCounts.get(item.name) ?? 0) + 1);
			}
		}

		// 2. Subtract the currently equipped item
		if (equippedItemName && equippedItemName !== EMPTY_ITEM_NAME) {
			const currentCount = itemCounts.get(equippedItemName) ?? 0;
			if (currentCount > 0) {
				itemCounts.set(equippedItemName, currentCount - 1);
			}
		}

		// 3. Evaluate and apply/remove accessories dynamically
		// for (const acc of ItemAccessoryContainer.GetChildren()) {
		// 	if (!acc.IsA("Accessory")) continue;

		// 	const itemName = acc.Name;
		// 	const shouldHaveAccessory = (itemCounts.get(itemName) ?? 0) > 0;

		// 	// Strictly search for an Accessory to ignore lingering weapon models
		// 	const existingAccessory = character
		// 		.GetChildren()
		// 		.find((child) => child.Name === itemName && child.IsA("Accessory")) as Accessory | undefined;

		// 	if (shouldHaveAccessory && !existingAccessory) {
		// 		// Always clone the accessory so the original stays in ReplicatedStorage
		// 		giveCharacterAccessory(character, acc.Clone() as Accessory);
		// 	} else if (!shouldHaveAccessory && existingAccessory) {
		// 		existingAccessory.Destroy();
		// 	}
		// }
	}

	private equipProp(player: Player, playerEntity: Entity, propName: string) {
		const propEntity = world.entity(); // Create ECS Entity for the Prop
		world.set(propEntity, Name, propName); //Props are items not stored in the inventory
		world.add(propEntity, Components.Prop);

		// Mark the player as carrying this specific prop
		world.set(playerEntity, Components.CarriedProp, propEntity);

		// Clear existing currently equipped item (safeguard)
		const oldItemEntity = world.target(playerEntity, Components.CurrentlyEquipped);
		if (oldItemEntity !== undefined) {
			world.remove(playerEntity, pair(Components.CurrentlyEquipped, oldItemEntity));
			world.remove(oldItemEntity, Components.ItemModel);
		}

		// 4. Assign model and equip (similar to regular items)
		const assetModel = ItemAssets[propName];
		if (assetModel) {
			const soundFolder = (AUDIO_PATH.ItemSounds.Melee.Fists) as ItemSounds;

			world.set(propEntity, Components.ItemModel, {
				baseModel: assetModel,
				soundFolder: soundFolder,
			});

			// Setting this pair automatically triggers the ViewmodelController on the client
			world.set(playerEntity, pair(Components.CurrentlyEquipped, propEntity) as Id, propName);

			// const char = world.get(playerEntity, Components.Model);
			// if (char && assetModel) {
			// 	assetModel.Parent = char as Model;
			// }

			// Apply Prop Animations
			const itemAnims = ANIMATION_IDS.item[propName as keyof typeof ANIMATION_IDS.item];
			if (itemAnims) {
				const fullSequence: string[] = [];
				if (itemAnims.equipping) fullSequence.push(itemAnims.equipping);
				if (itemAnims.idling) fullSequence.push(itemAnims.idling);
				world.set(playerEntity, Components.AnimationQueue, fullSequence);
			} else {
				world.set(playerEntity, Components.AnimationQueue, []);
			}
		}
	}

	private dropProp(player: Player, playerEntity: Entity, propEntity: Entity) {
		const propName = world.get(propEntity, Name) as string;

		world.remove(playerEntity, Components.CarriedProp); // Remove Carried States
		world.remove(playerEntity, pair(Components.CurrentlyEquipped, propEntity));
		world.set(playerEntity, Components.AnimationQueue, []);

		// 2. Spawn physical prop back into the Workspace
		// Note: Later, you can assign your CollectionService tags to this clone
		const assetModel = ItemAssets[propName];
		if (assetModel) {
			const clone = assetModel.Clone();
			clone.Parent = Workspace;
			const dropCFrame = player.Character?.PrimaryPart?.CFrame.mul(new CFrame(0, 0, -5)) ?? new CFrame();
			print(dropCFrame, clone, clone.Parent);
			setDescendantCollisionGroup(clone, "Default");
			clone.PivotTo(dropCFrame);
			clone.Parent = Workspace; // Or your specific PropsContainer
		}

		// 3. Destroy the ECS Prop Entity
		world.delete(propEntity);

		// 4. Resync normal inventory to pull out whatever is currently selected in the hotbar
		this.syncClientInventory(player);
	}

	public refreshCurrentSlot(player: Player) {
		const profile = this.getProfile(player);
		if (!profile) return;

		// Get current slot from profile (e.g. "1") and re-run set logic
		const currentSlot = profile.Data.currentSlot ?? "1";
		this.setCurrentSlotInProfile(player, currentSlot); // force re-equip even if slot number didn't change
	}
}
