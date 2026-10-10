import React, { Element, useEffect, useState } from "@rbxts/react";
import { PLACEHOLDER_BLTH_ICON } from "shared/data/items/icons";
import { UICONSTS } from "../Uistyle";

interface DossierBuildingProps {
	previewMode?: boolean;
	visible?: boolean;
}

const cornerSize = new UDim(0, 6);

export function DossierBuilding({ previewMode = false, visible = true }: DossierBuildingProps): Element {
	// 1. Navigation State
	const [categoryIndex, setCategoryIndex] = useState<number>(0);

	// 2. Selection & Hover States
	const [selectedPerks, setSelectedPerks] = useState<Set<string>>(new Set(["Carcinogenic", "Synaptic"]));
	const [hoveredPerk, setHoveredPerk] = useState<PerkData | undefined>(undefined);

	// 3. View Mode State
	const [isExpanded, setIsExpanded] = useState<boolean>(false); //shows full list of all perks
	const [hoveredCategory, setHoveredCategory] = useState<string>(""); //shows top right strings "Chronic" "Genetic"

	const currentCategory = PERK_CATEGORIES[categoryIndex];
	const currentPerks = PERKS_BY_CATEGORY[currentCategory];

	// Toggle perk selected state
	const togglePerkSelection = (perkId: string) => {
		setSelectedPerks((prev) => {
			const nextPerk = new Set<string>([...prev]);
			if (nextPerk.has(perkId)) {
				nextPerk.delete(perkId);
			} else {
				nextPerk.add(perkId);
			}
			return nextPerk;
		});
	};

	// Cycle through categories with left/right arrows
	const handleCategoryChange = (direction: number) => {
		setCategoryIndex((prev) => {
			const nextPerk = prev + direction;
			if (nextPerk < 0) return PERK_CATEGORIES.size() - 1;
			if (nextPerk >= PERK_CATEGORIES.size()) return 0;
			return nextPerk;
		});
	};

	return (
		<frame
			Size={UDim2.fromScale(1, 1)}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundTransparency={1}
			ZIndex={3}
			Visible={visible}
		>
			{/*smaller container as a sort of border*/}
			<frame
				Size={UDim2.fromScale(0.9, 0.9)}
				Position={UDim2.fromScale(0.5, 0.5)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
			>
				<ExpandedPerkWindow
					visible={isExpanded}
					selectedPerks={selectedPerks}
					onTogglePerk={togglePerkSelection}
					onHoverPerk={setHoveredPerk}
					onClose={() => setIsExpanded(false)}
				/>

				{/*perk selection window*/}
				<frame Size={UDim2.fromScale(0.52, 0.35)} BackgroundColor3={UICONSTS.color.white}>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />
					<textlabel
						Text={"Perk Selection"}
						Size={UDim2.fromScale(0.6, 0.1)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.03, 0.04)}
						BackgroundTransparency={1}
						TextSize={15}
					></textlabel>

					{/*section selector (Chronic, Genetic, Vocation, Habitual, Hobbyist, etc) */}
					<frame
						Size={UDim2.fromScale(0.6, 0.08)}
						Position={UDim2.fromScale(0.99, 0.05)}
						AnchorPoint={new Vector2(1, 0)}
						BackgroundTransparency={1}
					>
						<uilistlayout
							FillDirection="Horizontal"
							HorizontalAlignment="Right"
							Padding={new UDim(0, 4)}
							SortOrder={"LayoutOrder"}
						/>
						{PERK_CATEGORIES.map((cat, idx) => (
							<imagebutton
								key={cat}
								Size={UDim2.fromOffset(16, 16)}
								BackgroundColor3={idx === categoryIndex ? new Color3(0.2, 0.6, 1) : new Color3(0, 0, 0)}
								Event={{
									MouseButton1Click: () => setCategoryIndex(idx),
									MouseEnter: () => {
										setHoveredCategory(cat);
									},
									MouseLeave: () => {
										setHoveredCategory("");
									},
								}}
							>
								{hoveredCategory === cat && (
									<textlabel
										Size={UDim2.fromScale(3.5, 1)}
										Position={UDim2.fromScale(0.5, -1)} // Adjust position if you want tooltip-style offset
										Text={cat}
										AnchorPoint={new Vector2(0.5)}
										BackgroundTransparency={0}
										BackgroundColor3={new Color3(0, 0, 0)}
										TextColor3={new Color3(1, 1, 1)}
										TextSize={9}
										ZIndex={5}
									/>
								)}
								<uiaspectratioconstraint AspectRatio={1} />
							</imagebutton>
						))}
					</frame>

					{/*right arrow */}
					<textbutton
						Size={UDim2.fromScale(0.07, 0.2)}
						Position={UDim2.fromScale(0.962, 0.5)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						Event={{
							MouseButton1Click: () => {
								handleCategoryChange(1);
							},
						}}
						Text={"&gt;"}
						RichText={true}
						Font={Enum.Font.Ubuntu}
						TextSize={50}
						BackgroundTransparency={1}
					>
						<uiaspectratioconstraint AspectRatio={1} />
					</textbutton>

					{/*left arrow*/}
					<textbutton
						Size={UDim2.fromScale(0.07, 0.2)}
						Position={UDim2.fromScale(0.035, 0.5)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						Text={"&lt;"}
						RichText={true}
						Font={Enum.Font.Ubuntu}
						TextSize={50}
						BackgroundTransparency={1}
						Event={{
							MouseButton1Click: () => {
								handleCategoryChange(-1);
							},
						}}
					>
						<uiaspectratioconstraint AspectRatio={1} />
					</textbutton>

					{/*perks icons laid out and section title */}
					<frame
						Size={UDim2.fromScale(0.85, 0.65)}
						Position={UDim2.fromScale(0.5, 0.5)}
						BackgroundTransparency={1}
						AnchorPoint={new Vector2(0.5, 0.5)}
					>
						{/*section title*/}
						<textlabel
							Size={UDim2.fromScale(1, 0.08)}
							TextXAlignment={"Left"}
							Text={currentCategory}
							TextSize={15}
							BackgroundTransparency={1}
						/>

						<frame
							Size={UDim2.fromScale(1, 0.9)}
							Position={UDim2.fromScale(0, 0.99)}
							AnchorPoint={new Vector2(0, 1)}
							BackgroundTransparency={1}
						>
							<uilistlayout
								FillDirection={"Horizontal"}
								VerticalAlignment={"Center"}
								HorizontalFlex={"SpaceEvenly"}
								HorizontalAlignment={"Center"}
								Padding={new UDim(0, 8)}
								SortOrder={"LayoutOrder"}
							/>
							{currentPerks.map((perk) => (
								<PerkIcon
									key={perk.id}
									perk={perk}
									isSelected={selectedPerks.has(perk.id)}
									onClick={() => togglePerkSelection(perk.id)}
									onHover={setHoveredPerk}
								/>
							))}
						</frame>
					</frame>

					<imagebutton
						Image={"rbxassetid://78359589662530"}
						Size={UDim2.fromScale(0.1, 0.1)}
						Position={UDim2.fromScale(0.99, 0.98)}
						AnchorPoint={new Vector2(1, 1)}
						BackgroundTransparency={1}
						ImageColor3={new Color3(0, 0, 0)}
						Event={{
							MouseButton1Click: () => {
								setIsExpanded(!isExpanded);
							},
						}}
					>
						<uiaspectratioconstraint AspectRatio={1} />
					</imagebutton>
				</frame>

				{/*loadout selection window*/}
				<frame
					Size={UDim2.fromScale(0.47, 0.35)}
					Position={UDim2.fromScale(1, 0)}
					AnchorPoint={new Vector2(1, 0)}
					BackgroundColor3={UICONSTS.color.white}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />
					<textlabel
						Text={"Loadout"}
						Size={UDim2.fromScale(0.6, 0.1)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.03, 0.04)}
						BackgroundTransparency={1}
						TextSize={15}
					></textlabel>
				</frame>

				{/*desc*/}
				<frame
					Size={UDim2.fromScale(0.52, 0.63)}
					Position={UDim2.fromScale(0, 1)}
					AnchorPoint={new Vector2(0, 1)}
					BackgroundColor3={UICONSTS.color.white}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />
					<textlabel
						Text={hoveredPerk ? hoveredPerk.name : ""}
						Size={UDim2.fromScale(0.9, 0.12)}
						Position={UDim2.fromScale(0.04, 0.04)}
						TextXAlignment="Left"
						TextSize={18}
						BackgroundTransparency={1}
					/>

					<textlabel
						Text={hoveredPerk ? hoveredPerk.description : ""}
						Size={UDim2.fromScale(0.92, 0.75)}
						Position={UDim2.fromScale(0.04, 0.18)}
						TextXAlignment="Left"
						TextYAlignment="Top"
						TextWrapped={true}
						TextSize={14}
						BackgroundTransparency={1}
					/>
				</frame>

				{/*stats*/}
				<frame
					Size={UDim2.fromScale(0.23, 0.63)}
					Position={UDim2.fromScale(0.53, 1)}
					AnchorPoint={new Vector2(0, 1)}
					BackgroundColor3={UICONSTS.color.white}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />
					<textlabel
						Text={"Base Stats"}
						Size={UDim2.fromScale(0.6, 0.1)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.03, 0.005)}
						BackgroundTransparency={1}
						TextSize={15}
					></textlabel>
				</frame>

				{/*active*/}
				<frame
					Size={UDim2.fromScale(0.23, 0.4)}
					Position={UDim2.fromScale(1, 0.37)}
					AnchorPoint={new Vector2(1, 0)}
					BackgroundColor3={UICONSTS.color.white}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />
					<textlabel
						Text={"Active Perks"}
						Size={UDim2.fromScale(0.6, 0.1)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.03, 0.02)}
						BackgroundTransparency={1}
						TextSize={15}
					></textlabel>
				</frame>

				{/*xp multiplier*/}
				<frame
					Size={UDim2.fromScale(0.23, 0.21)}
					Position={UDim2.fromScale(1, 1)}
					AnchorPoint={new Vector2(1, 1)}
					BackgroundColor3={UICONSTS.color.white}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />
				</frame>
			</frame>
		</frame>
	);
}

interface ExpandedPerkWindowProps {
	visible: boolean;
	selectedPerks: Set<string>;
	onTogglePerk: (perkId: string) => void;
	onHoverPerk: (perk: PerkData | undefined) => void;
	onClose: () => void;
}

export function ExpandedPerkWindow({
	visible,
	selectedPerks,
	onTogglePerk,
	onHoverPerk,
	onClose,
}: ExpandedPerkWindowProps) {
	if (!visible) return undefined;

	return (
		<frame
			Size={UDim2.fromScale(0.44, 0.8)}
			Position={UDim2.fromScale(0, 0)}
			AnchorPoint={new Vector2(0, 0)}
			BackgroundColor3={UICONSTS.color.white}
			ZIndex={10}
		>
			<uicorner CornerRadius={cornerSize} />
			<uistroke Thickness={2} />

			{/* Header & Close Button */}
			{/* <textlabel
				Text="All Perks & Traits"
				Size={UDim2.fromScale(0.8, 0.08)}
				Position={UDim2.fromScale(0.04, 0.02)}
				TextXAlignment="Left"
				TextSize={20}
				BackgroundTransparency={1}
			/> */}

			<textbutton
				Text="X"
				Size={UDim2.fromScale(0.05, 0.05)}
				Position={UDim2.fromScale(0.95, 0.02)}
				AnchorPoint={new Vector2(1, 0)}
				TextSize={18}
				Event={{ MouseButton1Click: onClose }}
				BackgroundTransparency={1}
			/>

			{/* Scrollable grid view for all sections */}
			<scrollingframe
				Size={UDim2.fromScale(0.92, 0.88)}
				Position={UDim2.fromScale(0.5, 0.95)}
				AnchorPoint={new Vector2(0.5, 1)}
				BackgroundTransparency={1}
				ScrollBarThickness={0}
				CanvasSize={UDim2.fromScale(1)}
				AutomaticCanvasSize={Enum.AutomaticSize.Y}
			>
				<uilistlayout FillDirection="Vertical" Padding={new UDim(0, 6)} SortOrder="LayoutOrder" />

				{PERK_CATEGORIES.map((category, index) => (
					<frame
						key={category}
						Size={new UDim2(1, 0, 0, 100)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						LayoutOrder={index}
						ClipsDescendants={false}
					>
						<textlabel
							Text={category}
							Size={UDim2.fromScale(1, 0.14)}
							TextXAlignment="Left"
							TextSize={13}
							BackgroundTransparency={1}
						/>
						<frame
							Size={UDim2.fromScale(1, 0)}
							AutomaticSize={Enum.AutomaticSize.Y}
							Position={UDim2.fromScale(0, 0.25)}
							BackgroundTransparency={1}
						>
							<uilistlayout
								FillDirection="Horizontal"
								VerticalAlignment={"Center"}
								HorizontalAlignment={"Center"}
								Padding={new UDim(0, 6)}
							/>
							{PERKS_BY_CATEGORY[category].map((perk) => (
								<PerkIcon
									key={perk.id}
									perk={perk}
									isSelected={selectedPerks.has(perk.id)}
									onClick={() => onTogglePerk(perk.id)}
									onHover={onHoverPerk}
								/>
							))}
						</frame>
					</frame>
				))}
			</scrollingframe>
		</frame>
	);
}

interface PerkIconProps {
	perk: PerkData;
	isSelected: boolean;
	onClick: () => void;
	onHover: (perk: PerkData | undefined) => void;
}

export function PerkIcon({ perk, isSelected, onClick, onHover }: PerkIconProps) {
	return (
		<imagebutton
			key={perk.id}
			Size={UDim2.fromScale(0.15, 0.85)}
			Image={perk.icon}
			BackgroundColor3={isSelected ? new Color3(0.1, 0.5, 0.9) : UICONSTS.color.white}
			BackgroundTransparency={isSelected ? 0 : 0.8}
			Event={{
				MouseButton1Click: onClick,
				MouseEnter: () => onHover(perk),
				MouseLeave: () => onHover(undefined),
			}}
		>
			<uicorner CornerRadius={new UDim(0, 4)} />
			{/* Highlight stroke when selected */}
			<uistroke
				Color={isSelected ? new Color3(0.2, 0.6, 1) : new Color3(0, 0, 0)}
				Thickness={isSelected ? 2 : 1}
				Enabled={isSelected}
			/>
			<uiaspectratioconstraint AspectRatio={1} />
		</imagebutton>
	);
}

export const PERK_CATEGORIES = ["Genetic", "Chronic", "Vocation", "Habitual", "Hobbyist", "Impairments"] as const;

type PerkCategory = typeof PERK_CATEGORIES[number];

export interface PerkData {
	id: string;
	name: string;
	category: PerkCategory;
	icon: string;
	description: string;
}

export const PERKS_BY_CATEGORY: Record<PerkCategory, PerkData[]> = {
	Genetic: [
		{
			id: "Luciferian",
			name: "Luciferian",
			category: "Genetic",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Luciferian perk description...",
		},
		{
			id: "Beast",
			name: "Beast",
			category: "Genetic",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Beast perk description...",
		},
		{
			id: "Dissociative",
			name: "Dissociative",
			category: "Genetic",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Dissociative perk description...",
		},
		{
			id: "Insensitivity",
			name: "Insensitivity",
			category: "Genetic",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Insensitivity perk description...",
		},
		{
			id: "Susceptible",
			name: "Susceptible",
			category: "Genetic",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Susceptible perk description...",
		},
	],
	Chronic: [
		{
			id: "Carcinogenic",
			name: "Carcinogenic",
			category: "Chronic",
			icon: PLACEHOLDER_BLTH_ICON,
			description:
				"You are chronically ill and radiate a toxic aura. Your skin melts, you are covered in bandages keeping your flesh together. Enemies get sick from this aura. However if you get exposed to more toxic damage you will easily die (vulnerable to toxic damage).",
		},
		{
			id: "Traumatic",
			name: "Traumatic",
			category: "Chronic",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Horrible with guns but good with everything else.",
		},
		{
			id: "Synaptic",
			name: "Synaptic",
			category: "Chronic",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Things of interest within your hearing range will be highlighted behind walls.",
		},
		{
			id: "Necrotic",
			name: "Necrotic",
			category: "Chronic",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "The lower your health is, the more buffs you get (stamina, defense, speed, etc.).",
		},
	],
	Vocation: [
		{
			id: "Firebug",
			name: "Firebug",
			category: "Vocation",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Firebug description...",
		},
		{
			id: "Pharmacist",
			name: "Pharmacist",
			category: "Vocation",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Pharmacist description...",
		},
		{
			id: "Journalist",
			name: "Journalist",
			category: "Vocation",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Journalist description...",
		},
		{
			id: "Tourist",
			name: "Tourist",
			category: "Vocation",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Tourist description...",
		},
		{
			id: "DarkTriad",
			name: "Dark Triad",
			category: "Vocation",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Dark Triad description...",
		},
	],
	Habitual: [
		{
			id: "Strength",
			name: "Strength",
			category: "Habitual",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Strength description...",
		},
		{
			id: "Inconspicuous",
			name: "Inconspicuous",
			category: "Habitual",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Inconspicuous description...",
		},
		{
			id: "Sturdy",
			name: "Sturdy",
			category: "Habitual",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Sturdy description...",
		},
		{
			id: "Agile",
			name: "Agile",
			category: "Habitual",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Agile description...",
		},
		{
			id: "Vigor",
			name: "Vigor",
			category: "Habitual",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Vigor description...",
		},
	],
	Hobbyist: [
		{
			id: "Mountaineer",
			name: "Mountaineer",
			category: "Hobbyist",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Mountaineer description...",
		},
		{
			id: "Hustler",
			name: "Hustler",
			category: "Hobbyist",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Hustler description...",
		},
		{
			id: "Techie",
			name: "Techie",
			category: "Hobbyist",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Techie description...",
		},
		{
			id: "Mechanic",
			name: "Mechanic",
			category: "Hobbyist",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Mechanic description...",
		},
	],
	Impairments: [
		{
			id: "Blindness",
			name: "Blindness",
			category: "Impairments",
			icon: PLACEHOLDER_BLTH_ICON,
			description: "Blindness description...",
		},
	],
};
