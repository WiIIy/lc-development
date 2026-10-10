/* eslint-disable roblox-ts/lua-truthiness */
import React, { useState, useRef, Element } from "@rbxts/react";
import { GuiService, Players, UserInputService } from "@rbxts/services";
import { UICONSTS } from "../Uistyle";

// const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

interface HotbarItemProps extends ItemData {
	visible: boolean;
	onDrop: (draggedItem: ItemData, targetSlot: string) => void; //drop item on valid slot
	onDropGround: (item: ItemData) => void; //drop item outside of UI
	initialPos: UDim2;
	initialSize: UDim2;
}

const getSlotIdFromName = (name: string, expectedPrefix: string, expectedSlotPrefix: string): string | undefined => {
	const parts = name.split("_");
	if (parts.size() === 2 && parts[0] === expectedPrefix && parts[1].sub(1, 1) === expectedSlotPrefix) {
		return parts[1];
	}
	return undefined;
};

export function HotbarItem(props: HotbarItemProps): Element {
	const [itemNameVisible, setItemNameVisible] = useState(false);
	const frameRef = useRef<Frame>();
	const [dragKey, setDragKey] = useState(0);

	function onMouseEnter() {
		if (props.name) setItemNameVisible(true);
	}

	function onMouseLeave() {
		setItemNameVisible(false);
	}

	function onDragStart() {
		if (frameRef.current) {
			frameRef.current.ZIndex = 100;
			setItemNameVisible(false);
		}
	}

	function onDrag(rbx: UIDragDetector, dragOffset: Vector2) {
		if (frameRef.current) {
			frameRef.current.Position = UDim2.fromOffset(dragOffset.X, dragOffset.Y);
		}
	}

	function onDragEnd() {
		if (!frameRef.current) return;

		frameRef.current.ZIndex = 10;
		setDragKey((k) => k + 1);

		const localPlayer = Players.LocalPlayer;
		const targetPlayerGui = localPlayer?.FindFirstChild("PlayerGui") as PlayerGui | undefined;

		// If running in an environment without an accessible PlayerGui (like Storybook), fallback safely
		if (!targetPlayerGui) {
			// Reset the item position and exit early
			Promise.delay(0.05).then(() => {
				if (frameRef.current) frameRef.current.Position = props.initialPos;
			});
			return;
		}

		const inset = GuiService.GetGuiInset();
		const mouse = UserInputService.GetMouseLocation().sub(new Vector2(0, inset[0].Y));

		// Use the lazily fetched PlayerGui context here
		const guiObjects = targetPlayerGui.GetGuiObjectsAtPosition(mouse.X, mouse.Y);
		const validTargets = guiObjects.filter((g) => g !== frameRef.current);

		let dropTargetFound = false;

		for (const targetGui of validTargets) {
			const hotbarSlot = getSlotIdFromName(targetGui.Name, "HotbarSlot", "H");
			const hotbarItem = getSlotIdFromName(targetGui.Name, "HotbarItem", "H");
			const backpackSlot = getSlotIdFromName(targetGui.Name, "BackpackSlot", "B");
			const backpackItem = getSlotIdFromName(targetGui.Name, "BackpackItem", "B");

			const targetSlotId = hotbarSlot || hotbarItem || backpackSlot || backpackItem;

			if (targetSlotId) {
				props.onDrop(props, targetSlotId);
				dropTargetFound = true;
				break;
			}
		}

		if (!dropTargetFound) {
			const isOverContainer = validTargets.some(
				(g) => g.Name === "Hotbar slots" || g.Name === "BackpackContainer",
			);
			if (!isOverContainer) {
				props.onDropGround(props);
			}
		}

		Promise.delay(0.05)
			.then(() => {
				if (frameRef.current) {
					frameRef.current.Position = props.initialPos;
				}
			})
			.catch((e) => warn(`HotbarItem position reset error: ${e}`));
	}

	const isEmpty = props.name === "";

	return (
		<frame
			key={props.slot}
			ref={frameRef}
			ZIndex={10}
			Visible={!isEmpty && props.visible}
			Size={props.initialSize}
			BackgroundTransparency={1}
			AnchorPoint={new Vector2(0.5, 0.5)}
			Position={props.initialPos}
			Event={{
				MouseEnter: onMouseEnter,
				MouseLeave: onMouseLeave,
			}}
		>
			{/*forgot why i set zindex 10 but i believe the zindex here isnt affecting shit so i resorted to moving everything else back by -1 instead of using this*/}
			{!isEmpty && (
				<uidragdetector
					key={`drag_${props.slot}_${dragKey}`}
					DragRelativity={"Absolute"}
					DragStyle={"TranslatePlane"}
					Event={{
						DragStart: onDragStart,
						DragContinue: onDrag,
						DragEnd: onDragEnd,
					}}
				/>
			)}
			{!isEmpty && (
				<imagelabel
					Image={props.icon}
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0.5, 0.5)}
					Position={UDim2.fromScale(0.5, 0.5)}
				>
					{/* displays item amount if stackable */}
					{props.amount !== undefined && props.amount > 1 && (
						<textlabel
							Size={UDim2.fromScale(0.5, 0.5)}
							Position={UDim2.fromScale(1, 0)}
							AnchorPoint={new Vector2(1, 0)}
							BackgroundTransparency={1}
							Text={tostring(props.amount)}
							TextColor3={UICONSTS.color.white}
							TextStrokeTransparency={0}
							TextXAlignment={Enum.TextXAlignment.Center}
							TextYAlignment={Enum.TextYAlignment.Top}
							ZIndex={12}
						>
							<uipadding PaddingLeft={new UDim(0, 3)} PaddingTop={new UDim(0, 2)} />
						</textlabel>
					)}
					{/* displays item name */}
					{itemNameVisible && (
						<textlabel
							Size={UDim2.fromScale(1, 0.4)}
							Position={UDim2.fromScale(0.5, -0.1)}
							BackgroundColor3={UICONSTS.color.black}
							BackgroundTransparency={0.3}
							ZIndex={11}
							Visible={itemNameVisible}
							TextColor3={UICONSTS.color.white}
							Text={props.name}
							AutomaticSize={"X"}
						>
							<uipadding PaddingLeft={new UDim(0, 5)} PaddingRight={new UDim(0, 5)} />
						</textlabel>
					)}

					<uicorner CornerRadius={new UDim(0, 4)} />
				</imagelabel>
			)}
			<uiaspectratioconstraint />
		</frame>
	);
}
