import React, { Element, useRef, useState, useEffect } from "@rbxts/react";
import { UICONSTS } from "../Uistyle";
import { ReplicatedStorage, UserInputService } from "@rbxts/services";
import { useAtom } from "@rbxts/react-charm";
import { entityCountData } from "client/clientAtoms";
import { RemoteEvents, RemoteFunctions } from "client/network";
import { getMouseIconEnabled } from "client/controllers/InputController";
import { ENEMY_TYPES } from "shared/data/npcs/enemyTypes";
import { antlerDebuggerDisplaying, GAME_VERSION } from "shared/sharedAtoms";

//keep in mind GameApp zindex is global instead of sibling so UILabs might look different in zindex ordering

export function Antler({ previewMode = false }): Element {
	const antlerDebuggerDisplayingAtom = useAtom(antlerDebuggerDisplaying);

	// --- Modal State independent of atom ---
	const [isModalFocused, setIsModalFocused] = useState<boolean>(true);

	// Dynamic State
	const [antlerSize, setAntlerSize] = useState<UDim2>(UDim2.fromScale(0.65, 1));
	const [antlerPos, setAntlerPos] = useState<UDim2>(UDim2.fromScale(0.5, 0.5));

	// Element Refs
	const containerRef = useRef<Frame>();
	const resizeBtnRef = useRef<TextButton>();
	const dragBgRef = useRef<ImageLabel>();

	useEffect(() => {
		const container = containerRef.current;
		const resizeBtn = resizeBtnRef.current;
		const dragBg = dragBgRef.current;

		if (!container || !resizeBtn || !dragBg) return;

		let isDragging = false;
		let isResizing = false;

		let dragStartMousePos = Vector2.zero;
		let startContainerPos = Vector2.zero;

		let resizeStartMousePos = Vector2.zero;
		let startContainerSize = Vector2.zero;

		// --- 1. DRAGGING LOGIC ---
		const dragBeganConn = dragBg.InputBegan.Connect((input) => {
			if (
				input.UserInputType === Enum.UserInputType.MouseButton1 ||
				input.UserInputType === Enum.UserInputType.Touch
			) {
				isDragging = true;
				dragStartMousePos = new Vector2(input.Position.X, input.Position.Y);

				const currentAbsolutePos = container.AbsolutePosition;
				startContainerPos = currentAbsolutePos.add(container.AbsoluteSize.mul(0.5));

				// Focus modal when interacting with frame
				setIsModalFocused(true);
			}
		});

		// --- 2. RESIZING LOGIC ---
		const resizeBeganConn = resizeBtn.InputBegan.Connect((input) => {
			if (
				input.UserInputType === Enum.UserInputType.MouseButton1 ||
				input.UserInputType === Enum.UserInputType.Touch
			) {
				isResizing = true;
				resizeStartMousePos = new Vector2(input.Position.X, input.Position.Y);
				startContainerSize = container.AbsoluteSize;

				// Focus modal when interacting with frame
				setIsModalFocused(true);
			}
		});

		// --- 3. MOUSE / TOUCH MOVEMENT ---
		const inputChangedConn = UserInputService.InputChanged.Connect((input) => {
			if (
				input.UserInputType !== Enum.UserInputType.MouseMovement &&
				input.UserInputType !== Enum.UserInputType.Touch
			) {
				return;
			}

			const currentMousePos = new Vector2(input.Position.X, input.Position.Y);
			const parent = container.Parent as GuiObject;
			const parentSize = parent ? parent.AbsoluteSize : Vector2.one;

			if (isDragging) {
				const delta = currentMousePos.sub(dragStartMousePos);
				const newPosPx = startContainerPos.add(delta);

				setAntlerPos(UDim2.fromScale(newPosPx.X / parentSize.X, newPosPx.Y / parentSize.Y));
			} else if (isResizing) {
				const delta = currentMousePos.sub(resizeStartMousePos);
				const newSizePx = startContainerSize.add(delta);

				const minSizePx = new Vector2(200, 150);
				const clampedSizePx = new Vector2(
					math.max(minSizePx.X, newSizePx.X),
					math.max(minSizePx.Y, newSizePx.Y),
				);

				setAntlerSize(UDim2.fromScale(clampedSizePx.X / parentSize.X, clampedSizePx.Y / parentSize.Y));
			}
		});

		// --- 4. GLOBAL CLICK OUTSIDE DETECTION ---
		const globalInputBeganConn = UserInputService.InputBegan.Connect((input) => {
			if (
				input.UserInputType === Enum.UserInputType.MouseButton1 ||
				input.UserInputType === Enum.UserInputType.Touch
			) {
				const mousePos = new Vector2(input.Position.X, input.Position.Y);
				const framePos = container.AbsolutePosition;
				const frameSize = container.AbsoluteSize;

				// Check if the click is within the bounding box of the window
				const isInside =
					mousePos.X >= framePos.X &&
					mousePos.X <= framePos.X + frameSize.X &&
					mousePos.Y >= framePos.Y &&
					mousePos.Y <= framePos.Y + frameSize.Y;

				if (!isInside) {
					setIsModalFocused(false);
				} else {
					setIsModalFocused(true);
				}
			}
		});

		// --- 5. RELEASE LOGIC ---
		const inputEndedConn = UserInputService.InputEnded.Connect((input) => {
			if (
				input.UserInputType === Enum.UserInputType.MouseButton1 ||
				input.UserInputType === Enum.UserInputType.Touch
			) {
				isDragging = false;
				isResizing = false;
			}
		});

		// Cleanup connections on unmount
		return () => {
			dragBeganConn.Disconnect();
			resizeBeganConn.Disconnect();
			inputChangedConn.Disconnect();
			globalInputBeganConn.Disconnect();
			inputEndedConn.Disconnect();
		};
	}, []);

	return (
		<frame
			ref={containerRef}
			Size={antlerSize}
			AnchorPoint={new Vector2(0.5, 0.5)}
			Position={antlerPos}
			BackgroundTransparency={1}
			Visible={previewMode || antlerDebuggerDisplayingAtom}
		>
			<uiaspectratioconstraint AspectRatio={1346 / 867} />

			{/* Frees mouse only when local isModalFocused is true */}
			<textbutton Modal={isModalFocused} Transparency={1} TextTransparency={1} />

			{/* Close Button UI Placeholder */}
			<textbutton
				Text={"<b>X</b>"}
				RichText={true}
				Size={UDim2.fromOffset(24, 24)}
				Position={UDim2.fromScale(1, 0)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundColor3={UICONSTS.color.antler_dark}
				TextColor3={UICONSTS.color.antler_light}
				BorderSizePixel={0}
				ZIndex={11}
				Event={{
					MouseButton1Click: () => {
						// Deselect modal focus or set your window visibility state here
						UserInputService.MouseIconEnabled = false || getMouseIconEnabled();
						antlerDebuggerDisplaying(false);
						setIsModalFocused(false);
					},
				}}
			>
				<uicorner CornerRadius={new UDim(0, 5)} />
			</textbutton>

			{/* Resize button */}
			<textbutton
				ref={resizeBtnRef}
				Size={UDim2.fromOffset(20, 20)}
				Text={""}
				BackgroundColor3={UICONSTS.color.black}
				Position={UDim2.fromScale(1, 1)}
				AnchorPoint={new Vector2(1, 1)}
				ZIndex={10}
			/>

			{/* Antler 4.0 BG - Drag Target */}
			<imagelabel
				ref={dragBgRef}
				Image={"rbxassetid://71886505425131"}
				Size={UDim2.fromScale(1, 1)}
				BackgroundTransparency={1}
				Active={true}
			>
				{/* orange screen area */}
				<frame
					Size={UDim2.fromScale(0.5, 0.8)}
					AnchorPoint={new Vector2(0.5, 0.5)}
					Position={UDim2.fromScale(0.5, 0.465)}
					BackgroundTransparency={1}
					BackgroundColor3={UICONSTS.color.red}
				>
					<uiaspectratioconstraint AspectRatio={451 / 414} />
					<MainDisplay />
				</frame>
				<uiaspectratioconstraint AspectRatio={1346 / 867} />
			</imagelabel>
		</frame>
	);
}

type AntlerPages = "Main" | "NPC Menu" | "Admin Settings" | "Logs";

function MainDisplay(): Element {
	const availableMenus: AntlerPages[] = ["NPC Menu", "Admin Settings", "Logs"];
	const [activeMenu, setActiveMenu] = useState<AntlerPages>("NPC Menu");

	const onBack = () => {
		print("set active menu to Main");
		setActiveMenu("Main");
	};

	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			{activeMenu === "NPC Menu" && <NpcMenu OnBack={onBack} />}
			{activeMenu === "Admin Settings" && <AdminSettings OnBack={onBack} />}
			{activeMenu === "Logs" && <Logs OnBack={onBack} />}

			{activeMenu === "Main" && (
				<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
					{/*battery*/}
					<imagelabel
						Size={UDim2.fromScale(0.98, 1)}
						Image={"rbxassetid://109737216232030"}
						BackgroundTransparency={1}
						Position={UDim2.fromScale(0.5, 0.02)}
						AnchorPoint={new Vector2(0.5, 0)}
					>
						<uiaspectratioconstraint AspectRatio={460 / 67} />
					</imagelabel>

					{/*deer*/}
					<imagelabel
						Size={UDim2.fromScale(0.5, 1)}
						Image={"rbxassetid://122201032132703"}
						BackgroundTransparency={1}
						Position={UDim2.fromScale(1.03, 1)}
						AnchorPoint={new Vector2(1, 1)}
					>
						<uiaspectratioconstraint AspectRatio={281 / 210} />
					</imagelabel>

					{/*menu buttons*/}
					<frame
						Size={UDim2.fromScale(0.4, 0.5)}
						Position={UDim2.fromScale(0.05, 0.19)}
						BackgroundTransparency={1}
					>
						<uiaspectratioconstraint AspectRatio={3 / 4} />
						<uilistlayout FillDirection={"Vertical"} Padding={new UDim(0, 10)} />
						{availableMenus.map((text) => (
							<AntlerMenuButton
								text={text}
								OnClick={() => {
									print("activeMenu set to", text);
									setActiveMenu(text);
								}}
							/>
						))}
					</frame>

					<textlabel
						Text={"<b>NO DATA WILL BE SAVED</b>"}
						Size={UDim2.fromScale(0.7, 0.1)}
						Position={UDim2.fromScale(0.05, 0.77)}
						RichText={true}
						TextSize={8}
						TextColor3={UICONSTS.color.antler_dark}
						BackgroundTransparency={1}
						TextXAlignment={"Left"}
					></textlabel>

					<textlabel
						Text={"<b>EVERYTHING IS SUBJECT TO CHANGE</b>"}
						Size={UDim2.fromScale(0.7, 0.1)}
						Position={UDim2.fromScale(0.05, 0.805)}
						RichText={true}
						TextSize={7}
						TextColor3={UICONSTS.color.antler_dark}
						BackgroundTransparency={1}
						TextXAlignment={"Left"}
					></textlabel>

					<textlabel
						Text={"<b>v " + GAME_VERSION + " </b>"}
						Size={UDim2.fromScale(0.7, 0.1)}
						Position={UDim2.fromScale(0.05, 0.83)}
						RichText={true}
						TextSize={8}
						TextColor3={UICONSTS.color.antler_dark}
						BackgroundTransparency={1}
						TextXAlignment={"Left"}
					></textlabel>
				</frame>
			)}
		</frame>
	);
}

function NpcMenu(props: { OnBack: () => void }): Element {
	const [npcType, setNpcType] = useState<EnemyType>("Civilian");

	type ExplicitOutfitsMap = { [folderName: string]: string[] };
 
	// const outfitFolders = ReplicatedStorage.CAAssets.outfits.GetChildren().filter((child) => child.IsA("Folder"));
	const explicitOutfits: ExplicitOutfitsMap = {};

	const entityCount = useAtom(entityCountData);

	const [showPathfinding, setShowPathfinding] = useState<boolean>(false);

	const entityData: WorldEntityData = entityCount ?? {
		WorldEntityCount: 67,
		ItemEntities: 67,
		EnvironmentEntities: 67,
		NpcEntities: 67,
		HostileNpcEntities: 67,
		CivilianNpcEntities: 67,
		MerchantNpcEntities: 67,
		PlayerEntities: 67,
	};

	// outfitFolders.forEach((folder) => {
	// 	if (folder.IsA("Folder")) {
	// 		const modelNames = folder
	// 			.GetChildren()
	// 			.filter((child): child is Model => child.IsA("Model"))
	// 			.map((model) => model.Name);
	// 		explicitOutfits[folder.Name] = modelNames;
	// 	}
	// });

	useEffect(() => {
		RemoteFunctions.getEntityCounts
			.invoke()
			.then((data) => {
				entityCountData(data);
			})
			.catch((err) => {
				warn("Failed to fetch entity counts:", err);
			});
	}, []);

	// const folderNames = outfitFolders
	// 	.filter((folder): folder is Folder => folder.IsA("Folder"))
	// 	.map((folder) => folder.Name);

	const [selectedOutfit, setSelectedOutfit] = useState<string>("Office");

	// Controls menu dropdown visibility and hovered folder sub-states
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const [hoveredFolder, setHoveredFolder] = useState<string | undefined>(undefined);
	const [displayOutfits, setDisplayOutfits] = useState<boolean>(false);

	const [npcTypesDropdownOpen, setNpcTypesDropdownOpen] = useState<boolean>(false);

	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<BackToMainMenuButton text="NPC Menu" OnClick={props.OnBack} />

			{/*Spawn Npc Title*/}
			<textlabel
				Text={"<b> Spawn NPC </b>"}
				RichText={true}
				TextSize={10}
				Position={UDim2.fromScale(0.07, 0.07)}
				Size={UDim2.fromScale(0.3, 0.05)}
				TextColor3={UICONSTS.color.antler_dark}
				BackgroundTransparency={1}
				TextXAlignment={"Left"}
			></textlabel>

			{/*enemytype, outfit, display pathing */}
			<frame
				Size={UDim2.fromScale(0.55, 0.4)}
				Position={UDim2.fromScale(0.085, 0.135)}
				BackgroundTransparency={1}
			>
				<uilistlayout FillDirection={"Vertical"} Padding={new UDim(0, 3)} />
				{/*NPCType: Civilian */}
				<frame Size={UDim2.fromScale(1, 0.15)} BackgroundTransparency={1} BackgroundColor3={UICONSTS.color.red}>
					<textlabel
						Text={"<b> Enemy Type </b>"}
						Size={UDim2.fromScale(0.5, 1)}
						BackgroundTransparency={1}
						TextXAlignment={"Left"}
						TextColor3={UICONSTS.color.antler_dark}
						RichText={true}
					></textlabel>

					<textbutton
						Text={"<b>  " + npcType + "</b>"}
						Size={UDim2.fromScale(0.5, 1)}
						Position={UDim2.fromScale(1)}
						AnchorPoint={new Vector2(1)}
						RichText={true}
						TextXAlignment={"Left"}
						TextColor3={UICONSTS.color.antler_light}
						BorderSizePixel={0}
						BackgroundColor3={UICONSTS.color.antler_dark}
						Event={{
							MouseButton1Click: () => {
								setNpcTypesDropdownOpen(!npcTypesDropdownOpen);
							},
						}}
					>
						{npcTypesDropdownOpen && (
							<frame
								Size={UDim2.fromScale(1, 5)}
								Position={UDim2.fromScale(1, 1)}
								AnchorPoint={new Vector2(1, 0)}
								BorderSizePixel={0}
								BackgroundTransparency={1}
								ZIndex={10}
								Event={{
									MouseEnter: () => {},
									MouseLeave: () => {},
								}}
							>
								<scrollingframe
									Size={UDim2.fromScale(1, 1)}
									CanvasSize={UDim2.fromScale(0, 0)}
									AutomaticCanvasSize={"Y"}
									ScrollingDirection={"Y"}
									BackgroundColor3={UICONSTS.color.antler_dark}
									BorderSizePixel={0}
									ScrollBarThickness={4}
								>
									<uilistlayout FillDirection={"Vertical"} SortOrder={"Name"} />
									{ENEMY_TYPES.map((npcType) => {
										return (
											<textbutton
												Text={"<b>  " + npcType + " </b>"}
												Size={UDim2.fromScale(1, 0.2)}
												Position={UDim2.fromScale(1, 0)}
												AnchorPoint={new Vector2(1, 0)}
												RichText={true}
												TextXAlignment={"Left"}
												TextColor3={UICONSTS.color.antler_light}
												BorderSizePixel={0}
												BackgroundColor3={UICONSTS.color.antler_dark}
												Event={{
													MouseEnter: () => {
														// print("hovering over ", folderName);
													},
													MouseLeave: () => {},
													MouseButton1Click: () => {
														setNpcType(npcType);
													},
												}}
											></textbutton>
										);
									})}
								</scrollingframe>
							</frame>
						)}
					</textbutton>
				</frame>

				{/*Outfit > Administrator */}
				{/* Outfit Selection Dropdown Anchor Frame */}
				<frame Size={UDim2.fromScale(1, 0.15)} BackgroundTransparency={1} LayoutOrder={2}>
					<textlabel
						Text={"<b> Outfit </b>"}
						Size={UDim2.fromScale(0.5, 1)}
						BackgroundTransparency={1}
						TextXAlignment={"Left"}
						TextColor3={UICONSTS.color.antler_dark}
						RichText={true}
					></textlabel>

					{/* Primary Toggle Box */}
					<textbutton
						Text={"<b>  " + selectedOutfit + "</b>"}
						Size={UDim2.fromScale(0.5, 1)}
						Position={UDim2.fromScale(1, 0)}
						AnchorPoint={new Vector2(1, 0)}
						RichText={true}
						TextXAlignment={"Left"}
						TextColor3={UICONSTS.color.antler_light}
						BorderSizePixel={0}
						BackgroundColor3={UICONSTS.color.antler_dark}
						Event={{
							MouseButton1Click: () => {
								// print("foldername", folderNames)
								// print("explicitOutfits", explicitOutfits)
								setIsDropdownOpen(!isDropdownOpen);
							},
						}}
					></textbutton>

					{/* CASCADING DROPDOWN MENU CORE LAYOUT */}
					{isDropdownOpen && (
						<frame
							Size={UDim2.fromScale(0.5, 5)}
							Position={UDim2.fromScale(1, 1)}
							AnchorPoint={new Vector2(1, 0)}
							BackgroundTransparency={1}
							ZIndex={5}
							Event={{
								MouseEnter: () => {
									setDisplayOutfits(true);
								},
								MouseLeave: () => {
									setDisplayOutfits(false);
								},
							}}
						>
							<scrollingframe
								Size={UDim2.fromScale(1, 1)}
								CanvasSize={UDim2.fromScale(0, 0)}
								AutomaticCanvasSize={"Y"}
								ScrollingDirection={"Y"}
								BackgroundColor3={UICONSTS.color.antler_dark}
								BorderSizePixel={0}
								ScrollBarThickness={4}
							>
								<uilistlayout FillDirection={"Vertical"} SortOrder={"Name"} />

								{/* {folderNames.map((folderName) => {
									return (
										<textbutton
											Text={"<b>  " + folderName + " &gt; </b>"}
											Size={UDim2.fromScale(1, 0.2)}
											Position={UDim2.fromScale(1, 0)}
											AnchorPoint={new Vector2(1, 0)}
											RichText={true}
											TextXAlignment={"Left"}
											TextColor3={UICONSTS.color.antler_light}
											BorderSizePixel={0}
											BackgroundColor3={UICONSTS.color.antler_dark}
											Event={{
												MouseEnter: () => {
													setHoveredFolder(tostring(folderName));
													// print("hovering over ", folderName);
												},
												MouseLeave: () => setHoveredFolder(undefined),
												MouseButton1Click: () => {
													setSelectedOutfit(tostring(folderName));
													print("set selected outfit FOLDER to ,", tostring(folderName));

													setIsDropdownOpen(false);
													setHoveredFolder(undefined);
												},
											}}
										></textbutton>
									);
								})} */}
							</scrollingframe>
						</frame>
					)}

					{/*displays specific outfit*/}
					{hoveredFolder !== undefined && displayOutfits && (
						<frame
							Size={UDim2.fromScale(0.5, 5)}
							Position={UDim2.fromScale(1.5, 1)}
							AnchorPoint={new Vector2(1, 0)}
							BackgroundColor3={UICONSTS.color.red}
							BackgroundTransparency={1}
							BorderSizePixel={0}
							ZIndex={5}
							Event={{
								MouseEnter: () => {
									setHoveredFolder(hoveredFolder);
									setDisplayOutfits(true);
								},
								MouseLeave: () => {
									setDisplayOutfits(false);
								},
							}}
						>
							<scrollingframe
								Size={UDim2.fromScale(1, 1)}
								CanvasSize={UDim2.fromScale(0, 0)}
								AutomaticCanvasSize={"Y"}
								ScrollingDirection={"Y"}
								BackgroundColor3={UICONSTS.color.antler_dark}
								BorderSizePixel={0}
								ScrollBarThickness={4}
							>
								<uilistlayout FillDirection={"Vertical"} SortOrder={"Name"} />
								{(() => {
									const elements: Element[] = [];

									const modelsInFolder = explicitOutfits[hoveredFolder] ?? [];

									modelsInFolder.forEach((specificModel) => {
										elements.push(
											<textbutton
												key={specificModel}
												Size={UDim2.fromScale(1, 0)}
												AutomaticSize={"Y"}
												Text={
													"<b> " +
													specificModel +
													(modelsInFolder.size() > 0 ? "" : "") +
													"</b>"
												}
												RichText={true}
												TextXAlignment={"Left"}
												TextColor3={UICONSTS.color.antler_light}
												BackgroundColor3={UICONSTS.color.antler_dark}
												BorderSizePixel={0}
												Event={{
													MouseEnter: () => setHoveredFolder(hoveredFolder),
													// MouseLeave: () => setHoveredFolder(undefined),

													MouseButton1Click: () => {
														setSelectedOutfit(tostring(specificModel));
														print(
															"set selected SPECIIFIC outfit to ,",
															tostring(specificModel),
														);
														setHoveredFolder(undefined);

														setIsDropdownOpen(false);
													},
												}}
											></textbutton>,
										);
									});

									return elements;
								})()}
							</scrollingframe>
						</frame>
					)}
				</frame>

				{/*display pathfinding */}
				<frame Size={UDim2.fromScale(1, 0.15)} BackgroundTransparency={1} BackgroundColor3={UICONSTS.color.red}>
					<textlabel
						Text={"<b> Show Pathfinding </b>"}
						Size={UDim2.fromScale(0.5, 1)}
						BackgroundTransparency={1}
						TextXAlignment={"Left"}
						TextColor3={UICONSTS.color.antler_dark}
						RichText={true}
					></textlabel>

					<textbutton
						Text={"<b>  " + showPathfinding + "</b>"}
						Size={UDim2.fromScale(0.5, 1)}
						Position={UDim2.fromScale(1)}
						AnchorPoint={new Vector2(1)}
						RichText={true}
						TextXAlignment={"Left"}
						TextColor3={UICONSTS.color.antler_light}
						BorderSizePixel={0}
						BackgroundColor3={UICONSTS.color.antler_dark}
						Event={{
							MouseButton1Click: () => {
								setShowPathfinding(false);
							},
						}}
					></textbutton>
				</frame>
			</frame>

			{/*entity count indicator*/}
			<frame
				Size={UDim2.fromScale(0.3, 0.4)}
				Position={UDim2.fromScale(0.98, 0.03)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundTransparency={1}
			>
				<uilistlayout FillDirection={"Vertical"} />
				<EntityCountIndicatorLine data="World" value={tostring(entityData.WorldEntityCount)} />
				<EntityCountIndicatorLine data="Item" value={tostring(entityData.ItemEntities)} />
				<EntityCountIndicatorLine data="Environment" value={tostring(entityData.EnvironmentEntities)} />
				<EntityCountIndicatorLine data="NPC" value={tostring(entityData.NpcEntities)} />
				<EntityCountIndicatorLine data="Hostile" value={tostring(entityData.HostileNpcEntities)} />
				<EntityCountIndicatorLine data="Civilian" value={tostring(entityData.CivilianNpcEntities)} />
				<EntityCountIndicatorLine data="Merchant" value={tostring(entityData.MerchantNpcEntities)} />
				<EntityCountIndicatorLine data="Player" value={tostring(entityData.PlayerEntities)} />
			</frame>
		</frame>
	);
}

function EntityCountIndicatorLine(props: { data: string; value: string }) {
	return (
		<frame Size={UDim2.fromScale(1, 0.13)} BackgroundTransparency={1}>
			<textlabel
				Size={UDim2.fromScale(1, 1)}
				Text={"<b>" + props.data + ": " + props.value + "</b>"}
				TextXAlignment={"Left"}
				TextSize={8}
				RichText={true}
				BackgroundTransparency={1}
				TextColor3={UICONSTS.color.antler_dark}
			/>
		</frame>
	);
}

function AdminSettings(props: { OnBack: () => void }): Element {
	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<BackToMainMenuButton text="Admin Settings" OnClick={props.OnBack} />
		</frame>
	);
}

function Logs(props: { OnBack: () => void }): Element {
	return (
		<frame Size={UDim2.fromScale(1, 1)} BackgroundTransparency={1}>
			<BackToMainMenuButton text="Logs" OnClick={props.OnBack} />
		</frame>
	);
}

function BackToMainMenuButton(props: { text: AntlerPages; OnClick: () => void }): Element {
	return (
		<textbutton
			Text={"<b> &lt;  " + props.text + "</b>"}
			RichText={true}
			TextSize={10}
			Size={UDim2.fromScale(1, 0.08)}
			TextColor3={UICONSTS.color.antler_dark}
			BackgroundTransparency={1}
			TextXAlignment={"Left"}
			Event={{
				MouseButton1Click: props.OnClick,
			}}
		></textbutton>
	);
}

function AntlerMenuButton(props: { text: string; OnClick: () => void }): Element {
	return (
		<textbutton
			Size={UDim2.fromScale(1, 0.18)}
			Text={""}
			BackgroundTransparency={0}
			BackgroundColor3={UICONSTS.color.antler_light}
			BorderColor3={UICONSTS.color.antler_dark}
			BorderSizePixel={2}
			Event={{ MouseButton1Click: props.OnClick }}
		>
			{/* <uistroke Color={new Color3(0.5, 0.18, 0.07)} Thickness={3} /> */}
			<textlabel
				Text={" <b>" + props.text + "</b>"}
				Size={UDim2.fromScale(1, 1)}
				RichText={true}
				TextSize={10}
				TextColor3={UICONSTS.color.antler_dark}
				BackgroundTransparency={1}
				TextXAlignment={"Left"}
			></textlabel>

			<textlabel
				Text="<b>></b>"
				Size={UDim2.fromScale(0.1, 1)}
				Position={UDim2.fromScale(0.97)}
				TextSize={10}
				TextColor3={UICONSTS.color.antler_dark}
				AnchorPoint={new Vector2(1)}
				RichText={true}
				BackgroundTransparency={1}
			></textlabel>
		</textbutton>
	);
}
