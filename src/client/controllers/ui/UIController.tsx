import { Controller, OnStart } from "@flamework/core";
import Make from "@rbxts/make";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";
import ReactRoblox from "@rbxts/react-roblox";
import { Players, StarterGui } from "@rbxts/services";
import { GameApp } from "client/ui/GameApp";
import { GameRouter } from "client/ui/GameRouter";
import { NpcDetail } from "client/ui/antler/NpcDetails";
import { DevApp } from "client/ui/devoverlay/DevApp";
import DialogueHandler from "client/ui/dialogue/DialogueTextHandler";
import { DossierMenu } from "client/ui/dossier/DossierMenu";
import { DossierMenuReturnIcons } from "client/ui/gamemenu/DossierMenuReturnIcons";
import { GameMenu } from "client/ui/gamemenu/GameMenu";
import { ClientContext } from "shared/ClientContext";
import { dialogueProducer } from "shared/utils/ui/dialogueProducer";

//trying chat messages out
const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

@Controller({})
export class UIController implements OnStart {
	constructor() {
		ClientContext.UIController = this;
	}

	private metaOverlay = Make("ScreenGui", {
		Name: "DevOverlay",
		ResetOnSpawn: false,
		Parent: playerGui,
	});

	private gameRoot = Make("ScreenGui", {
		Name: "GameRoot",
		ResetOnSpawn: false,
		Parent: playerGui,
		IgnoreGuiInset: true,
	});

	private dialogueRoot = Make("ScreenGui", {
		Name: "DialogueRoot",
		Parent: playerGui,
		IgnoreGuiInset: true,
		ResetOnSpawn: false,
		ZIndexBehavior: Enum.ZIndexBehavior.Sibling,
	});

	private gameMenu = Make("ScreenGui", {
		Name: "GameMenu",
		Parent: playerGui,
		ResetOnSpawn: false,
		IgnoreGuiInset: true,
		ZIndexBehavior: Enum.ZIndexBehavior.Sibling,
	});

	private dossierRoot = Make("SurfaceGui", {
		Name: "DossierRoot",
		Parent: playerGui,
		Face: Enum.NormalId.Top,
		AlwaysOnTop: true,
		ResetOnSpawn: false,
		SizingMode: Enum.SurfaceGuiSizingMode.PixelsPerStud,
		PixelsPerStud: 400,
	});

	private dossierMenuReturnIcon = Make("ScreenGui", {
		Name: "DossierMenuReturnIcon",
		Parent: playerGui,
		IgnoreGuiInset: true,
		ZIndexBehavior: Enum.ZIndexBehavior.Sibling,
	});

	entityDetailsRoot = Make("BillboardGui", {
		Size: new UDim2(15, 0, 30, 0),
		ResetOnSpawn: false,
		AlwaysOnTop: true,

		ClipsDescendants: false,
	});

	onStart(): void {
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, false);

		ReactRoblox.createRoot(this.metaOverlay).render(
			<ReflexProvider producer={GameRouter.gameProducer}>
				<DevApp />
			</ReflexProvider>, //this one is fine
		);

		ReactRoblox.createRoot(this.gameRoot).render(
			<ReflexProvider producer={GameRouter.gameProducer}>
				<GameApp />
			</ReflexProvider>, //this one is not fine
		);

		// ReactRoblox.createRoot(this.dialogueRoot).render(
		// 	<ReflexProvider producer={dialogueProducer}>
		// 		<DialogueHandler />
		// 	</ReflexProvider>,
		// );

		// ReactRoblox.createRoot(this.gameMenu).render(<GameMenu />);

		// ReactRoblox.createRoot(this.entityDetailsRoot).render(<NpcDetail />);

		// ReactRoblox.createRoot(this.dossierMenuReturnIcon).render(<DossierMenuReturnIcons />);

		// const root = ReactRoblox.createRoot(new Instance("Folder")); // npcData container
		// root.render(<DossierMenu />);

		// For Testing drag n drop
		// UserInputService.InputBegan.Connect((inp) => {
		// 	if (inp.UserInputType === Enum.UserInputType.MouseButton1) {
		// 		const inset = GuiService.GetGuiInset();
		// 		const mouse = UserInputService.GetMouseLocation().sub(new Vector2(0, inset[0].Y));
		// 		if (!mouse) return;

		// 		const targetGuiArray = playerGui.GetGuiObjectsAtPosition(mouse.X, mouse.Y);
		// 		print(targetGuiArray);
		// 	}
		// });
	}
}

const dummy: NpcData = {
	entity: "100",
	npcType: "Civilian",
	outfit: "Office",
	ai: "lol",
	tags: [],
	state: "idle",
	dialogue: "Dialogue1",

	visibleInteractableEntities: [],
	alertness: 10,
	alertnessMultiplier: 1,
	morale: 0,
	moraleMultiplier: 1,
	hearingRange: 40,

	perks: [],
	statusEffects: [],
	systemsAtWork: ["System1", "System2", "System3"],
	displayPathfinding: false,
	highlighted: true,
	hostile: true,
};
