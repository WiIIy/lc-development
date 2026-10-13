import React, { Element, useEffect, useRef, useState } from "@rbxts/react";
import { Players, ReplicatedStorage } from "@rbxts/services";
import { UICONSTS } from "../Uistyle";
import Make from "@rbxts/make";
import { RemoteFunctions } from "client/network";
import { useAtom } from "@rbxts/react-charm";
import { ASSET_ID_PREFIX } from "shared/data/paths";
import { deserializeColor3, serializeColor3 } from "shared/utils/profile/colorSerdes";
import { DossierStore } from "../stores/DossierStore";
import { dossierEditingOpen } from "shared/sharedAtoms";

const template = ReplicatedStorage.LCAssets.characters.base;
const r6rig = template.Clone();
const head = r6rig.FindFirstChild("Head") as BasePart;
const bodyColors = r6rig.FindFirstChild("Body Colors") as BodyColors;

interface DossierEditingProps {
	previewMode?: boolean;
	visible?: boolean;
}

const cornerSize = new UDim(0, 6);

export function DossierEditing({ previewMode = false, visible = true }: DossierEditingProps): Element {
	// Live active dossier state bound directly to DossierStore
	const [currentdossierData, setDossierData] = useState<DossierData>(DossierStore.getEquipped());
	const [activePage, setActivePage] = useState<"1" | "2">("1");

	// Local buffer for active page's label text input
	const [rawInputLabel, setRawInputLabel] = useState<string>(
		formatToLiteralNewlines(currentdossierData.pages[activePage].label),
	);

	// Sync state whenever DossierStore updates
	useEffect(() => {
		const connection = DossierStore.onChange(() => {
			setDossierData(DossierStore.getEquipped());
		});
		return () => connection.Disconnect();
	}, []);

	// Update textbox contents when page switches
	useEffect(() => {
		setRawInputLabel(formatToLiteralNewlines(currentdossierData.pages[activePage].label));
	}, [activePage, currentdossierData]);

	// Live text preview handler
	const handleLabelTextChange = (newRawText: string) => {
		setRawInputLabel(newRawText);
		const parsedText = parseLiteralNewlines(newRawText);

		DossierStore.updateLocalPreview((prev) => ({
			...prev,
			pages: {
				...prev.pages,
				[activePage]: {
					...prev.pages[activePage],
					label: parsedText,
				},
			},
		}));
	};

	// Save button action
	const handleSave = () => {
		DossierStore.saveCurrentLabel();
	};

	// Spawn new default image entry
	const handleAddImage = () => {
		const newImage: DossierImage = {
			id: `img_${math.random(1000, 9999)}`,
			assetId: "0",
			position: { x: 0.1, y: 0.1 },
			size: { x: 0.2, y: 0.2 },
			zIndex: 1,
			aspectratio: 1,
		};

		DossierStore.updateAndSave((prev) => ({
			...prev,
			pages: {
				...prev.pages,
				[activePage]: {
					...prev.pages[activePage],
					images: [...prev.pages[activePage].images, newImage],
				},
			},
		}));
	};

	return (
		<frame
			key={"Dossier Editing"}
			Size={UDim2.fromScale(1, 1)}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundTransparency={1}
			Visible={previewMode || visible}
			ZIndex={3}
		>
			<frame
				key={"Dossier Editing Border"}
				Size={UDim2.fromScale(0.9, 0.9)}
				Position={UDim2.fromScale(0.5, 0.5)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
			>
				{/* Customize Dossier Preview */}
				<frame key={"Customize Dossier"} Size={UDim2.fromScale(0.45, 1)} Position={UDim2.fromScale(0)}>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />

					<textlabel
						Text={"Customize Dossier"}
						Size={UDim2.fromScale(0.6, 0.05)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.05)}
						TextSize={15}
						BackgroundTransparency={1}
					/>

					<frame
						Size={UDim2.fromScale(0.8, 0.9)}
						Position={UDim2.fromScale(0.5, 0.5)}
						AnchorPoint={new Vector2(0.5, 0.5)}
					>
						<uicorner CornerRadius={cornerSize} />
						<uistroke />
						<uiaspectratioconstraint AspectRatio={1 / 1.414} />
						<scrollingframe
							Size={UDim2.fromScale(1, 1)}
							CanvasSize={UDim2.fromScale(1)}
							AutomaticCanvasSize={"Y"}
							ScrollingDirection={"Y"}
							BackgroundTransparency={1}
							BackgroundColor3={UICONSTS.color.red}
							ScrollBarThickness={0}
						>
							<textlabel
								Text={parseCustomRichText(
									currentdossierData.pages[activePage].label,
									currentdossierData,
								)}
								Size={UDim2.fromScale(0.96)}
								AutomaticSize={"Y"}
								TextXAlignment={"Left"}
								Position={UDim2.fromScale(0.5, 0)}
								AnchorPoint={new Vector2(0.5, 0)}
								TextSize={11}
								RichText={true}
								TextYAlignment={"Top"}
								TextColor3={UICONSTS.color.black}
								BackgroundTransparency={1}
								TextWrapped={true}
								ClipsDescendants={true}
							>
								<uisizeconstraint MinSize={new Vector2(1, 560)} />
								{currentdossierData.pages[activePage].images.map((imageData, idx) => (
									<imagelabel
										key={imageData.id + idx}
										Image={ASSET_ID_PREFIX + imageData.assetId}
										Size={UDim2.fromScale(imageData.size.x, imageData.size.y)}
										Position={UDim2.fromScale(imageData.position.x, imageData.position.y)}
										BackgroundColor3={new Color3(0, 0, 0)}
										ZIndex={imageData.zIndex}
										BackgroundTransparency={1}
									>
										{imageData.aspectratio !== undefined && (
											<uiaspectratioconstraint AspectRatio={imageData.aspectratio} />
										)}
									</imagelabel>
								))}
							</textlabel>
						</scrollingframe>
					</frame>

					<textbutton
						Size={UDim2.fromScale(0.07, 0.2)}
						Position={UDim2.fromScale(0.952, 0.5)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						Event={{ MouseButton1Click: () => setActivePage("2") }}
						Text={"&gt;"}
						RichText={true}
						Font={Enum.Font.Ubuntu}
						TextSize={55}
						BackgroundTransparency={1}
					>
						<uiaspectratioconstraint AspectRatio={1} />
					</textbutton>

					<textbutton
						Size={UDim2.fromScale(0.07, 0.2)}
						Position={UDim2.fromScale(0.051, 0.5)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						Text={"&lt;"}
						RichText={true}
						Font={Enum.Font.Ubuntu}
						TextSize={55}
						BackgroundTransparency={1}
						Event={{ MouseButton1Click: () => setActivePage("1") }}
					>
						<uiaspectratioconstraint AspectRatio={1} />
					</textbutton>

					<frame
						Size={UDim2.fromScale(0.1, 0.2)}
						Position={UDim2.fromScale(0.5, 0.975)}
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundTransparency={1}
					>
						<textlabel
							Text={activePage + "/2"}
							Size={UDim2.fromScale(1, 1)}
							TextSize={13}
							BackgroundTransparency={1}
						/>
						<uiaspectratioconstraint AspectRatio={2} />
					</frame>
				</frame>

				{/* Edit Label */}
				<frame
					Size={UDim2.fromScale(0.53, 0.45)}
					Position={UDim2.fromScale(1, 0)}
					AnchorPoint={new Vector2(1, 0)}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />

					<textlabel
						BackgroundTransparency={1}
						Text={"Edit Label"}
						Size={UDim2.fromScale(0.6, 0.05)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.02, 0.05)}
						TextSize={15}
					/>

					{/* Save button */}
					<textbutton
						BackgroundTransparency={0.5}
						Text={"Save"}
						Size={UDim2.fromScale(0.09, 0.05)}
						TextXAlignment={"Center"}
						Position={UDim2.fromScale(0.85, 0.9)}
						TextSize={15}
						Event={{ MouseButton1Click: handleSave }}
					/>

					{/* Textbox input */}
					<frame
						Size={UDim2.fromScale(0.8, 0.8)}
						Position={UDim2.fromScale(0.43, 0.55)}
						AnchorPoint={new Vector2(0.5, 0.5)}
					>
						<uicorner CornerRadius={cornerSize} />
						<uistroke />
						<textbox
							Size={UDim2.fromScale(1, 1)}
							TextXAlignment={"Left"}
							TextYAlignment={"Top"}
							RichText={false}
							TextWrapped={true}
							ClearTextOnFocus={false}
							Text={rawInputLabel}
							Change={{
								Text: (textBox) => handleLabelTextChange(textBox.Text),
							}}
						/>
					</frame>
				</frame>

				{/* Insert Image */}
				<frame
					Size={UDim2.fromScale(0.26, 0.25)}
					Position={UDim2.fromScale(0.47, 0.47)}
					AnchorPoint={new Vector2(0, 0)}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />

					<textlabel
						Text={"Insert Image"}
						Size={UDim2.fromOffset(0.6, 0.05)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.02, 0.05)}
						TextSize={15}
						BackgroundTransparency={1}
					/>

					<frame
						Size={UDim2.fromScale(0.8, 0.8)}
						Position={UDim2.fromScale(0.08, 0.13)}
						BackgroundTransparency={1}
					>
						<scrollingframe
							Size={UDim2.fromScale(1, 0.8)}
							CanvasSize={UDim2.fromScale(1)}
							ScrollingDirection={"Y"}
							AutomaticCanvasSize={"Y"}
							BackgroundTransparency={1}
							ScrollBarThickness={0}
						>
							<uipadding PaddingTop={new UDim(0, 3)} />
							<uilistlayout
								FillDirection={"Vertical"}
								HorizontalAlignment={"Center"}
								Padding={new UDim(0, 3)}
								SortOrder={"LayoutOrder"}
							/>
							{currentdossierData.pages[activePage].images.map((imageData) => (
								<InsertedImage
									key={imageData.id}
									id={imageData.assetId}
									size={UDim2.fromOffset(imageData.size.x, imageData.size.y)}
									position={UDim2.fromScale(imageData.position.x, imageData.position.y)}
									zIndex={imageData.zIndex}
									page={activePage}
								/>
							))}
						</scrollingframe>

						{/* Add image button */}
						<frame
							Size={UDim2.fromScale(0.3, 0.16)}
							AnchorPoint={new Vector2(0.5, 1)}
							Position={UDim2.fromScale(0.5, 0.98)}
						>
							<uicorner CornerRadius={new UDim(0, 10)} />
							<uistroke Thickness={0.5} />
							<uiaspectratioconstraint AspectRatio={1} />
							<textbutton
								TextXAlignment={"Center"}
								Size={UDim2.fromScale(1, 1)}
								Text={"+"}
								TextSize={17}
								BackgroundTransparency={1}
								Event={{ MouseButton1Click: handleAddImage }}
							/>
						</frame>
					</frame>
				</frame>

				{/* Labelling Guide */}
				<frame
					Size={UDim2.fromScale(0.26, 0.25)}
					Position={UDim2.fromScale(1, 0.47)}
					AnchorPoint={new Vector2(1, 0)}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />

					<textlabel
						Text={"Labelling Guide"}
						Size={UDim2.fromScale(0.6, 0.05)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.02, 0.05)}
						TextSize={15}
						BackgroundTransparency={1}
					/>

					<textlabel
						Text={
							'&lt;&lt;break&gt;&gt; - line break \n \\n - new line \n &lt;b&gt; text &lt;/b&gt; - bold \n &lt;i&gt; text &lt;/i&gt; - italic \n &lt;r&gt; text &lt;/r&gt; - redact \n &lt;u&gt; text &lt;/u&gt; - underline \n &amp;lt; - &lt;   &amp;gt;- &gt;\n &lt;font size="10" &gt; text &lt;/font&gt; - size\n&lt;&lt;loadout&gt;&gt; - loadout\n&lt;&lt;skills&gt;&gt; - skills'
						}
						Size={UDim2.fromScale(0.96, 0.83)}
						TextXAlignment={"Left"}
						Position={UDim2.fromScale(0.02, 0.15)}
						TextSize={9}
						RichText={true}
						TextYAlignment={"Top"}
						BackgroundTransparency={1}
					/>
				</frame>

				{/* Build Avatar */}
				<frame
					Size={UDim2.fromScale(0.4, 0.26)}
					Position={UDim2.fromScale(0.47, 1)}
					AnchorPoint={new Vector2(0, 1)}
				>
					<uicorner CornerRadius={cornerSize} />
					<uistroke />
					<BuildAvatarSelection avatarItems={currentdossierData.avatar} />
				</frame>
			</frame>
		</frame>
	);
}

function BuildAvatarSelection(props: { avatarItems: DossierData["avatar"] }) {
	const dossierEditingOpenAtom = useAtom(dossierEditingOpen);
	const viewportFrameRef = useRef<ViewportFrame>();
	const viewportCamera = Make("Camera", {
		CFrame: new CFrame(-238.328, 2.761, 9.442).mul(CFrame.Angles(math.rad(-3.959), math.rad(178.796), math.rad(0))),
		CameraType: Enum.CameraType.Fixed,
		FieldOfView: 70,
		FieldOfViewMode: Enum.FieldOfViewMode.Vertical,
		DiagonalFieldOfView: 88.877,
		MaxAxisFieldOfView: 70,
		Focus: new CFrame(-238.369, 3.645, 12.674),
	});

	const [referredToAsOpen, setReferredToAsOpen] = useState<boolean>(false);

	// Helper for updating single fields in DossierStore avatar data
	const saveAvatarData = <K extends keyof DossierData["avatar"]>(key: K, value: DossierData["avatar"][K]) => {
		DossierStore.updateAndSave((prev) => ({
			...prev,
			avatar: {
				...prev.avatar,
				[key]: value,
			},
		}));
	};
	// Spawn empty accessory ID field
	const handleAddAccessory = () => {
		const updatedAccessories = [...props.avatarItems.accessories, 0];
		saveAvatarData("accessories", updatedAccessories);
	};

	// Helper for updating accessory ID at specific index
	const handleAccessoryChange = (index: number, newId: number) => {
		const updated = [...props.avatarItems.accessories];
		updated[index] = newId;
		saveAvatarData("accessories", updated);
	};

	useEffect(() => {
		let isMounted = true;
		const viewportFrame = viewportFrameRef.current;
		if (!viewportFrame) return;

		viewportFrame.CurrentCamera = viewportCamera;
		const worldModelContainer = Make("WorldModel", { Parent: viewportFrameRef.current });
		r6rig.Parent = worldModelContainer;
		const humanoid = r6rig.FindFirstChild("Humanoid") as Humanoid;

		if (props.avatarItems.shirt) {
			Make("Shirt", { ShirtTemplate: ASSET_ID_PREFIX + props.avatarItems.shirt, Parent: r6rig });
		}
		if (props.avatarItems.pants) {
			Make("Pants", { PantsTemplate: ASSET_ID_PREFIX + props.avatarItems.pants, Parent: r6rig });
		}
		if (props.avatarItems.skin) {
			setAllBodyColors(bodyColors, deserializeColor3(props.avatarItems.skin));
		}

		const accessories = props.avatarItems.accessories;
		if (accessories && accessories.size() > 0) {
			accessories.forEach(async (accessoryId) => {
				if (accessoryId === 0) return;
				try {
					const fetchedItem = await RemoteFunctions.fetchViewportAccessoryOrFace(accessoryId);
					if (!isMounted || !fetchedItem) return;

					const localCopy = fetchedItem.Clone();
					if (localCopy.IsA("SpecialMesh")) {
						if (head) {
							const existingMesh = head.FindFirstChildWhichIsA("SpecialMesh");
							if (existingMesh) existingMesh.Destroy();
							localCopy.Parent = head;
						}
					} else if (localCopy.IsA("Accessory")) {
						if (humanoid) localCopy.Parent = humanoid;
						addAccoutrement(r6rig, localCopy);
					}
				} catch (err) {
					warn(`Failed to fetch asset ${accessoryId}:`, err);
				}
			});
		}

		return () => {
			isMounted = false;
			r6rig.Parent = ReplicatedStorage;
			worldModelContainer.Destroy();
			viewportCamera.Destroy();
		};
	}, [props.avatarItems, dossierEditingOpenAtom]);

	return (
		<frame
			Size={UDim2.fromScale(0.98, 0.98)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			Position={UDim2.fromScale(0.5, 0.5)}
			BackgroundTransparency={1}
		>
			<textlabel
				Text={"Custom build avatar"}
				Size={UDim2.fromScale(0.6, 0.1)}
				TextXAlignment={"Left"}
				BackgroundTransparency={1}
				TextSize={15}
			/>

			<frame Size={UDim2.fromScale(0.59, 0.8)} Position={UDim2.fromScale(0.03, 0.15)}>
				<scrollingframe
					Size={UDim2.fromScale(1, 0.64)}
					CanvasSize={UDim2.fromScale(1)}
					ScrollingDirection={"Y"}
					ScrollBarThickness={0}
					AutomaticCanvasSize={"Y"}
				>
					<uilistlayout FillDirection={"Vertical"} />
					<SingleLineDataDisplay
						data="Shirt"
						value={props.avatarItems.shirt}
						onChange={(val) => saveAvatarData("shirt", val)}
					/>
					<SingleLineDataDisplay
						data="Pants"
						value={props.avatarItems.pants}
						onChange={(val) => saveAvatarData("pants", val)}
					/>
					<MultiLineDataDisplay
						data="Accessories"
						values={props.avatarItems.accessories}
						onAdd={handleAddAccessory}
						onItemChange={handleAccessoryChange}
					/>
				</scrollingframe>

				<frame
					Size={UDim2.fromScale(1, 0.36)}
					Position={UDim2.fromScale(0.5, 1)}
					AnchorPoint={new Vector2(0.5, 1)}
				>
					<uilistlayout FillDirection={"Vertical"} />

					{/* Nickname */}
					<frame Size={new UDim2(1, 0, 0, 15)}>
						<textlabel Size={UDim2.fromScale(0.45, 1)} Text={"Nickname"} />
						<textbox
							Size={UDim2.fromScale(0.55, 1)}
							Text={props.avatarItems.nickname}
							AnchorPoint={new Vector2(1)}
							Position={UDim2.fromScale(1)}
							ClearTextOnFocus={false}
							Event={{
								FocusLost: (rbx) => saveAvatarData("nickname", rbx.Text),
							}}
						/>
					</frame>

					{/* Highlight Color */}
					<frame Size={new UDim2(1, 0, 0, 15)}>
						<textlabel Size={UDim2.fromScale(0.45, 1)} Text={"Highlight"} />
						<textbox
							Size={UDim2.fromScale(0.55, 1)}
							Text={deserializeColor3(props.avatarItems.highlight).ToHex()}
							AnchorPoint={new Vector2(1)}
							Position={UDim2.fromScale(1)}
							ClearTextOnFocus={false}
							BackgroundColor3={deserializeColor3(props.avatarItems.highlight)}
							Event={{
								FocusLost: (rbx) => {
									const [success, color] = pcall(() => Color3.fromHex(rbx.Text));
									if (success) {
										saveAvatarData("highlight", serializeColor3(color));
									}
								},
							}}
						/>
					</frame>

					{/* Skin Color */}
					<frame Size={new UDim2(1, 0, 0, 15)}>
						<textlabel Size={UDim2.fromScale(0.45, 1)} Text={"Skin"} />
						<textbox
							Size={UDim2.fromScale(0.55, 1)}
							Text={deserializeColor3(props.avatarItems.skin).ToHex()}
							AnchorPoint={new Vector2(1)}
							Position={UDim2.fromScale(1)}
							ClearTextOnFocus={false}
							BackgroundColor3={deserializeColor3(props.avatarItems.skin)}
							Event={{
								FocusLost: (rbx) => {
									const [success, color] = pcall(() => Color3.fromHex(rbx.Text));
									if (success) {
										saveAvatarData("skin", serializeColor3(color));
									}
								},
							}}
						/>
					</frame>

					{/* Gender Dropdown */}
					<frame Size={new UDim2(1, 0, 0, 15)}>
						<textlabel Size={UDim2.fromScale(0.45, 1)} Text={"Referred to as"} />
						<textbutton
							Size={UDim2.fromScale(0.55, 1)}
							Text={props.avatarItems.gender}
							AnchorPoint={new Vector2(1)}
							Position={UDim2.fromScale(1)}
							Event={{
								MouseButton1Click: () => setReferredToAsOpen(!referredToAsOpen),
							}}
						>
							{referredToAsOpen && (
								<frame
									Size={UDim2.fromScale(1, 3)}
									ZIndex={4}
									BackgroundColor3={UICONSTS.color.red}
									Position={UDim2.fromScale(0, 1)}
									AnchorPoint={new Vector2(0, 0)}
								>
									<uilistlayout FillDirection={"Vertical"} />
									<textbutton
										Size={UDim2.fromScale(1, 0.33)}
										Text={"male"}
										Event={{
											MouseButton1Click: () => {
												saveAvatarData("gender", "male");
												setReferredToAsOpen(false);
											},
										}}
									/>
									<textbutton
										Size={UDim2.fromScale(1, 0.33)}
										Text={"female"}
										Event={{
											MouseButton1Click: () => {
												saveAvatarData("gender", "female");
												setReferredToAsOpen(false);
											},
										}}
									/>
									<textbutton
										Size={UDim2.fromScale(1, 0.33)}
										Text={"none"}
										Event={{
											MouseButton1Click: () => {
												saveAvatarData("gender", "none");
												setReferredToAsOpen(false);
											},
										}}
									/>
								</frame>
							)}
						</textbutton>
					</frame>
				</frame>
			</frame>

			<frame
				Size={UDim2.fromScale(0.35, 0.9)}
				Position={UDim2.fromScale(0.99, 0.06)}
				AnchorPoint={new Vector2(1, 0)}
			>
				<viewportframe
					ref={viewportFrameRef}
					Size={UDim2.fromScale(1, 1)}
					BackgroundColor3={new Color3(0, 0, 0)}
					BackgroundTransparency={1}
				/>
			</frame>
		</frame>
	);
}

function SingleLineDataDisplay(props: { data: string; value: string; onChange: (val: string) => void }) {
	return (
		<frame Size={new UDim2(1, 0, 0, 15)}>
			<textlabel Size={UDim2.fromScale(0.45, 1)} Text={props.data} />
			<textbox
				Size={UDim2.fromScale(0.55, 1)}
				Text={props.value}
				AnchorPoint={new Vector2(1)}
				Position={UDim2.fromScale(1)}
				ClearTextOnFocus={false}
				Event={{
					FocusLost: (rbx) => props.onChange(rbx.Text),
				}}
			/>
		</frame>
	);
}

function MultiLineDataDisplay(props: {
	data: string;
	values: number[];
	onAdd: () => void;
	onItemChange: (idx: number, newId: number) => void;
}) {
	return (
		<frame Size={UDim2.fromScale(1)} AutomaticSize={"Y"}>
			<textlabel
				Size={new UDim2(0.45, 0, 0, 15)}
				Text={"      " + props.data}
				AutomaticSize={"Y"}
				ZIndex={5}
				TextXAlignment={"Left"}
			>
				<textbutton
					Size={UDim2.fromScale(0.2, 0.7)}
					Position={UDim2.fromScale(1, 0.5)}
					AnchorPoint={new Vector2(1, 0.5)}
					Text={"+"}
					TextSize={13}
					BackgroundTransparency={1}
					Event={{ MouseButton1Click: props.onAdd }}
				/>
			</textlabel>
			<frame
				Size={new UDim2(0.55, 0, 0, 15)}
				AnchorPoint={new Vector2(1)}
				Position={UDim2.fromScale(1)}
				AutomaticSize={"Y"}
				BackgroundColor3={UICONSTS.color.red}
			>
				<uilistlayout FillDirection={"Vertical"} />
				{props.values.map((value, idx) => (
					<textbox
						key={idx}
						Size={new UDim2(1, 0, 0, 15)}
						Position={UDim2.fromScale(1)}
						AnchorPoint={new Vector2(1, 0)}
						Text={value === 0 ? "" : tostring(value)}
						ClearTextOnFocus={false}
						Event={{
							FocusLost: (rbx) => {
								const num = tonumber(rbx.Text) ?? 0;
								props.onItemChange(idx, num);
							},
						}}
					/>
				))}
			</frame>
		</frame>
	);
}

export const DUMMY_DOSSIER: DossierData = {
	creatorUserId: 1, //default dossier
	currentPage: "1",
	pages: {
		"1": {
			label: '\n                                                                 <b>CONFIDENTIAL</b> \n                                                                          \n\n_______________________________________<b><font size="12"> DD-006</font></b>\n\n<b>Name :</b> Jonathan King\n<b>Status:</b> <r>CLASSIFIED</r>\n<b>DOB   :</b> <r>XX</r>-<r>XX</r>-2013  \n<b>Languages Spoken:</b>   \n - Indonesian (Ongoing teaching \nexperience, refer to footnotes)  \n - English<<break>> <<loadout>>  <<break>> <<skills>>',
			images: [
				{
					id: "aic",
					assetId: "98292970916878",
					position: { x: 0.01, y: 0.005 },
					size: { x: 0.3, y: 0.15 },
					zIndex: 1,
					aspectratio: 3 / 2,
				},
				{
					id: "john",
					assetId: "83845462146492",
					position: { x: 0.73, y: 0.15 },
					size: { x: 0.3, y: 0.13 },
					zIndex: 2,
					aspectratio: 1,
				},
			],
		},
		"2": {
			label: "<b> Psychological Notes</b>\n John King is to be considered with a highly skeptical lens. His psychiatric development, if not at the very least extremely stunted yet simultaneously overzealously mature, is highly odd and seemingly supernatural. Besides this fact, John suffers from Type II Antisocial Personality Disorder. His remarkably sociopathic attitude makes him highly distrusting of his environment, often flying into fits of isolative contemplative internal rage at a perceived lack of control. Through this lack of control, he wishes to exert his admittedly large but unannounced ego onto the environment through a mastery of a variety of martial arts skills and combative means, his motivation for his skilful use of neck snapping, choking, throwing and otherwise combat techniques is inherently a persistent undoubtedly unfixable psychological flaw, though an individual close to him comes to mind to consistently mend his issues. His perceived lack of control of his environment draws him away from general society and to begin resenting his peers and associates, going so far as to disregard their life value just to be left alone. Though, his lack of control makes him highly materialistic in a push to control his environment even further, hence, it is recommended to keep Jonathan as an asset through increased financial compensation. He feels an increased resentment towards many individuals regardless of identity or relatability, and has an unending recklessness.",
			images: [],
		},
	},
	avatar: {
		shirt: "204560686",
		pants: "1485522424",
		accessories: [5163631069, 89730005123720],
		nickname: "John",
		gender: "male",
		highlight: serializeColor3(new Color3(0.54, 0.02, 0.02)),
		skin: serializeColor3(new Color3(0.81, 0.7, 0.62)),
	},
	build: {
		id: "DD-006",
		buildName: "En Hakkim",
		loadout: ["Vag73", "Katana"],
		skills: ["Dark Triad II", "Agile", "Darkly Dreaming"],
	},
};

function parseCustomRichText(text: string, currentActiveDossier: DossierData): string {
	let parsed = text;

	//Convert <<break>> into a visual line divider string or newline break
	parsed = parsed.gsub("<<break>>", "\n_______________________________________")[0];

	//Format Loadout list
	const loadoutList = currentActiveDossier.build.loadout.map((item) => `- ${item}`).join("\n");
	const loadoutFormatted = `\n<b>Authorized Loadout</b>\n${loadoutList}`;
	parsed = parsed.gsub("<<loadout>>", loadoutFormatted)[0];

	//Format Skills list
	const skillsList = currentActiveDossier.build.skills.map((skill) => `- ${skill}`).join("\n");
	const skillsFormatted = `\n<b>Skills</b>\n${skillsList}`;
	parsed = parsed.gsub("<<skills>>", skillsFormatted)[0];

	//Convert <r>text</r> into redaction: Black fill + black background highlights
	parsed = parsed.gsub("<r>(.-)</r>", (match: string) => {
		// Preserves spaces so multi-word redactions break naturally across lines
		return match.gsub("%S", "█")[0];
	})[0];

	return parsed;
}

function formatScale(value: number): string {
	const rounded = math.round(value * 10000) / 10000;
	return tostring(rounded);
}

/**
 * Replaces actual newline characters (\n) with literal "\n" strings for raw text display.
 */
export function formatToLiteralNewlines(text: string): string {
	return text.gsub("\n", "\\n")[0];
}

/**
 * Replaces literal "\n" strings back into actual newline characters (\n) for saving data.
 */
export function parseLiteralNewlines(text: string): string {
	return text.gsub("\\n", "\n")[0];
}

function weldAttachments(attach1: Attachment, attach2: Attachment): Weld {
	const weld = new Instance("Weld");
	weld.Part0 = attach1.Parent as BasePart;
	weld.Part1 = attach2.Parent as BasePart;
	weld.C0 = attach1.CFrame;
	weld.C1 = attach2.CFrame;
	weld.Parent = attach1.Parent;
	return weld;
}

function buildWeld(weldName: string, parent: Instance, part0: BasePart, part1: BasePart, c0: CFrame, c1: CFrame): Weld {
	const weld = new Instance("Weld");
	weld.Name = weldName;
	weld.Part0 = part0;
	weld.Part1 = part1;
	weld.C0 = c0;
	weld.C1 = c1;
	weld.Parent = parent;
	return weld;
}

function findFirstMatchingAttachment(model: Instance, name: string): Attachment | undefined {
	for (const child of model.GetChildren()) {
		if (child.IsA("Attachment") && child.Name === name) {
			return child;
		} else if (!child.IsA("Accoutrement") && !child.IsA("Tool")) {
			// Don't look in hats or tools inside the character
			const foundAttachment = findFirstMatchingAttachment(child, name);
			if (foundAttachment) {
				return foundAttachment;
			}
		}
	}
	return undefined;
}

export function addAccoutrement(character: Model, accoutrement: Accoutrement): void {
	accoutrement.Parent = character;
	const handle = accoutrement.FindFirstChild("Handle");

	if (handle && handle.IsA("BasePart")) {
		const accoutrementAttachment = handle.FindFirstChildOfClass("Attachment");

		if (accoutrementAttachment) {
			const characterAttachment = findFirstMatchingAttachment(character, accoutrementAttachment.Name);
			if (characterAttachment) {
				weldAttachments(characterAttachment, accoutrementAttachment);
			}
		} else {
			// Fallback for classic legacy hats without attachments
			const head = character.FindFirstChild("Head");
			if (head && head.IsA("BasePart")) {
				const attachmentCFrame = new CFrame(0, 0.5, 0);
				const hatCFrame = accoutrement.AttachmentPoint;
				buildWeld("HeadWeld", head, head, handle, attachmentCFrame, hatCFrame);
			}
		}
	}
}

function setAllBodyColors(bodyColor: BodyColors, color: Color3) {
	bodyColor.HeadColor3 = color;
	bodyColor.TorsoColor3 = color;
	bodyColor.LeftArmColor3 = color;
	bodyColor.RightArmColor3 = color;
	bodyColor.LeftLegColor3 = color;
	bodyColor.RightLegColor3 = color;
}

function InsertedImage(props: {
	id: string;
	position: UDim2;
	size: UDim2;
	zIndex: number;
	page: string;
	aspectratio?: number;
	bgColor?: Color3;
}) {
	return (
		<frame Size={new UDim2(0.98, 0, 0, 50)}>
			<frame Size={UDim2.fromScale(0.82, 1)}>
				{/*id*/}
				<frame Size={new UDim2(0.7, 0, 0, 20)} Position={UDim2.fromScale(0.05, 0.05)}>
					<textbox
						Size={UDim2.fromScale(1, 1)}
						Text={props.id}
						TextSize={11}
						ClearTextOnFocus={false}
					></textbox>
				</frame>

				{/*position*/}
				<textlabel
					Text={
						"pos X: " + formatScale(props.position.X.Scale) + " Y: " + formatScale(props.position.Y.Scale)
					}
					Position={UDim2.fromScale(0.05, 0.5)}
					Size={new UDim2(0.7, 0, 0, 10)}
					BackgroundTransparency={1}
				></textlabel>

				{/*size */}
				<textlabel
					Text={"size X: " + formatScale(props.size.X.Offset) + " Y: " + formatScale(props.size.Y.Scale)}
					Position={UDim2.fromScale(0.05, 0.75)}
					Size={new UDim2(0.7, 0, 0, 10)}
					BackgroundTransparency={1}
				></textlabel>

				{/*zindex */}
				<textlabel
					Text={"z: " + tostring(props.zIndex)}
					Position={UDim2.fromScale(0.78, 0.1)}
					Size={new UDim2(0.2, 0, 0, 10)}
					TextXAlignment={"Left"}
					BackgroundTransparency={1}
				></textlabel>

				{/*page */}
				<textlabel
					Text={"page:" + tostring(props.page)}
					Position={UDim2.fromScale(0.78, 0.3)}
					Size={new UDim2(0.2, 0, 0, 12)}
					TextXAlignment={"Left"}
					BackgroundTransparency={1}
				></textlabel>

				<textlabel
					Text={"ratio:" + (props.aspectratio !== undefined ? tostring(props.aspectratio) : "-")}
					Position={UDim2.fromScale(0.78, 0.5)}
					Size={new UDim2(0.2, 0, 0, 12)}
					TextXAlignment={"Left"}
					BackgroundTransparency={1}
				></textlabel>

				<textbutton
					Position={UDim2.fromScale(0.78, 0.75)}
					Size={new UDim2(0.12, 0, 0, 10)}
					Text={""}
					BackgroundColor3={props.bgColor !== undefined ? props.bgColor : new Color3(0, 0, 0)}
				/>
			</frame>

			{/*bin */}
			<frame
				Size={UDim2.fromScale(0.24, 0.4)}
				Position={UDim2.fromScale(0.97, 0.95)}
				AnchorPoint={new Vector2(1, 1)}
				BackgroundTransparency={1}
			>
				<imagelabel
					Size={UDim2.fromScale(1, 1)}
					Image={"rbxassetid://110444288083447"}
					ImageColor3={new Color3(0.31, 0.31, 0.31)}
					BackgroundTransparency={1}
				/>
				<uiaspectratioconstraint />
			</frame>

			{/*pencil */}
			<frame
				Size={UDim2.fromScale(0.24, 0.4)}
				Position={UDim2.fromScale(0.97, 0.05)}
				AnchorPoint={new Vector2(1, 0)}
				BackgroundTransparency={1}
			>
				<imagelabel
					Size={UDim2.fromScale(1, 1)}
					Image={"rbxassetid://118146129317443"}
					ImageColor3={new Color3(0.31, 0.31, 0.31)}
					BackgroundTransparency={1}
				/>
				<uiaspectratioconstraint />
			</frame>
		</frame>
	);
}
