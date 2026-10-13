import React, { Element, useEffect, useRef, useState } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { Players, ReplicatedStorage, RunService, TweenService, UserInputService, Workspace } from "@rbxts/services";
import { currentTheme, styleImageLabel, UICONSTS } from "../Uistyle";
import { GameMenuButton } from "./GameMenuButton";
import { StatisticsPanel } from "./StatisticsPanel";
import { SettingsPanel } from "./SettingsPanel";
import {
	clientPing,
	hideServerInfo,
	isThirdPerson,
	regionAtom,
} from "client/clientAtoms";
import { useAtom } from "@rbxts/react-charm";
import { server } from "@rbxts/yetanothernet";
import { DossierBuilding } from "../dossier/DossierBuilding";
import { DossierEditing } from "../dossier/DossierEditing";
import { generateDossier } from "client/clientutils/generateDossier";
import { IMAGE_IDS } from "shared/data/assetid/ImageIDs";
import { dossierBuildingOpen, dossierEditingOpen, dossierMenuOpen, GAME_VERSION, gameMenuOpen } from "shared/sharedAtoms";
import { DossierStore } from "../stores/DossierStore";
import { getDossierGenerated, setDossierGenerated } from "client/inputhandlers/ui/DossierHandler";
import { getMouseIconEnabled } from "shared/utils/ui/getMouseIconEnabled";

const FADE_DURATION = 0.2;

interface GameMenuProps {
	previewMode?: boolean;
}

export function GameMenu({ previewMode = false }: GameMenuProps): Element {
	const imageLabelStyleProps = currentTheme !== "dark" ? styleImageLabel("white") : styleImageLabel("black");
	const gameMenuRef = useRef<CanvasGroup>(undefined);
	const gameMenuOpenAtom = useAtom(gameMenuOpen);
	const [modalTrue, setModalTrue] = useState(false); //makes mouse movement not make ur head move

	const [showStats, setShowStats] = useState(false);

	const [showSettings, setShowSettings] = useState(false);
	const [activeSettingsTab, setActiveSettingsTab] = useState("Keyboard");
	const [settingsPinned, setSettingsPinned] = useState(false);

	const hideSrvInfo = useAtom(hideServerInfo);
	const serverRegion = useAtom(regionAtom);
	const ping = useAtom(clientPing);
	const dossierEditingOpenAtom = useAtom(dossierEditingOpen);
	const dossierBuildingOpenAtom = useAtom(dossierBuildingOpen);
	const dossierMenuOpenAtom = useAtom(dossierMenuOpen);

	const shouldTweenRef = useRef(false);

	const openSettings = (tab: string) => {
		setActiveSettingsTab(tab);
		setShowSettings(true);
		setShowStats(false); // Close stats if open
	};

	useEffect(() => {
		const canvasGroup = gameMenuRef.current;
		if (!canvasGroup || previewMode) return;

		if (gameMenuOpenAtom) {
			// Opening Menu
			setModalTrue(true);
			const pingSeconds = Players.LocalPlayer.GetNetworkPing();
			clientPing(tostring(math.floor(pingSeconds * 1000)));

			canvasGroup.Visible = true;

			if (shouldTweenRef.current) {
				canvasGroup.GroupTransparency = 1;
				const tween = TweenService.Create(
					canvasGroup,
					new TweenInfo(FADE_DURATION, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					{ GroupTransparency: 0 },
				);
				tween.Play();
			} else {
				canvasGroup.GroupTransparency = 0;
			}
		} else {
			// Closing Menu
			setModalTrue(false);

			if (shouldTweenRef.current) {
				const tween = TweenService.Create(
					canvasGroup,
					new TweenInfo(FADE_DURATION, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
					{ GroupTransparency: 1 },
				);
				tween.Play();

				const conn = tween.Completed.Connect(() => {
					canvasGroup.Visible = false;
					conn.Disconnect();
				});
			} else {
				canvasGroup.GroupTransparency = 1;
				canvasGroup.Visible = false;
			}
		}

		// Reset tweening flag after handling
		shouldTweenRef.current = false;
	}, [gameMenuOpenAtom]);

	//M makes it tween while the button trigger instantly makes it disappear
	useEffect(() => {
		const connection = UserInputService.InputBegan.Connect((inp, proc) => {
			if (proc) return;

			if (inp.KeyCode === Enum.KeyCode.M) {
				// Mark that this toggle was triggered by user keypress
				shouldTweenRef.current = true;

				// Toggle the atom directly
				gameMenuOpen(!gameMenuOpenAtom);
				UserInputService.MouseIconEnabled = getMouseIconEnabled();
			}
		});

		return () => {
			connection.Disconnect();
		};
	}, [gameMenuOpenAtom]);

	return (
		<canvasgroup
			ref={gameMenuRef}
			key={"GameMenu"}
			Size={UDim2.fromScale(1, 1)}
			Visible={previewMode || gameMenuOpenAtom}
			GroupTransparency={previewMode ? 0 : 1}
			BackgroundColor3={UICONSTS.color.black}
			BackgroundTransparency={previewMode ? 0 : 1}
			ZIndex={10}
		>
			{/*this frees the mouse*/}
			<textbutton Modal={modalTrue} Transparency={1} TextTransparency={1} />
			<DossierEditing visible={dossierEditingOpenAtom} />
			<DossierBuilding visible={dossierBuildingOpenAtom} />

			{/*dossier selection button */}
			<imagebutton
				Size={UDim2.fromScale(0.07, 0.04)}
				Position={UDim2.fromScale(0.99, 0.91)}
				AnchorPoint={new Vector2(1, 1)}
				ZIndex={2}
				Image={"rbxassetid://84084995373041"}
				BackgroundTransparency={1}
				BackgroundColor3={new Color3(0, 0, 0)}
				Event={{
					MouseButton1Click: () => {
						// dossierMenuOpen(!dossierMenuOpenAtom);
						mountDossierMenu();
					},
				}}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagebutton>

			{/*dossier Building button*/}
			<imagebutton
				Size={UDim2.fromScale(0.07, 0.04)}
				Position={UDim2.fromScale(0.99, 0.95)}
				AnchorPoint={new Vector2(1, 1)}
				ZIndex={2}
				Image={"rbxassetid://91534766570623"}
				BackgroundTransparency={1}
				BackgroundColor3={new Color3(0, 0, 0)}
				Event={{
					MouseButton1Click: () => {
						dossierBuildingOpen(!dossierBuildingOpenAtom);
					},
				}}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagebutton>

			{/*dossier Editing button*/}
			<imagebutton
				Size={UDim2.fromScale(0.07, 0.04)}
				Position={UDim2.fromScale(0.99, 0.99)}
				AnchorPoint={new Vector2(1, 1)}
				ZIndex={2}
				Image={"rbxassetid://118146129317443"}
				BackgroundTransparency={1}
				BackgroundColor3={new Color3(0, 0, 0)}
				Event={{
					MouseButton1Click: () => {
						dossierEditingOpen(!dossierEditingOpenAtom);
						// print("d", dossierEditingOpenAtom);
					},
				}}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagebutton>

			{/* Fullscreen hidden button to unpin sub-menus when clicking elsewhere */}
			{settingsPinned && (
				<textbutton
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					Text=""
					ZIndex={1}
					Event={{
						Activated: () => setSettingsPinned(false),
					}}
				/>
			)}
			{/* black bg sides and top */}
			<frame Size={UDim2.fromScale(1, 1)} BackgroundColor3={new Color3(0, 0, 0)} Transparency={0}></frame>

			{/* white behind art */}
			<frame
				Size={UDim2.fromScale(0.9, 0.8)}
				Position={UDim2.fromScale(0.5, 1)}
				AnchorPoint={new Vector2(0.5, 1)}
				BackgroundColor3={new Color3(1, 1, 1)}
				Transparency={0}
				BorderSizePixel={0}
			>
				<uiaspectratioconstraint AspectRatio={1492 / 1119} />
			</frame>

			{/* art */}
			<imagelabel
				Size={UDim2.fromScale(1, 0.8)}
				Position={UDim2.fromScale(0.5, 1)}
				AnchorPoint={new Vector2(0.5, 1)}
				Image={"rbxassetid://113328536805112"}
				Transparency={previewMode ? 0 : 1}
				ImageTransparency={0}
				BorderSizePixel={0}
				BackgroundTransparency={1}
			>
				<uiaspectratioconstraint AspectRatio={1492 / 1119} />
			</imagelabel>

			{/* server info */}
			<textlabel
				Text={"version: " + GAME_VERSION}
				Position={UDim2.fromScale(0.99, 0.00001)}
				AnchorPoint={new Vector2(1, 0)}
				Size={UDim2.fromScale(0.25, 0.03)}
				BackgroundColor3={UICONSTS.color.black}
				BackgroundTransparency={1}
				TextSize={11}
				TextXAlignment={"Right"}
				TextColor3={UICONSTS.color.white}
				ZIndex={1}
			></textlabel>

			{/* server info */}
			{(previewMode || !hideSrvInfo) && (
				<textlabel
					Text={"ServerRegion: " + serverRegion + "  |  Ping : " + ping + " ms"}
					Position={UDim2.fromScale(0.99, 0.024)}
					AnchorPoint={new Vector2(1, 0)}
					Size={UDim2.fromScale(0.25, 0.03)}
					BackgroundColor3={UICONSTS.color.black}
					BackgroundTransparency={1}
					TextSize={11}
					TextXAlignment={"Right"}
					TextColor3={UICONSTS.color.white}
					ZIndex={1}
				></textlabel>
			)}

			{/*lightchaser logo */}
			<imagelabel
				Size={UDim2.fromScale(0.3, 0.2)}
				Image={IMAGE_IDS.ui.lc.pre_alpha_left}
				Position={UDim2.fromScale(0.05, 0.2)}
				BackgroundTransparency={1}
			>
				<uiaspectratioconstraint AspectRatio={566 / 180} />
			</imagelabel>
			<frame
				Size={UDim2.fromScale(0.13, 0.21)}
				Position={UDim2.fromScale(0.05, 0.48)}
				AnchorPoint={new Vector2(0, 0.5)}
				BackgroundTransparency={1}
			>
				<uilistlayout
					FillDirection={"Vertical"}
					HorizontalAlignment={"Center"}
					VerticalAlignment={"Top"}
					VerticalFlex={"SpaceEvenly"}
				/>

				<GameMenuButton
					text="SETTINGS"
					onclick={() => {
						const willBeOpen = !showSettings;

						setShowSettings(willBeOpen);
						setSettingsPinned(willBeOpen); // Sync the sub-menu pin with the frame visibility

						if (willBeOpen) {
							openSettings(activeSettingsTab);
						}
					}}
				/>

				<GameMenuButton
					text="STATISTICS"
					onclick={() => {
						setShowStats(!showStats);
					}}
				/>
				<GameMenuButton text="MANUAL" onclick={() => {}} />
			</frame>
			{showStats && <StatisticsPanel />}
			{showSettings && <SettingsPanel activeTab={activeSettingsTab} setActiveTab={setActiveSettingsTab} />}
			{settingsPinned && (
				<textbutton
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					Text=""
					ZIndex={1}
					Event={{
						Activated: () => {
							setSettingsPinned(false);
							setShowSettings(false);
						},
					}}
				/>
			)}
		</canvasgroup>
	);
}

let tiltY = 0;
let tiltX = 0;
let camConn: RBXScriptConnection;
const MAX_TILT_DEGREES = 10; // Max tilt in either direction
const SWAY_SPEED = 0.1; // Smoothness (lower is smoother)

export function mountDossierMenu() {
	const dossierCabinet = Workspace.WaitForChild("DossierCabinet") as DossierCabinetModel;
	const camPart = dossierCabinet.WaitForChild("CameraPart") as Part;

	const currentCamera = Workspace.CurrentCamera!;

	if (!getDossierGenerated()) {
		setDossierGenerated(true);
		// generateDossier(dossierCabinet);
	}

	if (!dossierMenuOpen()) {
		// === OPEN MENU ===
		gameMenuOpen(false);
		dossierBuildingOpen(false);
		dossierEditingOpen(false);
		UserInputService.MouseIconEnabled = true || getMouseIconEnabled();
		print(getMouseIconEnabled(), UserInputService.MouseIconEnabled);
		dossierMenuOpen(true);
		isThirdPerson(true);
		UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter; //force center so center not set on the bottom left
		UserInputService.MouseBehavior = Enum.MouseBehavior.Default; // Unlock the mouse
		currentCamera.FieldOfView = 90;
		const currentData = DossierStore.getDossiers();

		let camPartOffset = camPart.CFrame;
		if (currentData.size() > 25) {
			camPartOffset = camPartOffset.mul(new CFrame(0, 0, 3)); //moves camera back if theres too many dossiers
		} else if (currentData.size() > 15) {
			camPartOffset = camPartOffset.mul(new CFrame(0, 0, 2));
		}

		// Reset tilt to 0 prevents snapping when re-opening
		tiltX = 0;
		tiltY = 0;

		const dossierCabinetAddBuildButton = dossierCabinet.FindFirstChild("Add") as Part;

		//camera sway
		camConn = RunService.RenderStepped.Connect((dt) => {
			// 1. Get Screen Dimensions & Mouse Position
			const viewportSize = currentCamera.ViewportSize;
			const mousePos = UserInputService.GetMouseLocation(); // Returns Vector2 in pixels

			// 2. Calculate Center of Screen
			const centerX = viewportSize.X / 2;
			const centerY = viewportSize.Y / 2;

			// 3. Calculate Normalized Offset (-1 to 1)
			// Ex: If mouse is at left edge: (0 - center) / center = -1
			// Ex: If mouse is at right edge: (width - center) / center = 1
			const normX = (mousePos.X - centerX) / centerX;
			const normY = (mousePos.Y - centerY) / centerY;

			// 4. Determine Target Tilt (in Radians)
			const maxTiltRad = math.rad(MAX_TILT_DEGREES);

			// look towards the mouse direction slightly.
			const targetTiltX = -normX * maxTiltRad; // Yaw
			const targetTiltY = -normY * maxTiltRad; // Pitch

			tiltX = lerp(tiltX, targetTiltX, SWAY_SPEED);
			tiltY = lerp(tiltY, targetTiltY, SWAY_SPEED);

			// Apply to Camera
			currentCamera.CFrame = camPartOffset.mul(CFrame.Angles(tiltY, tiltX, 0));
		});
	} else {
		// === CLOSE MENU ===
		UserInputService.MouseIconEnabled = false || getMouseIconEnabled();
		print(getMouseIconEnabled(), UserInputService.MouseIconEnabled);
		dossierMenuOpen(false);
		isThirdPerson(false);
		const bg = Workspace.CurrentCamera?.FindFirstChild("DossierUIBackground");
		if (bg) {
			bg.Destroy();
		}
		UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;
		currentCamera.FieldOfView = 70;

		if (camConn) {
			camConn.Disconnect();
		}
		// if (clone) {
		// 	clone.Destroy();
		// }
	}
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}
