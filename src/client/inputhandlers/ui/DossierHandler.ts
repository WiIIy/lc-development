import { Workspace, UserInputService, RunService } from "@rbxts/services";
import { Character } from "@rbxts/wcs";
import { isThirdPerson } from "client/clientAtoms";
import { DossierStore } from "client/ui/stores/DossierStore";
import { Action } from "shared/data/profile/defaultKeybinds";
import { dossierMenuOpen } from "shared/sharedAtoms";

let dossierGenerated: boolean;
let camConn: RBXScriptConnection;
// let clone: typeof ReplicatedStorage.CAAssets.misc.dossierTemplate.DossierUIBackground;
dossierGenerated = false;
const MAX_TILT_DEGREES = 10; // Max tilt in either direction
const SWAY_SPEED = 0.1; // Smoothness (lower is smoother)

let tiltY = 0;
let tiltX = 0;

export function getDossierGenerated(): boolean {
	return dossierGenerated;
}

export function setDossierGenerated(to: boolean) {
	dossierGenerated = to;
}

export const DossierHandlers: Partial<Record<Action, (char: Character, input: InputObject, active: boolean) => void>> =
	{
		[Action.DossierMenu]: (char, input, active) => {
			if (!active) return;
			const dossierCabinet = Workspace.WaitForChild("DossierCabinet") as DossierCabinetModel;
			const camPart = dossierCabinet.WaitForChild("CameraPart") as Part;
			const currentCamera = Workspace.CurrentCamera!;

			if (!dossierGenerated) {
				dossierGenerated = true;
				// generateDossier(dossierCabinet);
			}

			if (!dossierMenuOpen()) {
				// === OPEN MENU ===
				UserInputService.MouseIconEnabled = true;
				dossierMenuOpen(true);
				print("dossier menu open");
				isThirdPerson(true);
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
				UserInputService.MouseIconEnabled = false;
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
		},
		[Action.DossierMenuNew]: (char, input, active) => {},
	};

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}