import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";

@SkillDecorator
export class Walkman extends Skill {
	viewmodel: typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel | undefined;

	protected OnStartClient(): void {
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.FindFirstChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}

		this.clientExecuteServerCode();
	}

	protected OnStartServer(): void {
		this.serverExecuteClientCode();
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

	protected OnConstructClient(): void {}
}
