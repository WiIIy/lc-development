import { SkillDecorator } from "@rbxts/wcs";
import { Players, ContextActionService, Workspace } from "@rbxts/services";
import { BaseFirearmSkill } from "./basefirearmskill";

@SkillDecorator
export class Pistol extends BaseFirearmSkill {
	magOut = false;

	protected OnStartServer(): void {
		super.OnStartServer();
		// print("Pistol specific server setup (if any)");
	}

	protected OnStartClient(): void {
		super.OnStartClient();
	}

	Fire() {
		this.handleInput();
	}

	QuickReload() {}

	protected OnDestroyClient(): void {
		// Cleanup input when unequipped
		ContextActionService.UnbindAction("FirePistol");
	}

	private handleInput() {
		const mouse = Players.LocalPlayer.GetMouse();
		const targetPos = mouse.Hit.Position;

		// Call the simplified fire method in Base
		this.attemptFire(targetPos);
	}

	protected OnConstructClient(): void {
		super.OnConstructClient();
	}

	protected OnConstructServer(): void {
		super.OnConstructServer();
	}
}
