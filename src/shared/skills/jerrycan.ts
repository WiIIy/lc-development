import { CollectionService, Debris, ReplicatedStorage, Workspace } from "@rbxts/services";
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";

@SkillDecorator
export class Jerrycan extends Skill {
	puddleTemplateFolder = ReplicatedStorage.CAAssets.misc.puddles; //children: Puddle1, Puddle2, Puddle3 (all meshparts with customphysicalproperty to make it slippery)
	viewmodel: typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel | undefined;
	private pourDebounce = false;

	protected OnStartClient(): void {
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.FindFirstChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}
	}

	protected OnStartServer(): void {
		this.serverExecuteClientCode();
	}

	pour() {
		if (this.pourDebounce) return;
		this.pourDebounce = true;

		// Optional: Play a pouring animation here

		this.serverPour();

		task.delay(0.5, () => {
			this.pourDebounce = false; // Prevent spamming 1000 puddles a second
		});
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverPour() {
		const char = this.Character.Player?.Character as Model;
		if (!char) return;

		const rootPart = char.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!rootPart) return;

		// Raycast slightly in front of the player
		const dropPos = rootPart.Position.add(rootPart.CFrame.LookVector.mul(3));
		const raycastParams = new RaycastParams();
		raycastParams.FilterDescendantsInstances = [char];
		raycastParams.FilterType = Enum.RaycastFilterType.Exclude;

		// Cast straight down from the drop position
		const result = Workspace.Raycast(dropPos, new Vector3(0, -10, 0), raycastParams);

		if (result && result.Instance) {
			const puddles = this.puddleTemplateFolder.GetChildren() as MeshPart[];
			if (puddles.size() === 0) return;

			// Pick a random puddle
			const randomIndex = math.random(0, puddles.size() - 1);
			const randomPuddle = puddles[randomIndex].Clone();
			randomPuddle.Name = "OilPuddle";

			// Align to surface normal
			const cframe = CFrame.lookAt(result.Position, result.Position.add(result.Normal)).mul(
				CFrame.Angles(math.rad(-90), 0, 0),
			);
			randomPuddle.CFrame = cframe.add(result.Normal.mul(0.05));

			randomPuddle.Parent = Workspace;

			// Tag it so the lighter can find it
			CollectionService.AddTag(randomPuddle, "OilPuddle");

			// Set an attribute for the normal so the fire pool knows how to spawn
			randomPuddle.SetAttribute("SurfaceNormal", result.Normal);

			// Clean up eventually if unlit
			Debris.AddItem(randomPuddle, 60);
		}
	}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	serverExecuteClientCode() {}

	protected OnConstructServer(): void {}

	protected OnConstructClient(): void {}
}
