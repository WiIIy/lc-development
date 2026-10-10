import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { ServerContext } from "shared/ServerContext";
import { mouseRaycast } from "shared/utils/input/mouseRaycast";
import { deserializeColor3 } from "shared/utils/profile/colorSerdes";

@SkillDecorator
export class Mark extends Skill {
	private lastMarkTime = 0;

	// Server-side tracking
	private activeServerPart?: Part;
	private currentMarkVersion = 0;

	protected OnStartClient(): void {}
	protected OnStartServer(): void {}

	public placeMark() {
		// Lowered debounce to 0.1s so "updating" feels responsive 
		if (os.clock() - this.lastMarkTime < 0.1) return;
		this.lastMarkTime = os.clock();

		const result = mouseRaycast(1000);
		if (result) {
			this.serverUpdateOrCreateMark(result.Position);
		}
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	private serverUpdateOrCreateMark(position: Vector3) {
		if (!this.Player) return;

		// 1. Increment version to "cancel" any pending cleanup tasks
		this.currentMarkVersion += 1;
		const myVersion = this.currentMarkVersion;

		if (this.activeServerPart && this.activeServerPart.Parent) {
			// 2. MOVE EXISTING: If it exists, just update position
			this.activeServerPart.Position = position;
		} else {
			// 3. CREATE NEW: If it doesn't exist, build it
			this.activeServerPart = this.createMarkInstance(position);
		}

		// 4. RESET CLEANUP TIMER: Manual delay instead of Debris
		task.delay(2, () => {
			// Only destroy if no one has updated the mark since this delay started
			if (this.currentMarkVersion === myVersion && this.activeServerPart) {
				this.activeServerPart.Destroy();
				this.activeServerPart = undefined;
			}
		});
	}

	private createMarkInstance(position: Vector3): Part {
		let markColor = new Color3(1, 1, 1);
		const inventoryService = ServerContext.InventoryService;

		if (inventoryService) {
			const profile = inventoryService.getProfile(this.Player!);
			if (profile) markColor = deserializeColor3(profile.Data.equippedDossier.avatar.highlight);
		}

		const markPart = new Instance("Part");
		markPart.Name = `Ping_${this.Player!.Name}`;
		markPart.Anchored = true;
		markPart.CanCollide = false;
		markPart.CanQuery = false;
		markPart.Transparency = 1;
		markPart.Size = new Vector3(0.1, 0.1, 0.1);
		markPart.Position = position;

		const billboard = new Instance("BillboardGui");
		billboard.AlwaysOnTop = true;
		billboard.Size = UDim2.fromOffset(20, 20);
		billboard.ExtentsOffsetWorldSpace = new Vector3(0, 0.5, 0);
		billboard.Parent = markPart;

		const frame = new Instance("Frame");
		frame.Size = new UDim2(0.3, 0, 0.3, 0);
		frame.BackgroundColor3 = markColor;
		frame.Rotation = 45;
		frame.Parent = billboard;

		new Instance("UIStroke", frame).Thickness = 2;
		new Instance("UICorner", frame).CornerRadius = new UDim(0, 0);

		markPart.Parent = Workspace;
		return markPart;
	}

	protected OnConstructServer(): void {
		// Clean up if the character/skill is destroyed (e.g., player leaves)
		this.Destroyed.Connect(() => {
			this.activeServerPart?.Destroy();
		});
	}

	protected OnConstructClient(): void {}
}
