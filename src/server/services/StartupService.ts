//prime server-side testing ground file
import { OnStart, Service } from "@flamework/core";
import world from "shared/world";
import { Players, RunService, Workspace } from "@rbxts/services";
import { Components } from "shared/components/components";
import { Entity, Id, Name, OnRemove, pair, Tag, TagDiscriminator, Wildcard } from "@rbxts/jecs";
import Replecs from "@rbxts/replecs";
import { promiseR6 } from "@rbxts/promise-character";
import { Character } from "@rbxts/wcs";
import { Dash } from "shared/skills/dash";
import { RemoteEvents } from "server/network";
import { Mark } from "shared/skills/mark";
import Make from "@rbxts/make";
// import { Crouch } from "shared/skills/crouch";
import { InventoryService } from "./InventoryService";
import { ref } from "@willy/jecs-utils";
import { carryRagdolledCharacter } from "shared/utils/npc/interaction/carryRagdollCharacter";
import { dragRagdolledCharacter } from "shared/utils/npc/interaction/dragRagdollCharacter";
import { dropCarriedCharacter } from "shared/utils/npc/interaction/dropRagdollCharacter";
import { ragdollCharacter } from "shared/utils/npc/interaction/ragdollCharacter";
import { AnimationUtils } from "shared/utils/visual/animationUtil";
import { ANIMATION_IDS } from "shared/data/assetid/animationIDs";
import { MeleeLight } from "shared/skills/base/light";
import { MeleeHeavy } from "shared/skills/base/heavy";
import { MeleeBlock } from "shared/skills/base/block";
import { MeleeShove } from "shared/skills/base/shove";
import { setupEvilWilly } from "shared/skills/npc/evilWilly";
import { scheduler } from "shared/scheduler";
import { setupJabby } from "shared/systems/jabby";
import { server } from "shared/network";

interface AnimationValue extends StringValue {
	WalkAnim: Animation;
}

interface RunValue extends StringValue {
	RunAnim: Animation;
}

// Combine them into a type for the script itself
interface AnimateScript extends LocalScript {
	walk: AnimationValue;
	run: RunValue;
}

@Service({})
class StartUpService implements OnStart {
	constructor(private readonly inventoryService: InventoryService) {}

	onStart() {
		setupJabby()
		//this is all it takes to put it in character's hand
		// world.set(character, pair(Components.CurrentlyEquipped, batEntity) as Id, "Baseballbat");

		Players.PlayerAdded.Connect((plr) => {
			const playerEntity = ref(plr); //creates entity with reference to player instance, returns the entity, not a component ig? (components are entities but entities arent always components)
			world.set(playerEntity, Name, plr.Name);
			world.add(playerEntity, Replecs.networked as unknown as Id<TagDiscriminator>);
			// world.set(playerEntity, Components.PlayerString, plr.Name);
			// print("set player string");

			// example of marking an entity as replicated, dont forget to put the component in sharedcomponents.ts
			// world.set(playerEntity, Components.Test, "test");
			// world.add(playerEntity, Replecs.networked as unknown as Id<TagDiscriminator>);
			// world.add(playerEntity, pair(Replecs.reliable, Components.Test) as unknown as Id<TagDiscriminator>);

			plr.CharacterAdded.Connect(async (character) => {
				// print("new new new");
				const charR6 = await promiseR6(character);
				// world.set(playerEntity, Components.Character, charR6); //i feel like ths is a ton of data to save and be iterated
				// world.set(playerEntity, Components.Model, charR6); //to fix
				world.set(playerEntity, Components.Transform, charR6.HumanoidRootPart.CFrame);
				world.set(playerEntity, Components.Player, plr); //doesnt need serdes. i dont think
				charR6.PrimaryPart = charR6.HumanoidRootPart;

				const rArmCollidePart = charR6["Right Arm"].Clone();
				rArmCollidePart.Name = "Right Arm Collide Part";
				rArmCollidePart.CanCollide = true;
				rArmCollidePart.Transparency = 1;
				rArmCollidePart.Parent = charR6;
				const weld = Make("WeldConstraint", {
					Parent: rArmCollidePart,
					Part0: charR6["Right Arm"],
					Part1: rArmCollidePart,
				});
				const lArmCollidePart = charR6["Left Arm"].Clone();
				lArmCollidePart.Name = "Left Arm Collide Part";
				lArmCollidePart.Parent = charR6;
				lArmCollidePart.Transparency = 1;
				lArmCollidePart.CanCollide = true;
				const weld2 = Make("WeldConstraint", {
					Parent: lArmCollidePart,
					Part0: charR6["Left Arm"],
					Part1: lArmCollidePart,
				});

				const wcsCharacter = new Character(charR6);
				world.set(playerEntity, Components.Animator, charR6.Humanoid.Animator);
				world.set(playerEntity, Components.AnimationQueue, []);
				world.set(playerEntity, Components.WCSCharacter, wcsCharacter);
				world.set(playerEntity, Components.Humanoid, charR6.Humanoid);
				world.set(playerEntity, Components.Basepart, charR6.HumanoidRootPart);

				if (!world.has(playerEntity, Components.Inventory)) {
					world.set(playerEntity, Components.Inventory, []); //not replicated, purely server side
				}

				const healthComp = world.set(playerEntity, Components.Health, {
					current: charR6.Humanoid.Health,
					max: charR6.Humanoid.MaxHealth,
				});

				//doesnt error
				const stamComp = world.set(playerEntity, Components.Stamina, {
					current: 100,
					max: 100,
				});

				const bloodComp = world.set(playerEntity, Components.Blood, {
					current: 100,
					max: 100,
				});

				print(world.get(playerEntity, Components.Blood));

				//Unhandled Promise rejection:
				// ReplicatedStorage.rbxts_include.node_modules.@rbxts.replecs.out.replecs.server:2040: attempt to compare number < table
				// ReplicatedStorage.rbxts_include.RuntimeLib:146

				// server.set_reliable(playerEntity, Components.Blood);

				// world.set(playerEntity, Components.Test, "test");
				// print("test comp ", world.get(playerEntity, Components.Test));
				// print("scheduler", scheduler);

				const defaultDebuffs: StatusEffect[] = [
					{
						id: "Fracture",
						bodyPart: "Right Leg",
						startTime: os.time(),
						type: "debuff",
					},
					{
						id: "Fracture",
						bodyPart: "Left Leg",
						startTime: os.time(),
						type: "debuff",
					},
					{
						id: "Bleeding",
						bodyPart: "Left Leg",
						startTime: os.time(),
						type: "debuff",
					},
					// {
					// 	id: "Blindness",
					// 	bodyPart: "Left Eye", //commented for being annoying
					// 	startTime: os.time(),
					// },
					{
						id: "Shrapnel",
						bodyPart: "Right Arm",
						startTime: os.time(),
						type: "debuff",
					},
				];

				world.set(playerEntity, Components.ActiveStatusEffects, defaultDebuffs);

				new Dash(wcsCharacter);
				new Mark(wcsCharacter);
				new MeleeLight(wcsCharacter);
				new MeleeHeavy(wcsCharacter);
				new MeleeBlock(wcsCharacter);
				new MeleeShove(wcsCharacter);

				// new Crouch(wcsCharacter);

				const humanoid = charR6.Humanoid;
				humanoid.Died.Once(() => {
					wcsCharacter.Destroy();
					ragdollCharacter(charR6);
				});

				// charR6.Humanoid.Seated.Connect((isSeated, seat) => {
				// 	const seatWeld = seat?.FindFirstChild("SeatWeld") as Weld;
				// 	if (isSeated) {
				// 		seatWeld.Part0 = seat;
				// 		seatWeld.Part1 = charR6.HumanoidRootPart;
				// 	}
				// });

				humanoid.BreakJointsOnDeath = false;
				humanoid.SetStateEnabled(Enum.HumanoidStateType.Ragdoll, false);

				// const lol = pair(Components.CurrentlyEquipped, Wildcard) as Id;

				// replicate components
				server.set_pair(playerEntity, pair(Replecs.Relation, Components.CurrentlyEquipped));

				server.set_reliable(playerEntity, Components.Health);
				server.set_reliable(playerEntity, Components.Stamina);

				server.set_reliable(playerEntity, Components.Player);
				server.set_reliable(playerEntity, Components.ActiveStatusEffects);

				print(
					"replecs:",
					Replecs.Global,
					Replecs.Shared,
					Replecs.Networked,
					Replecs.Serdes,
					Replecs.Reliable,
					Replecs.Unreliable,
				);
				print(
					"mine:",
					Components.Player,
					Components.CurrentlyEquipped,
					Components.Blood,
					Components.Health,
					Components.Stamina,
					Components.ActiveStatusEffects,
				);

				const animateScript = character.WaitForChild("Animate", 10) as AnimateScript | undefined;

				if (!animateScript) {
					warn("Animate script not found for", plr.Name);
					return;
				}

				this.inventoryService.refreshCurrentSlot(plr);
				const profile = this.inventoryService.getProfile(plr);
				if (profile) {
					// this.inventoryService.equipAccessories(plr, profile.Data.equippedDossier.build.skills);
					this.inventoryService.syncClientInventory(plr);
				}

				//TODO: make custom walk anim for enemies
				// const walkValue = animateScript.WaitForChild("walk") as AnimationValue;
				// const runValue = animateScript.WaitForChild("run") as RunValue;

				// const walkAnim = walkValue.WaitForChild("WalkAnim") as Animation;
				// const runAnim = runValue.WaitForChild("RunAnim") as Animation;

				// walkAnim.AnimationId = ASSET_ID_PREFIX + ANIMATION_IDS.noitem.walk;
				// runAnim.AnimationId = YOUR_ANIMATION_ID;

				// charR6.Humanoid.GetPropertyChangedSignal("MoveDirection").Connect(() => {
				// 	if (humanoid.MoveDirection.Magnitude > 0) {
				// 		AnimationUtils.loadAnim(charR6, "walk", ANIMATION_IDS.noitem.walk);
				// 	}
				// });
			});

			plr.Chatted.Connect((msg) => {
				if (msg === "dance") {
					print("dance");
				}
			});
		});

		Players.PlayerRemoving.Connect((player: Player) => {
			const playerEntityId = ref.find(player);
			if (playerEntityId !== undefined) {
				// Remove playerEntity from world when player leaves
				world.delete(playerEntityId);
				print(`Removed playerEntity for player: ${player.Name}`);
			}
		});

		setupEvilWilly();

		RemoteEvents.equipAccessoryOnHumanoid.connect((plr, humanoid: Humanoid, accessory: Accessory) => {
			humanoid.AddAccessory(accessory);
		});

		RemoteEvents.requestCarryRagdolledModel.connect(
			(plr, model: Model, carrier: Model, interactType: "carry" | "drag" | "drop") => {
				if (interactType === "carry" || interactType === "drag") {
					// 1. Transfer Network Ownership TO the player
					model.GetDescendants().forEach((desc) => {
						if (desc.IsA("BasePart")) {
							desc.Anchored = false; // Failsafe
							if (desc.CanSetNetworkOwnership()[0]) {
								desc.SetNetworkOwner(plr);
							}
						}
					});

					// 2. Apply constraints
					if (interactType === "carry") carryRagdolledCharacter(model, carrier);
					if (interactType === "drag") {
						dragRagdolledCharacter(model, carrier);
					}
				} else if (interactType === "drop") {
					// 1. Remove constraints
					dropCarriedCharacter(model, carrier);

					task.wait(0.5);

					// 2. Revert Network Ownership back to the server
					model.GetDescendants().forEach((desc) => {
						if (desc.IsA("BasePart") && desc.CanSetNetworkOwnership()[0]) {
							desc.SetNetworkOwner(undefined);
						}
					});
				}
			},
		);

		//ragdoll test
		// const l = Workspace.FindFirstChild("ragdoll1") as Model;
		// ragdollCharacter(l);

		//the axe

		//the npc
		// const testNPC = ref(Workspace.TestNPC);
		// const npcR6 = promiseR6(Workspace.TestNPC).then((npcR6) => {
		// 	world.set(testNPC, Name, "testNPC");
		// 	world.set(testNPC, Components.Health, {
		// 		current: npcR6.Humanoid.Health,
		// 		max: npcR6.Humanoid.MaxHealth,
		// 	});
		// 	world.set(testNPC, Components.WCSCharacter, new Character(npcR6));
		// 	world.set(testNPC, Components.Character, npcR6);
		// 	world.set(testNPC, Components.Transform, npcR6.HumanoidRootPart.CFrame);
		// 	world.set(testNPC, Components.Animator, npcR6.Humanoid.Animator);
		// 	// world.add(testNPC, pair(Components.NPCHasAbility, Components.NPCGrenade)); //this makes npc throw grenades

		// 	return npcR6;
		// });

		// task.wait(3);
		// print("adding curr equipped");
		// world.set(testNPC, pair(Components.CurrentlyEquipped, batEntity) as Id, "Baseballbat");

		// task.wait(3);
		// print("removing curr equipped");
		// world.remove(testNPC, pair(Components.CurrentlyEquipped, Wildcard));

		// task.wait(3);
		// print("adding curr equipped");
		// world.set(testNPC, pair(Components.CurrentlyEquipped, batEntity) as Id, "Baseballbat");
	}
}

export = StartUpService;
