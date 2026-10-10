import React, { Element, useRef, useState, useEffect } from "@rbxts/react";
import { UICONSTS } from "../Uistyle";

export type SpareItem = {
	category: string;

	name: string;
	icon: string;

	owned: number;

	selectedDropAmount: number;
};

export function SpareItems(props: { previewMode: boolean; spareItems: SpareItem[] }): Element {
	const spareItems: SpareItem[] = props.spareItems;
	const ammoItems = spareItems.filter((item) => {
		return item.category === "Ammo";
	});
	const materialItems = spareItems.filter((item) => {
		return item.category === "Material";
	});

	return (
		<frame Size={UDim2.fromScale(1, 0.55)} AnchorPoint={new Vector2(0.5, 1)} Position={UDim2.fromScale(0.5, 0.98)}>
			<scrollingframe
				Size={UDim2.fromScale(0.98, 0.98)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				CanvasSize={UDim2.fromScale(1)}
				AutomaticCanvasSize={"Y"}
				ScrollingDirection={"Y"}
				Position={UDim2.fromScale(0.5, 0.5)}
				BackgroundTransparency={1}
				ScrollBarThickness={5}
				ScrollBarImageColor3={UICONSTS.color.custom_color_mid_dark}
				ScrollBarImageTransparency={0}
			>
				<uilistlayout FillDirection={"Vertical"} SortOrder={"LayoutOrder"} HorizontalAlignment={"Center"} />

				{/*Ammo*/}
				{ammoItems.size() > 0 && (
					<>
						<CategorySection text={"Ammo"} />
						<frame
							AutomaticSize={"Y"}
							Size={UDim2.fromScale(1)}
							Position={UDim2.fromScale(0.5)}
							AnchorPoint={new Vector2(0.5)}
							BackgroundTransparency={1}
						>
							<uilistlayout
								FillDirection={"Vertical"}
								VerticalAlignment={"Top"}
								ItemLineAlignment={"Start"}
							/>
							{ammoItems.map((item) => (
								<SpareItemRow
									category={item.category}
									icon={item.icon}
									owned={item.owned}
									name={item.name}
									selectedDropAmount={item.selectedDropAmount}
								/>
							))}
						</frame>
					</>
				)}

				{/*Material*/}
				{materialItems.size() > 0 && (
					<>
						<CategorySection text={"Material"} />
						<frame
							AutomaticSize={"Y"}
							Size={UDim2.fromScale(1)}
							Position={UDim2.fromScale(0.5)}
							AnchorPoint={new Vector2(0.5)}
							BackgroundTransparency={1}
						>
							<uilistlayout
								FillDirection={"Vertical"}
								VerticalAlignment={"Top"}
								ItemLineAlignment={"Start"}
							/>
							{materialItems.map((item) => (
								<SpareItemRow
									category={item.category}
									icon={item.icon}
									owned={item.owned}
									name={item.name}
									selectedDropAmount={item.selectedDropAmount}
								/>
							))}
						</frame>
					</>
				)}
			</scrollingframe>
		</frame>
	);
}

function CategorySection(props: { text: string }): Element {
	return (
		<textlabel
			Size={UDim2.fromScale(0.9, 0.08)}
			AnchorPoint={new Vector2(0.5)}
			Position={UDim2.fromScale(0.5)}
			TextSize={12}
			Text={props.text}
			TextXAlignment={"Left"}
			BackgroundTransparency={1}
		></textlabel>
	);
}

function SpareItemRow(props: SpareItem): Element {
	return (
		<frame
			key="SpareItemRow"
			Size={new UDim2(1, 0, 0, 40)}
			Position={UDim2.fromScale(0.5)}
			AnchorPoint={new Vector2(0.5)}
			BackgroundColor3={UICONSTS.color.red}
			BackgroundTransparency={1}
		>
			{/*item icon*/}
			<imagelabel
				Image={props.icon}
				Size={UDim2.fromScale(0.7, 0.75)}
				Position={UDim2.fromScale(0.05, 0.5)}
				AnchorPoint={new Vector2(0, 0.5)}
				ZIndex={2}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagelabel>

			{/*hand icon*/}
			<imagelabel
				Image={"rbxassetid://137537839033667"}
				Size={UDim2.fromScale(0.7, 0.7)}
				Position={UDim2.fromScale(0.8, 0.5)}
				AnchorPoint={new Vector2(0, 0.5)}
				ZIndex={2}
				BorderSizePixel={0}
				BackgroundColor3={UICONSTS.color.custom_color_mid_dark}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
				<uiaspectratioconstraint AspectRatio={1} />
			</imagelabel>

			<textlabel
				Text={props.name}
				TextSize={9}
				Size={UDim2.fromScale(0.59, 0.4)}
				Position={UDim2.fromScale(0.18, 0.14)}
				TextXAlignment={"Left"}
				BackgroundTransparency={1}
			/>

			{/*bar display */}
			<frame Size={UDim2.fromScale(0.59, 0.16)} Position={UDim2.fromScale(0.18, 0.6)}>
				{/*this element will be movable and modify the dropamount at certain thresholds */}
				{/*if user has 0 then slider goes to 0 position */}

				{/*slider */}
				<frame
					Size={new UDim2(0, 5, 2, 0)}
					Position={UDim2.fromScale(props.selectedDropAmount / props.owned, 0.5)}
					AnchorPoint={new Vector2(0, 0.56)}
					BackgroundColor3={UICONSTS.color.custom_color_dark}
					BorderSizePixel={0}
				>
					<textlabel
						Text={tostring(props.selectedDropAmount)}
						Position={UDim2.fromScale(0.5, 1.5)}
						BackgroundTransparency={1}
					></textlabel>
				</frame>

				<textlabel
					Text={tostring(props.owned)}
					Size={new UDim2(0, 5, 2.2, 0)}
					Position={UDim2.fromScale(0.98, -0.2)}
					AnchorPoint={new Vector2(1, 1)}
					BackgroundColor3={UICONSTS.color.custom_color_dark}
					BackgroundTransparency={1}
					BorderSizePixel={0}
					TextSize={9}
				></textlabel>
			</frame>

			{/*line indicator*/}
		</frame>
	);
}
