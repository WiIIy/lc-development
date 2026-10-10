/* eslint-disable roblox-ts/lua-truthiness */
import React, { Element, useState, useMemo, useEffect, ReactNode, useRef } from "@rbxts/react";
import { Players, UserInputService, Workspace } from "@rbxts/services";
import { useTextLabelAutoHeight } from "../hooks/autoHeight";
import { RemoteEvents } from "client/network";
import { ENEMY_TYPES } from "shared/data/npcs/enemyTypes";
import { IMAGE_IDS } from "shared/data/assetid/ImageIDs";
import { ASSET_ID_PREFIX } from "shared/data/paths";
import { KEYBINDS, inputIsKey } from "shared/data/profile/defaultKeybinds";

// ... (Your existing types and imports remain here)

type ItemTypes = "Melee" | "Throwable" | "Gun" | "Healing" | "Stim" | "Iconic" | "Implant" | "Mod";
function cycleEnemyMode(current: EnemyDebugMode): EnemyDebugMode {
	if (current === "None") return "Spawn";
	if (current === "Spawn") return "Delete";
	return "None";
}

interface ItemData {
	text: string;
	active: boolean; // Note: We will largely ignore this hardcoded 'active' in favor of React state
	types: ItemTypes[];
	description?: string;
}

const black = new Color3(0, 0, 0);
const white = new Color3(1, 1, 1);
const blackPartTransparency = 0.15;
export const fivePixelPadding = new UDim(0, 5);
const tenPixelPadding = new UDim(0, 10);

const SHARDS = [
	{ shardName: "Document1.txt", shardContents: "This is the content of document 1." },
	{
		shardName: "Image.png",
		shardContents: (
			<imagelabel
				Size={UDim2.fromScale(0.9, 0.97)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={UDim2.fromScale(0.5, 0.5)}
				BackgroundTransparency={1}
				Image={"rbxassetid://76664568462838"}
				ScaleType={Enum.ScaleType.Fit}
			/>
		),
	},
	{
		shardName: "Claude | provoloni & vafssfa",
		shardContents:
			"provoloni:\nhazmat guys just sealed off ur place\nu good??\n\nvafssfa:\nyeah i'm fine\nminor headaches though they might be right\n\nprovoloni:\nthey asked wya i js said idk\n\nvafssfa:\nok\nthanks\ni'm staying at the office until they leave\n\nprovoloni:\nalr bre",
	},
];

const ITEMS: ItemData[] = [
	// Melee
	{ text: "Kitchen Knife", active: true, types: ["Melee", "Throwable"] },
	{ text: "Baseball Bat", active: false, types: ["Melee"] },
	{ text: "The Lobotomizer", active: false, types: ["Melee"] },
	{ text: "Teeth", active: false, types: ["Melee"] },
	{ text: "Big News", active: false, types: ["Melee", "Throwable"] },

	// Stims
	{ text: "", active: false, types: ["Stim"] },

	// Guns
	{ text: "Lemon", active: false, types: ["Gun"] },
	{
		text: "Basilisk MK1",
		active: false,
		types: ["Gun"],
		description: "Double the power. Proven to be highly inefficient in combat.",
	},
	{
		text: "Magenetron Gun",
		active: false,
		types: ["Gun"],
		description: "Made from salvaged microwave parts. Battery powered. May overheat.",
	},

	// Iconic
	{
		text: "Gerasimenko ВАГ-73",
		active: false,
		types: ["Gun", "Iconic"],
		description: `Stolen from Angel University armory in 2032. Modified for bullets that pack bigger punch at a lower capacity. "Come home" is written on the side.`,
	},
	{ text: "Wire", active: false, types: ["Mod", "Iconic"], description: "" },
	{
		text: "MESIN K.O.",
		active: false,
		types: ["Melee", "Iconic"],
		description: "Custom titanium core baseball bat that allows for metallic attachments and electrical currents.",
	},
	{
		text: "",
		active: false,
		types: ["Melee", "Iconic"],
		description:
			"Custom made blade with an auto-sharpening mechanism in the sheath. The longer it's sheathed the more damage it deals.",
	},
];

type EnemyDebugMode = "None" | "Spawn" | "Delete";

export function DebugUI(): Element {
	// State Management
	const [selectedIndex, setSelectedIndex] = useState<number>(0); // Default to first item
	const [selectedMenu, setSelectedMenu] = useState<string>("Items"); // Default to "Items" tab
	const [debugUIVisible, setDebugUIVisible] = useState<boolean>(false);

	const [selectedFileContent, setSelectedFileContent] = useState<string | React.Element>("");
	const [selectedFileName, setSelectedFileName] = useState<string>("");

	const [enemyType, setEnemyType] = useState<EnemyType>("Civilian");
	const [enemyMode, setEnemyMode] = useState<EnemyDebugMode>("None");
	const [dropdownOpen, setDropdownOpen] = useState(false);

	//makes debugUI appear and not appear
	useEffect(() => {
		const connection = UserInputService.InputBegan.Connect((inp, proc) => {
			if (proc) {
				return;
			}

			if (
				KEYBINDS.DebugMenu.some((key) => inputIsKey(inp, key)) ||
				KEYBINDS.DebugMenuAlt.some((key) => inputIsKey(inp, key))
			) {
				setDebugUIVisible(!debugUIVisible);
			}
		});

		return () => {
			connection.Disconnect();
		};
	}, [debugUIVisible]);

	//enemy spawning & deleting
	useEffect(() => {
		if (enemyMode === "None") return;

		const conn = UserInputService.InputBegan.Connect((input, processed) => {
			if (processed) return;
			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

			const camera = Workspace.CurrentCamera;
			if (!camera) return;

			const mousePos = UserInputService.GetMouseLocation();
			const ray = camera.ViewportPointToRay(mousePos.X, mousePos.Y);

			const params = new RaycastParams();
			params.FilterType = Enum.RaycastFilterType.Exclude;
			params.FilterDescendantsInstances = [Players.LocalPlayer.Character!];

			const result = Workspace.Raycast(ray.Origin, ray.Direction.mul(500), params);
			if (!result) return;

			if (enemyMode === "Spawn") {
				RemoteEvents.requestSpawnEnemy(result.Position, enemyType);
				return;
			}

			if (enemyMode === "Delete") {
				const model = result.Instance.FindFirstAncestorOfClass("Model");
				if (model) {
					RemoteEvents.requestDeleteEnemy(model);
				}
			}
		});

		return () => conn.Disconnect();
	}, [enemyMode, enemyType]);

	const currentItemData = ITEMS[selectedIndex];
	const handleFileItemClick = (fileName: string, content: string | React.Element) => {
		setSelectedFileContent(content);
		setSelectedFileName(fileName);
	};

	return (
		<frame key="DebugUI" Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1} Visible={debugUIVisible}>
			<imagelabel
				Image={ASSET_ID_PREFIX + IMAGE_IDS.ui.debug.frame}
				Size={UDim2.fromScale(0.8, 0.5)}
				Position={UDim2.fromScale(0.5, 0.5)}
				AnchorPoint={new Vector2(0.5, 0.5)}
			>
				<uiaspectratioconstraint AspectRatio={808 / 525} />
				<textbutton Modal={debugUIVisible} Transparency={1} TextTransparency={1} />

				{/* Top Bar / Tabs */}
				<frame Size={UDim2.fromScale(1, 0.08)} Transparency={1}>
					<uilistlayout FillDirection={"Horizontal"} />
					<DebugUITopButton
						text="Items"
						active={selectedMenu === "Items"}
						onClick={() => setSelectedMenu("Items")}
					/>
					<DebugUITopButton
						text="Shards"
						active={selectedMenu === "Shards"}
						onClick={() => setSelectedMenu("Shards")}
					/>
					<DebugUITopButton
						text="Enemy"
						active={selectedMenu === "Enemy"}
						onClick={() => setSelectedMenu("Enemy")}
					/>
				</frame>

				{/* Content Area */}
				<frame
					Size={UDim2.fromScale(1, 0.92)}
					Position={UDim2.fromScale(0, 1)}
					AnchorPoint={new Vector2(0, 1)}
					BackgroundTransparency={1}
				>
					<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1} Visible={selectedMenu === "Items"}>
						{/* Item List (Left Side) */}
						<frame
							BackgroundColor3={new Color3(0, 0, 0)}
							Size={UDim2.fromScale(0.3, 0.85)}
							Transparency={1}
							Position={UDim2.fromScale(0.05, 0.05)}
							ClipsDescendants={true}
						>
							<scrollingframe
								Size={UDim2.fromScale(1, 1)}
								AutomaticCanvasSize={"Y"}
								ScrollingDirection={"Y"}
								CanvasSize={UDim2.fromScale(1)}
								BackgroundTransparency={1}
								ScrollBarThickness={1}
							>
								<uilistlayout FillDirection={"Vertical"} Padding={new UDim(0, 2)} />
								{ITEMS.map((item, index) => (
									<ItemListButton
										key={index}
										text={item.text}
										active={selectedIndex === index}
										type={item.types}
										description={item.description}
										onClick={() => setSelectedIndex(index)}
									/>
								))}
							</scrollingframe>
						</frame>

						{/* Item Description (Right Side) */}
						<frame
							Size={UDim2.fromScale(0.4, 0.85)}
							Position={UDim2.fromScale(0.38, 0.05)}
							BackgroundColor3={black}
							BackgroundTransparency={blackPartTransparency}
						>
							{currentItemData && (
								<ItemDescription
									name={currentItemData.text}
									// eslint-disable-next-line roblox-ts/lua-truthiness
									description={currentItemData.description || "N/A."}
									tags={currentItemData.types}
								/>
							)}
						</frame>
					</frame>

					<frame Size={UDim2.fromScale(1, 1)} Visible={selectedMenu === "Shards"} BackgroundTransparency={1}>
						<uilistlayout
							FillDirection={"Horizontal"}
							HorizontalAlignment={"Center"}
							VerticalAlignment={"Center"}
							HorizontalFlex={"SpaceEvenly"}
						/>
						<ShardContents>
							{SHARDS.map((file) => (
								<ShardItem
									key={file.shardName}
									fileName={file.shardName}
									fileContents={file.shardContents}
									onClick={handleFileItemClick}
									isSelected={selectedFileName === file.shardName}
								/>
							))}
						</ShardContents>
						<ShardPreview content={selectedFileContent || ""} />
					</frame>

					<frame Size={UDim2.fromScale(1, 1)} Visible={selectedMenu === "Enemy"} BackgroundTransparency={1}>
						<frame
							Size={UDim2.fromScale(0.3, 0.4)}
							Position={UDim2.fromScale(0.05, 0.05)}
							BackgroundColor3={black}
							BackgroundTransparency={blackPartTransparency}
						>
							<uilistlayout Padding={tenPixelPadding} />

							{/* Dropdown Button */}
							<textbutton
								Text={`Enemy: ${enemyType}`}
								BackgroundColor3={black}
								TextColor3={white}
								Size={UDim2.fromScale(1, 0.2)}
								Event={{
									MouseButton1Click: () => setDropdownOpen(!dropdownOpen),
								}}
							/>

							{/* Dropdown Options */}
							{dropdownOpen && (
								<frame Size={UDim2.fromScale(1, 0.6)} BackgroundTransparency={1}>
									<uilistlayout />

									{ENEMY_TYPES.map((enemyType) => (
										<textbutton
											key={enemyType}
											Text={enemyType}
											BackgroundColor3={black}
											TextColor3={white}
											Size={UDim2.fromScale(1, 0.2)}
											Event={{
												MouseButton1Click: () => {
													setEnemyType(enemyType);
													setDropdownOpen(false);
												},
											}}
										/>
									))}
								</frame>
							)}

							{/* Spawn Toggle */}
							<textbutton
								Text={`Mode: ${enemyMode}`}
								BackgroundColor3={black}
								TextColor3={white}
								Size={UDim2.fromScale(1, 0.2)}
								Event={{
									MouseButton1Click: () => setEnemyMode(cycleEnemyMode(enemyMode)),
								}}
							/>
						</frame>
					</frame>
				</frame>
			</imagelabel>
		</frame>
	);
}

function DebugUITopButton(props: { text: string; onClick: () => void; active: boolean }): Element {
	const [transparency, setTransparency] = useState(props.active ? 1 : 0.7);

	useMemo(() => {
		setTransparency(props.active ? 1 : 0.7);
	}, [props.active]);

	return (
		<frame Size={UDim2.fromScale(0.15, 1)} BackgroundTransparency={1}>
			<textbutton
				Text={"<b>" + props.text + "</b>"}
				RichText={true}
				BackgroundTransparency={transparency}
				TextColor3={black}
				Size={UDim2.fromScale(1, 1)}
				Position={UDim2.fromScale(0.5, 0.5)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={black}
				Event={{
					MouseEnter: () => {
						if (props.active) {
							return;
						}
						setTransparency(0.6);
					},
					MouseLeave: () => {
						// Revert to active or inactive state
						if (props.active) {
							return;
						}
						setTransparency(0.7);
					},
					MouseButton1Click: props.onClick,
				}}
			/>
		</frame>
	);
}

// Added 'onClick' to props
function ItemListButton(props: {
	text: string;
	active: boolean;
	type: ItemTypes[];
	description?: string;
	onClick: () => void;
}): Element {
	return (
		<frame
			Size={UDim2.fromScale(1, 0.1)}
			BackgroundColor3={new Color3(0, 0, 0)}
			BorderColor3={new Color3(1, 1, 1)}
			BackgroundTransparency={blackPartTransparency}
		>
			<textbutton
				Text={"<b>" + (props.text === "" ? "???" : props.text) + "</b>"} // Handle empty names
				RichText={true}
				Size={UDim2.fromScale(1, 1)}
				TextXAlignment={"Left"}
				TextColor3={new Color3(1, 1, 1)}
				TextTransparency={props.active ? 0 : 0.4} // Dim text if not active
				BackgroundTransparency={1} // The button itself is transparent, the frame behind handles color
				Event={{
					MouseButton1Click: props.onClick,
				}}
			>
				<uipadding PaddingLeft={tenPixelPadding} />
			</textbutton>

			{/* Optional: Add a visual indicator for active state (e.g. a white border or bar) */}
			{props.active && <frame Size={UDim2.fromScale(0.02, 1)} BackgroundColor3={white} BorderSizePixel={0} />}
		</frame>
	);
}

function ItemDescription(props: { name: string; description?: string; tags?: ItemTypes[] }): Element {
	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<uilistlayout FillDirection={"Vertical"} />

			{/* Title */}
			<textlabel
				Size={UDim2.fromScale(1, 0.1)}
				BackgroundTransparency={1}
				Text={"<b>" + (props.name === "" ? "Unknown Item" : props.name) + "</b>"}
				RichText={true}
				TextColor3={white}
				TextXAlignment={"Left"}
				TextSize={15}
			>
				<uipadding
					PaddingTop={fivePixelPadding}
					PaddingLeft={fivePixelPadding}
					PaddingRight={fivePixelPadding}
				/>
			</textlabel>

			{/* Tags Display (New addition for completeness) */}
			<frame Size={UDim2.fromScale(1, 0.05)} BackgroundTransparency={1}>
				<uilistlayout FillDirection={"Horizontal"} Padding={new UDim(0, 5)} />
				<uipadding PaddingLeft={fivePixelPadding} />
				{props.tags?.map((tag, i) => (
					<textlabel
						key={i}
						Text={tag}
						TextColor3={new Color3(0.7, 0.7, 0.7)}
						Size={UDim2.fromOffset(0, 20)}
						AutomaticSize={"X"}
						BackgroundTransparency={1}
						TextSize={10}
						TextXAlignment={"Left"}
					/>
				))}
			</frame>

			{/* Description */}
			<scrollingframe
				Size={UDim2.fromScale(1, 0.7)}
				CanvasSize={UDim2.fromScale(1)}
				AutomaticCanvasSize={"Y"}
				ScrollingDirection={"Y"}
				BackgroundTransparency={1}
				ScrollBarThickness={2}
			>
				<textlabel
					Size={UDim2.fromScale(1)}
					AutomaticSize={"Y"}
					BackgroundTransparency={1}
					Text={props.description}
					TextColor3={white}
					TextXAlignment={"Left"}
					TextYAlignment={"Top"}
					TextWrapped={true}
					TextSize={10}
				>
					<uipadding
						PaddingTop={fivePixelPadding}
						PaddingLeft={fivePixelPadding}
						PaddingRight={fivePixelPadding}
						PaddingBottom={fivePixelPadding}
					/>
				</textlabel>
			</scrollingframe>
		</frame>
	);
}

interface ShardContentsProps {
	children?: ReactNode;
}

function ShardContents({ children }: ShardContentsProps) {
	return (
		<frame
			Size={UDim2.fromScale(0.25, 0.9)}
			BackgroundColor3={black}
			BackgroundTransparency={blackPartTransparency}
			BorderSizePixel={0}
		>
			<scrollingframe
				Size={new UDim2(0.95, 0, 1, 0)}
				CanvasSize={UDim2.fromScale(0.95, 1)}
				AutomaticCanvasSize={"XY"}
				BackgroundTransparency={1}
				ScrollBarThickness={1}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={UDim2.fromScale(0.5, 0.5)}
				ScrollingDirection={"Y"}
				BorderSizePixel={0}
			>
				{children}
				<uilistlayout Padding={new UDim(0, 5)} />
			</scrollingframe>
		</frame>
	);
}

interface ShardItemProps {
	fileName: string;
	fileContents: string | React.Element;
	onClick: (fileName: string, fileContents: string | React.Element) => void;
	isSelected: boolean;
}

export const ShardItem = React.forwardRef<ImageButton, ShardItemProps>(
	({ fileName, fileContents, onClick, isSelected }, ref) => {
		return (
			<imagebutton
				ref={ref}
				Size={UDim2.fromScale(1, 0.07)}
				BackgroundTransparency={isSelected ? 0.7 : 1}
				BackgroundColor3={new Color3(0.2, 0.2, 0.8)}
				Event={{
					Activated: () => onClick(fileName, fileContents),
				}}
			>
				<textlabel
					Text={fileName}
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					TextColor3={new Color3(1, 1, 1)}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextSize={9}
					ZIndex={2}
				/>
			</imagebutton>
		);
	},
);

interface ShardPreviewProps {
	content: string | React.Element;
}

export const ShardPreview: React.FC<ShardPreviewProps> = (props) => {
	// No hooks are called conditionally at the top level of THIS component anymore!
	// useRef for textLabelRef is now moved inside TextFilePreview

	return (
		<scrollingframe
			Size={UDim2.fromScale(0.65, 0.9)}
			CanvasSize={UDim2.fromScale(0.65, 0)}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			AutomaticCanvasSize={"Y"}
			ScrollingDirection={"Y"}
			BackgroundTransparency={1}
			ScrollBarThickness={0}
			BorderSizePixel={0}
		>
			{typeOf(props.content) === "string" ? (
				// Render the new TextFilePreview component if content is a string
				<TextFilePreview content={props.content as string} />
			) : (
				<frame
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					Position={UDim2.fromScale(0.5, 0.5)}
					AnchorPoint={new Vector2(0.5, 0.5)}
				>
					{props.content as React.Element}
				</frame>
			)}
		</scrollingframe>
	);
};

interface TextFilePreviewProps {
	content: string;
}

export const TextFilePreview: React.FC<TextFilePreviewProps> = ({ content }) => {
	const textLabelRef = useRef<TextLabel>(undefined);
	useTextLabelAutoHeight(textLabelRef, content, 5);
	return (
		<textlabel
			ref={textLabelRef}
			Text={content}
			Size={UDim2.fromScale(0.9, 0)}
			TextSize={9}
			AnchorPoint={new Vector2(0.5, 0)}
			Position={UDim2.fromScale(0.5, 0)}
			BackgroundTransparency={blackPartTransparency}
			BackgroundColor3={black}
			RichText={true}
			TextColor3={new Color3(1, 1, 1)}
			TextWrapped={true}
			TextXAlignment={Enum.TextXAlignment.Left}
			TextYAlignment={Enum.TextYAlignment.Top}
		>
			<uipadding
				PaddingTop={fivePixelPadding}
				PaddingLeft={fivePixelPadding}
				PaddingRight={fivePixelPadding}
				PaddingBottom={fivePixelPadding}
			/>
		</textlabel>
	);
};
