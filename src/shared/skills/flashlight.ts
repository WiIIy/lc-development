import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { isAiming } from "shared/sharedAtoms";
import { enableDisableParticlesLights } from "shared/utils/visual/toggleParticlesNLights";

@SkillDecorator
export class Flashlight extends Skill {
	protected OnStartClient(): void {
		isAiming(true); //align lookat viewmodel with the light cause ur head likes to turn weird
		// this.clientExecuteServerCode();
	}

	protected OnStartServer(): void {
		const char = this.Character.Player?.Character as Model;
		const flashlight = char.FindFirstChild("Flashlight") as Model;
		const sound = flashlight.FindFirstChild("handle")?.FindFirstChild("Sound") as Sound;
		sound.Play();
		enableDisableParticlesLights(flashlight, true);
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	clientExecuteServerCode() {}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	serverExecuteClientCode() {}

	protected OnConstructServer(): void {}

	protected OnConstructClient(): void {
		this.Destroyed.Connect(() => {
			isAiming(false);
		});
	}
}
