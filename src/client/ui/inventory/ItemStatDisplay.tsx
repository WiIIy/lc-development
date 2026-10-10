import React, { Element, useEffect, useState } from "@rbxts/react";
import world from "shared/world";
import Components from "shared/components/components";
import { ALL_FIREARMS, CHAINSAW } from "shared/data/items/all";
import { FIREARM_SETTINGS } from "shared/data/items/stats/gunStats";
import { InventoryStore } from "../stores/InventoryStore";

function getEquippedItem(): ItemData | undefined {
	return InventoryStore.getCurrentEquippedItem();
}

function formatStatValue(current?: number, max?: number, label?: string): string {
	if (current === undefined || max === undefined) return "";
	return `${label ?? ""}: ${math.floor(current)}/${math.floor(max)}`;
}

export function ItemStatDisplay(): Element {
	const [item, setItem] = useState<ItemData | undefined>(getEquippedItem());

	useEffect(() => {
		const update = () => setItem(getEquippedItem());
		const invConn = InventoryStore.onChange(update);
		const slotConn = InventoryStore.onCurrentSlotChange(update);

		return () => {
			invConn.Disconnect();
			slotConn.Disconnect();
		};
	}, []);

	if (item === undefined || item.name === "") {
		return <frame key="ItemStatDisplay" Size={UDim2.fromScale(0, 0)} BackgroundTransparency={1} />;
	}

	const isFirearm = ALL_FIREARMS.includes(item.name);
	const isChainsaw = CHAINSAW.includes(item.name);

	const firearmSettings = isFirearm ? FIREARM_SETTINGS[item.name as keyof typeof FIREARM_SETTINGS] : undefined;

	const currentAmmo = item.currentAmmo ?? (firearmSettings ? firearmSettings.CAPACITY : undefined);
	const maxAmmo = item.maxAmmo ?? (firearmSettings ? firearmSettings.CAPACITY : undefined);

	const currentFuel = item.currentFuel;
	const maxFuel = item.maxFuel;
	const overheated = item.overheated;

	const hasAmmoDisplay = isFirearm && currentAmmo !== undefined && maxAmmo !== undefined;
	const hasFuelDisplay = isChainsaw && currentFuel !== undefined && maxFuel !== undefined;

	if (!hasAmmoDisplay && !hasFuelDisplay) {
		return <frame key="ItemStatDisplay" Size={UDim2.fromScale(0, 0)} BackgroundTransparency={1} />;
	}

	return (
		<frame
			key="ItemStatDisplay"
			Size={UDim2.fromScale(0.2, 0.09)}
			Position={UDim2.fromScale(0.8, 0.9)}
			AnchorPoint={new Vector2(0, 1)}
			BackgroundTransparency={0.5}
			BackgroundColor3={new Color3(0, 0, 0)}
			BorderSizePixel={0}
		>
			<uilistlayout FillDirection="Vertical" VerticalAlignment="Top" Padding={new UDim(0, 2)} />
			<textlabel
				Text={`Item: ${item.name}`}
				Size={UDim2.fromScale(1, 0.4)}
				BackgroundTransparency={1}
				TextColor3={new Color3(1, 1, 1)}
				TextSize={13}
				TextXAlignment="Left"
			/>
			{hasAmmoDisplay ? (
				<textlabel
					Text={formatStatValue(currentAmmo, maxAmmo, "Ammo")}
					Size={UDim2.fromScale(1, 0.25)}
					BackgroundTransparency={1}
					TextColor3={new Color3(1, 1, 1)}
					TextSize={12}
					TextXAlignment="Left"
				/>
			) : undefined}
			{hasFuelDisplay ? (
				<textlabel
					Text={formatStatValue(currentFuel, maxFuel, "Fuel")}
					Size={UDim2.fromScale(1, 0.25)}
					BackgroundTransparency={1}
					TextColor3={new Color3(1, 1, 1)}
					TextSize={12}
					TextXAlignment="Left"
				/>
			) : undefined}
			{isChainsaw && overheated ? (
				<textlabel
					Text="OVERHEATED"
					Size={UDim2.fromScale(1, 0.25)}
					BackgroundTransparency={1}
					TextColor3={new Color3(1, 0, 0)}
					TextSize={14}
					TextXAlignment="Left"
				/>
			) : undefined}
		</frame>
	);
}
