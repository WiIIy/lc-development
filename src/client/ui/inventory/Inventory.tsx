import React, { Element, useRef, useState, useEffect } from "@rbxts/react";
import { UserInputService, Players, Workspace, ContextActionService } from "@rbxts/services";
import { useInventoryItems } from "../hooks/useInventoryItems";
import { HotbarItem } from "./HotbarItem";
import { HotbarSlot } from "./HotbarSlot";
import { RemoteEvents } from "client/network";
import { BackpackSlot } from "./BackpackSlot";
import { ItemActionsInfo } from "./ItemActionsInfo";
import { BodyStats } from "./BodyStats";;
import { PlayerList } from "./PlayerList";
import { UICONSTS } from "../Uistyle";
import { SpareItem, SpareItems } from "./SpareItems";
import { HOTBAR_SLOT_NUMBERS, BACKPACK_SLOT_NUMBERS, VALID_HOTBAR_SLOTS } from "shared/data/items/all";
import { ITEM_ICON_MAP } from "shared/data/items/icons";
import { SpareItemCategories } from "shared/data/items/stats/ammoStats";

//Notes
//add shift clicking
//two tab modes: hold / toggle

// const HOTBAR_SLOT_NUMBERS = ["H1", "H2", "H3", "H4", "H5", "H6", "H7"];
// const BACKPACK_SLOT_NUMBERS = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"];

export type SlotLayoutData = {
	position: UDim2;
	size: UDim2;
};

const SELECT_SLOT_ACTIONS = HOTBAR_SLOT_NUMBERS.map((n) => `SelectHotbarSlot${n}`);

type SlotLayouts = { [slot: string]: SlotLayoutData | undefined };

function resolveSpareItemCategory(itemName: string): string | undefined {
	for (const [category, items] of pairs(SpareItemCategories)) {
		// eslint-disable-next-line roblox-ts/lua-truthiness, roblox-ts/no-any
		if (items.includes(itemName)) {
			return category;
		}
	}
}

interface InventoryProps {
	previewMode?: boolean;
}

export function Inventory({ previewMode = false }: InventoryProps): Element {
	const [backPackVisible, setBackpackVisible] = useState(false);
	const inventoryRef = useRef<Frame>();
	const hotbarSlotsRef = useRef<Frame>();
	const backpackSlotsRef = useRef<Frame>();
	const [modalTrue, setModalTrue] = useState(false);

	const actualStore = useInventoryItems() ?? [];

	const savedItems = [
		{ amount: 1, icon: "rbxassetid://92013585204915", slot: "H1", name: "Claw", slotType: "Hotbar" as SlotType },
		{
			amount: 1,
			icon: "rbxassetid://130034847070965",
			slot: "H2",
			name: "Fireaxe",
			slotType: "Hotbar" as SlotType,
		},
		// Preview items
	];

	const spareItems: SpareItem[] = [
		{
			category: "Ammo",
			name: ".45 ACP",
			icon: "",
			owned: 45,
			selectedDropAmount: 38,
		},
		{
			category: "Ammo",
			name: "7.62 NATO",
			icon: "",
			owned: 10,
			selectedDropAmount: 0,
		},
		{
			category: "Ammo",
			name: "BB Pellet",
			icon: "",
			owned: 10,
			selectedDropAmount: 0,
		},
		{
			category: "Material",
			name: "Rusted Nail",
			icon: "",
			owned: 10,
			selectedDropAmount: 7,
		},
		{
			category: "Material",
			name: "String",
			icon: "",
			owned: 30,
			selectedDropAmount: 1,
		},
		{
			category: "Material",
			name: "Black Powder",
			icon: "",
			owned: 32,
			selectedDropAmount: 32,
		},
	];

	let inventoryStore: ItemData[] = [];
	// let itemStore: //TBA

	inventoryStore = [
		...["H1", "H2", "H3", "H4", "H5", "H6", "H7"].map((slot) => {
			const foundItem = savedItems.find((item) => item.slot === slot);
			return {
				slot,
				slotType: "Hotbar" as SlotType,
				name: "",
				icon: "",
				amount: 0,
				...foundItem,
			};
		}),
		...["B1", "B2", "B3", "B4", "B5", "B6", "B7"].map((slot) => {
			const foundItem = savedItems.find((item) => item.slot === slot);
			return {
				slot,
				slotType: "Backpack" as SlotType,
				name: "",
				icon: "",
				amount: 0,
				...foundItem,
			};
		}),
	] as ItemData[];

	if (!previewMode) {
		inventoryStore = actualStore;
	}
	// ? (
	// : //["amount"] = 1,
	//   //  ["icon"] = "rbxassetid://92013585204915",
	//   //  ["name"] = "Claw",
	//   //  ["slot"] = "H1",
	//   //  ["slotType"] = "Hotbar"

	//   // 		{ amount: 1, icon: "rbxassetid://92013585204915", slot: "H1", name: "Claw", slotType: "Hotbar" },
	//   // 		{ amount: 1, icon: "rbxassetid://130034847070965", slot: "H2", name: "Fireaxe", slotType: "Hotbar" },
	//   // 		{ amount: 0, slot: "B7", slotType: "Backpack" },
	//   //   ] as ItemData[])
	//   ;
	const [hotbarSlotLayouts, setHotbarSlotLayouts] = useState<SlotLayouts>({});
	const [backpackSlotLayouts, setBackpackSlotLayouts] = useState<SlotLayouts>({});

	useEffect(() => {
		const inputBegan = UserInputService.InputBegan.Connect((inp, proc) => {
			if (!proc && inp.KeyCode === Enum.KeyCode.Tab) {
				// print("currentInventoryStore", inventoryStore);
				// print("currentAllItems", getAllInventoryItems());
				setBackpackVisible(true);
				setModalTrue(true); //frees the mouse
				// UserInputService.MouseIconEnabled = true || mouseIconEnabled;
			}
		});
		const inputEnded = UserInputService.InputEnded.Connect((inp, proc) => {
			if (!proc && inp.KeyCode === Enum.KeyCode.Tab) {
				// UserInputService.MouseIconEnabled = false || mouseIconEnabled;
				// print("mouseIconEnabled:", mouseIconEnabled);
				setBackpackVisible(false);
				setModalTrue(false);
			}
		});
		return () => {
			inputBegan.Disconnect();
			inputEnded.Disconnect();
		};
	}, []);

	const handleDrop = (draggedItem: ItemData, targetSlotId: string) => {
		RemoteEvents.requestMoveOrSwapItem.fire(draggedItem.slot, targetSlotId);
	};

	const handleDropGround = (item: ItemData) => {
		RemoteEvents.requestDropItem.fire(item.slot);
	};

	//-- useEffect calls are for calculating positions when screen is resized
	useEffect(() => {
		const slotsContainer = hotbarSlotsRef.current;
		const inventoryContainer = inventoryRef.current;
		if (!slotsContainer || !inventoryContainer) return;

		const calculateLayouts = () => {
			const inventoryAbsPos = inventoryContainer.AbsolutePosition;
			const newLayouts: SlotLayouts = {};
			const children = slotsContainer.GetChildren().filter((c): c is Frame => c.IsA("Frame"));
			children.forEach((child, index) => {
				const slotId = HOTBAR_SLOT_NUMBERS[index];
				if (slotId) {
					const relativePosition = child.AbsolutePosition.sub(inventoryAbsPos);
					newLayouts[slotId] = {
						position: UDim2.fromOffset(relativePosition.X, relativePosition.Y),
						size: UDim2.fromOffset(child.AbsoluteSize.X, child.AbsoluteSize.Y),
					};
				}
			});
			setHotbarSlotLayouts(newLayouts);
		};

		const taskHandle = task.delay(0, calculateLayouts);
		const connection = slotsContainer.GetPropertyChangedSignal("AbsoluteSize").Connect(calculateLayouts);

		return () => {
			task.cancel(taskHandle);
			connection.Disconnect();
		};
	}, []);

	useEffect(() => {
		const slotsContainer = backpackSlotsRef.current;
		const inventoryContainer = inventoryRef.current;
		if (!slotsContainer || !inventoryContainer) return;

		const calculateLayouts = () => {
			const inventoryAbsPos = inventoryContainer.AbsolutePosition;
			const newLayouts: SlotLayouts = {};
			const children = slotsContainer.GetChildren().filter((c): c is Frame => c.IsA("Frame"));
			children.forEach((child, index) => {
				const slotId = BACKPACK_SLOT_NUMBERS[index];
				if (slotId) {
					const relativePosition = child.AbsolutePosition.sub(inventoryAbsPos);
					newLayouts[slotId] = {
						position: UDim2.fromOffset(relativePosition.X, relativePosition.Y),
						size: UDim2.fromOffset(child.AbsoluteSize.X, child.AbsoluteSize.Y),
					};
				}
			});
			setBackpackSlotLayouts(newLayouts);
		};

		const taskHandle = task.delay(0, calculateLayouts);
		const connection = slotsContainer.GetPropertyChangedSignal("AbsoluteSize").Connect(calculateLayouts);

		return () => {
			task.cancel(taskHandle);
			connection.Disconnect();
		};
	}, []);

	return (
		<frame key={"Inventory"} ref={inventoryRef} Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<ItemActionsInfo />
			<BodyStats visible={backPackVisible || previewMode} />
			<PlayerList previewMode={previewMode} />

			{/*backpack contents background*/}
			<frame
				Size={UDim2.fromScale(0.25, 0.5)}
				AnchorPoint={new Vector2(1, 1)}
				Position={UDim2.fromScale(0.99, 0.99)}
				BackgroundColor3={UICONSTS.color.custom_color_mid_dark}
				ZIndex={-2}
				Visible={backPackVisible || previewMode}
			>
				<uiaspectratioconstraint AspectRatio={1.4 / 2} />
				<frame
					key={"BackpackContainer"}
					Size={UDim2.fromScale(0.96, 0.98)}
					AnchorPoint={new Vector2(0.5, 1)}
					Position={UDim2.fromScale(0.5, 0.99)}
					ZIndex={-1}
					BackgroundTransparency={1}
					BackgroundColor3={UICONSTS.color.custom_color_mid_dark}
				>
					{/*backpack (top 8 slot section) */}
					<frame
						ref={backpackSlotsRef}
						key={"Backpack Contents"}
						Size={UDim2.fromScale(1, 0.4)}
						AnchorPoint={new Vector2(0.5, 0)}
						Position={UDim2.fromScale(0.5, 0.02)}
						BackgroundColor3={UICONSTS.color.custom_color_mid}
						BorderColor3={new Color3(0.3, 0.3, 0.3)}
						BorderSizePixel={1}
						ZIndex={-1}
					>
						<uiaspectratioconstraint AspectRatio={200 / 110} />
						<uigridlayout
							FillDirection={"Horizontal"}
							FillDirectionMaxCells={4}
							CellSize={UDim2.fromScale(0.23, 0.5)}
							CellPadding={UDim2.fromOffset(5, -5)}
							HorizontalAlignment={"Center"}
							VerticalAlignment={"Center"}
						/>
						{BACKPACK_SLOT_NUMBERS.map((slotNum) => (
							<BackpackSlot key={`BackpackSlot_${slotNum}`} />
						))}
					</frame>

					<SpareItems previewMode={previewMode} spareItems={spareItems} />
				</frame>
			</frame>
			<textbutton Modal={modalTrue} Transparency={1} TextTransparency={1} />

			{/*the actual draggable items. this block was problematic and still hard to display on story*/}
			{inventoryStore.map((item) => {
				const isHotbar = item.slotType === "Hotbar";
				// const layout = isHotbar ? hotbarSlotLayouts[item.slot] : backpackSlotLayouts[item.slot];

				let layout = isHotbar ? hotbarSlotLayouts[item.slot] : backpackSlotLayouts[item.slot];
				if (previewMode && !layout) {
					layout = {
						position: isHotbar ? UDim2.fromScale(0.4, 0.95) : UDim2.fromScale(0.8, 0.5),
						size: UDim2.fromOffset(60, 60),
					};
				}
				if (!layout || !item) return; // Added check for item

				const { position, size } = layout;
				const centerOffset = UDim2.fromOffset(size.X.Offset / 2, size.Y.Offset / 2);
				const centeredPosition = position.add(centerOffset);
				const isVisible = isHotbar || (item.slotType === "Backpack" && backPackVisible);
				const iconId = ITEM_ICON_MAP[item.name] || "";

				return (
					<HotbarItem
						key={(isHotbar ? "HotbarItem_" : "BackpackItem_") + item.slot}
						slot={item.slot}
						name={item.name}
						icon={iconId}
						slotType={item.slotType}
						amount={item.amount}
						visible={isVisible}
						onDrop={handleDrop}
						onDropGround={handleDropGround}
						initialSize={size}
						initialPos={centeredPosition}
					/>
				);
			})}

			{/*hotbar slot background*/}
			<frame
				key={"Hotbar slots"}
				ref={hotbarSlotsRef}
				Size={UDim2.fromScale(0.36, 0.08)}
				AnchorPoint={new Vector2(0.5, 1)}
				Position={UDim2.fromScale(0.5, 0.99)}
				BackgroundColor3={new Color3(0.1, 0.1, 0.1)}
				BorderSizePixel={1}
				BorderColor3={new Color3(0.3, 0.3, 0.3)}
				ZIndex={-1}
			>
				<uipadding PaddingLeft={new UDim(0, 7)} PaddingRight={new UDim(0, 7)} />
				<uilistlayout
					FillDirection={"Horizontal"}
					HorizontalAlignment={"Center"}
					VerticalAlignment={"Center"}
					Padding={new UDim(0, 6)}
				/>
				<uiaspectratioconstraint AspectRatio={HOTBAR_SLOT_NUMBERS.size() + 0.4} />
				{VALID_HOTBAR_SLOTS.map((slotNum) => (
					<HotbarSlot key={`HotbarSlot_H${slotNum}`} slotNumber={slotNum} />
				))}
			</frame>
		</frame>
	);
}
