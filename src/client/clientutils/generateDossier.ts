import { ReplicatedStorage, Players, TweenService, Workspace } from "@rbxts/services";
import { selectedPreviewDossier, currentlyEditedDossierData } from "client/clientAtoms";
import { DossierStore } from "client/ui/stores/DossierStore";

// let dossierUIClone: typeof ReplicatedStorage.CAAssets.misc.dossierTemplate.DossierUIBackground;
let clickSoundClone: Sound;
const ASSETS_FOLDER = ReplicatedStorage.WaitForChild("CAAssets").WaitForChild("misc").WaitForChild("dossierTemplate");
const DRAWER_OPEN_PADDING = 0.3;
const DOSSIER_BASE_ROTATION = CFrame.fromOrientation(0, math.rad(90), math.rad(-90)); // This keeps the dossier model upright instead of flat

export function generateDossier(cabinetModel: DossierCabinetModel) {
	// const drawer = cabinetModel.DossierDrawer;
	// const currentData = DossierStore.getDossiers();
	// const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui");

	// const guiFolder = playerGui.WaitForChild("DossierSurfaceGui") as Folder;
	// const guiTemplate = playerGui.WaitForChild("DossierTemplateGui") as DossierGuiTemplate;

	// // Cleanup
	// drawer.GetChildren().forEach((child) => {
	// 	if (child.Name === "GeneratedDossier") {
	// 		child.Destroy();
	// 	}
	// });
	// guiFolder.ClearAllChildren();

	// if (currentData.size() === 0) return;

	// const folderThickness = 0.15;
	// const referencePart = drawer.WaitForChild("Drawer").WaitForChild("ReferencePart") as Part;

	// //Calculate Extension and Move Drawer BEFORE creating items
	// const startOffset = 0.05;
	// const totalUsedThickness = currentData.size() * folderThickness;
	// const finalOffset = startOffset - totalUsedThickness;

	// // Move the drawer out now, so the ReferencePart is in the correct "Open" world position
	// const neededExtension = -(-finalOffset + DRAWER_OPEN_PADDING);
	// drawer.PivotTo(drawer.GetPivot().mul(new CFrame(0, 0, neededExtension)));

	// let currentOffset = startOffset;

	// currentData.forEach((dossier, index) => {
	// 	const templateNum = (index % 4) + 1;
	// 	const templateName = `Dossier${templateNum}`;

	// 	const template = ASSETS_FOLDER.WaitForChild(templateName) as DossierModel;
	// 	const clone = template.Clone();
	// 	clone.Name = "GeneratedDossier";
	// 	clone.Parent = drawer;

	// 	// (Since ReferencePart moved with the drawer, this now places items in the OPEN position)
	// 	const targetCFrame = referencePart.GetPivot().mul(new CFrame(0, 0, -currentOffset)).mul(DOSSIER_BASE_ROTATION);
	// 	clone.PivotTo(targetCFrame);

	// 	if (clone.PrimaryPart) clone.PrimaryPart.Anchored = true;

	// 	const homeCFrame = clone.PrimaryPart!.CFrame;

	// 	// Use World Space addition (add Vector3) to ensure it goes UP regardless of rotation
	// 	const raisedCFrame = homeCFrame.add(new Vector3(0, 0.05, 0));

	// 	const upTween = TweenService.Create(clone.PrimaryPart!, new TweenInfo(0.12), {
	// 		CFrame: raisedCFrame,
	// 	});
	// 	const downTween = TweenService.Create(clone.PrimaryPart!, new TweenInfo(0.12), {
	// 		CFrame: homeCFrame,
	// 	});

	// 	// Setup UI
	// 	const uiClone = guiTemplate.Clone();
	// 	uiClone.Adornee = clone.Label.NameLabel;
	// 	uiClone.Parent = guiFolder;
	// 	uiClone.Enabled = true;

	// 	const button = uiClone.Frame.TextButton;
	// 	button.Text = dossier.build.buildName;

	// 	button.MouseButton1Click.Connect(() => {
	// 		if (dossierUIClone) {
	// 			dossierUIClone.Destroy();
	// 		}

	// 		clickSoundClone = ReplicatedStorage.CAAssets.audio.click.Clone();
	// 		clickSoundClone.Parent = Workspace;
	// 		clickSoundClone.Play();
	// 		const conn = clickSoundClone.Ended.Connect(() => {
	// 			clickSoundClone.Destroy();
	// 			conn.Disconnect();
	// 		});

	// 		// print("set selected ", dossier.build.buildName);
	// 		selectedPreviewDossier(dossier);

	// 		const dossierBGTemplate = ReplicatedStorage.CAAssets.misc.dossierTemplate.DossierUIBackground;
	// 		dossierUIClone = dossierBGTemplate.Clone();
	// 		dossierUIClone.CameraPart.Position = Workspace.CurrentCamera!.CFrame.Position;
	// 		dossierUIClone.CameraPart.Orientation = dossierUIClone.CameraPart.Orientation.mul(new Vector3(180, 0, 0));
	// 		dossierUIClone.Parent = Workspace.CurrentCamera!;
	// 		const dossierRoot = Players.LocalPlayer.WaitForChild("PlayerGui").WaitForChild("DossierRoot") as SurfaceGui;
	// 		dossierRoot.Adornee = dossierUIClone.Paper;

	// 		const btn = Workspace.CurrentCamera?.WaitForChild("DossierUIBackground")
	// 			.WaitForChild("Label")
	// 			.WaitForChild("NameLabel")
	// 			.WaitForChild("DossierTemplateGui")
	// 			.WaitForChild("Frame")
	// 			.WaitForChild("TextButton") as TextButton;
	// 		btn.Text = dossier.build.buildName;

	// 		const editDossierButton = Workspace.CurrentCamera?.WaitForChild("DossierUIBackground").WaitForChild(
	// 			"Edit",
	// 		) as BasePart; //wipe button will be in the edit section
	// 		const previewDossierButton = Workspace.CurrentCamera?.WaitForChild("DossierUIBackground").WaitForChild(
	// 			"Preview",
	// 		) as BasePart;
	// 		const nextDossierPageButton = Workspace.CurrentCamera?.WaitForChild("DossierUIBackground").WaitForChild(
	// 			"Next page",
	// 		) as BasePart;
	// 		const previousDossierPageButton = Workspace.CurrentCamera?.WaitForChild("DossierUIBackground").WaitForChild(
	// 			"Previous page",
	// 		) as BasePart;

	// 		const nextClick = nextDossierPageButton.FindFirstChild("ClickDetector") as ClickDetector;
	// 		const prevClick = previousDossierPageButton.FindFirstChild("ClickDetector") as ClickDetector;

	// 		const nextConn = nextClick.MouseClick.Connect((plr) => {
	// 			currentlyEditedDossierData((prevData) => {
	// 				if (!prevData) return prevData;
	// 				return {
	// 					...prevData,
	// 					currentPage: "2", // Mutates only the page property immutably
	// 				};
	// 			});
	// 		});

	// 		const prevConn = prevClick.MouseClick.Connect((plr) => {
	// 			currentlyEditedDossierData((prevData) => {
	// 				if (!prevData) return prevData;
	// 				return {
	// 					...prevData,
	// 					currentPage: "1",
	// 				};
	// 			});
	// 		});
	// 	});

	// 	button.InputBegan.Connect((inp) => {
	// 		upTween.Play();
	// 	});

	// 	button.InputEnded.Connect((inp) => {
	// 		downTween.Play();
	// 	});

	// 	currentOffset -= folderThickness;
	// });
}
