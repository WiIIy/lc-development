import { Message, Skill, SkillDecorator } from "@rbxts/wcs";
import { Players, ReplicatedStorage, Workspace } from "@rbxts/services";
import { ANIMATION_IDS } from "shared/data/AnimationIDs";
import { AnimationUtils } from "shared/utils/animationUtil";
import { mouseRaycast } from "shared/utils/clientutils/mouseRaycast";
import { ALL_ITEMS } from "shared/data/InventoryState";

@SkillDecorator
export class GrapplingHook extends Skill {
	viewmodel: Model | undefined;
	private debounce = false;
	private activeRope: RopeConstraint | undefined;
	private activeAnchorPart: Part | undefined;
	private activeRootAttachment: Attachment | undefined;
	private activeAnchorAttachment: Attachment | undefined;
	private maxDistance = 300;
	private winchSpeed = 500;
	private ropeVisible = true;
	private ropeColor = new BrickColor("Black metallic");
	private lastHitPart: BasePart | undefined;
	grapplingItem = false;
	itemModel: Model | undefined;
	ragdollModel: Model | undefined;

	grappleViewmodelId = ANIMATION_IDS.viewmodel.GrapplingHook.grappling;
	grappleOffViewmodelId = ANIMATION_IDS.viewmodel.GrapplingHook.grappleOff;

	grappleCharId = ANIMATION_IDS.item.GrapplingHook.grappling;
	grappleOffCharId = ANIMATION_IDS.item.GrapplingHook.grappleOff;

	grappleMarker = {
		hold: () => {
			if (this.grapplingItem && (this.itemModel || this.ragdollModel)) {
				if (this.itemModel) {
					this.startItemPull(this.itemModel, this.lastHitPart);
				} else if (this.ragdollModel) {
					this.setNetworkOwnerFromServer(this.ragdollModel, Players.LocalPlayer);
					this.startItemPull(this.ragdollModel, this.lastHitPart);
				}
				return;
			}
			print("grapple");
			this.startGrapple();
		},
	};

	// ==============================
	// Skill lifecycle
	// ==============================

	protected OnStartClient(): void {
		if (!this.viewmodel) {
			this.viewmodel = Workspace.CurrentCamera?.WaitForChild(
				"BaseViewmodel",
			) as typeof ReplicatedStorage.CAAssets.viewmodels.BaseViewmodel;
		}

		AnimationUtils.preloadAnimations(this.viewmodel, [this.grappleOffViewmodelId, this.grappleViewmodelId]);
		AnimationUtils.preloadAnimations(this.Player!.Character!, [this.grappleCharId, this.grappleOffCharId]);
	}
	protected OnStartServer(): void {}

	protected OnConstructClient(): void {}
	protected OnConstructServer(): void {}

	// ==============================
	// Public entry (called from InputController on G)
	// ==============================

	Hook() {
		if (!this.Player) return;
		if (!this.viewmodel) return;

		// If already grappling -> unhook
		if (this.activeRope) {
			AnimationUtils.loadAnim(this.viewmodel, "grapplingOff", this.grappleOffViewmodelId, 0);
			AnimationUtils.loadAnim(this.Player!.Character!, "grapplingOff", this.grappleOffCharId, 0);
			this.cleanupGrapple();
			this.serverDisconnectGrapple();
			return;
		}

		//this block pulls itemsto you
		const result = mouseRaycast(1000);

		if (result) {
			const model = result.Instance.FindFirstAncestorOfClass("Model");
			// print(model);
			if (model && ALL_ITEMS.includes(model.Name)) {
				this.grapplingItem = true;
				this.itemModel = model;
				this.lastHitPart = result.Instance;
			}
			if (model?.GetAttribute("ragdolled") === true) {
				this.grapplingItem = true;
				this.ragdollModel = model;
				this.lastHitPart = result.Instance;
			}
		}

		AnimationUtils.loadAnim(this.viewmodel, "grappling", this.grappleViewmodelId, 0, false, this.grappleMarker);
		AnimationUtils.loadAnim(this.Player!.Character!, "grappling", this.grappleCharId, 0); //character anims are auto replicated to server
	}

	// ==============================
	// Client Grapple Logic
	// ==============================

	private startGrapple() {
		if (this.debounce) return;
		this.debounce = true;

		const player = Players.LocalPlayer;
		if (!player.Character) {
			this.debounce = false;
			return;
		}

		const humanoidRootPart = player.Character.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!humanoidRootPart) {
			this.debounce = false;
			return;
		}

		const mouse = player.GetMouse();
		const hitPosition = mouse.Hit.Position;

		const distance = this.distanceBetweenVectors(hitPosition, humanoidRootPart.Position);

		if (distance > this.maxDistance) {
			this.debounce = false;
			return;
		}

		// Create anchor part
		const anchorPart = new Instance("Part");
		anchorPart.Anchored = true;
		anchorPart.Transparency = 1;
		anchorPart.Position = hitPosition;
		anchorPart.Parent = this.Player!.Character!;

		const anchorAttachment = this.createAttachment(anchorPart);
		const rootAttachment = this.createAttachment(humanoidRootPart);

		const rope = new Instance("RopeConstraint");
		rope.Parent = this.Player!.Character!;
		rope.Name = "ClientRope";
		rope.Attachment0 = anchorAttachment;
		rope.Attachment1 = rootAttachment;
		rope.Attachment1.CFrame = new CFrame(-0.4, -0.5, 1);
		rope.WinchEnabled = true;
		rope.Length = distance;
		rope.WinchTarget = 5;
		rope.WinchForce = 1e11;
		rope.Restitution = 0;
		rope.Color = this.ropeColor;
		rope.Visible = this.ropeVisible;
		rope.Length = distance;
		rope.WinchSpeed = this.winchSpeed;

		// Store active references so we can unhook later
		this.activeRope = rope;
		this.activeAnchorPart = anchorPart;
		this.activeAnchorAttachment = anchorAttachment;
		this.activeRootAttachment = rootAttachment;

		this.serverStartGrapple(hitPosition, distance);
		this.debounce = false;
	}

	private cleanupGrapple() {
		const root = this.Player!.Character!.FindFirstChild("HumanoidRootPart") as BasePart;

		if (root) {
			const currentVelocity = root.AssemblyLinearVelocity;
			const speed = currentVelocity.Magnitude;

			if (speed > 0) {
				const direction = currentVelocity.Unit;
				const boostStrength = 40; // tweak
				const boost = direction.mul(boostStrength);

				root.AssemblyLinearVelocity = currentVelocity.add(boost);
			}
		}

		this.activeAnchorAttachment?.Destroy();
		this.activeRootAttachment?.Destroy();
		this.activeRope?.Destroy();
		this.activeAnchorPart?.Destroy();

		this.activeRope = undefined;
		this.activeAnchorPart = undefined;
		this.activeAnchorAttachment = undefined;
		this.activeRootAttachment = undefined;

		this.grapplingItem = false;
		this.lastHitPart = undefined;
		this.itemModel = undefined;

		if (this.ragdollModel) {
			this.setNetworkOwnerFromServer(this.ragdollModel, undefined);
		}
		this.ragdollModel = undefined;
	}

	private distanceBetweenVectors(u: Vector3, v: Vector3) {
		const difference = u.sub(v);
		const magnitude = difference.Magnitude;
		return math.floor(magnitude / 1 + 0.5) * 1;
	}

	private createAttachment(parent: Instance) {
		const attachment = new Instance("Attachment");
		attachment.Name = "RopeAttachment";
		attachment.Parent = parent;
		return attachment;
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverStartGrapple(hitPosition: Vector3, distance: number) {
		if (!this.Player) return;

		const character = this.Player.Character;
		if (!character) return;

		const root = character.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!root) return;

		// SECURITY CHECK
		if (root.Position.sub(hitPosition).Magnitude > this.maxDistance) return;

		// Create anchor part (server-side)
		const anchorPart = new Instance("Part");
		anchorPart.Anchored = true;
		anchorPart.Transparency = 1;
		anchorPart.Position = hitPosition;
		anchorPart.Parent = this.Player.Character!;

		//creates attachment under each character HumanoidRootPart
		const anchorAttachment = this.createAttachment(anchorPart);
		const rootAttachment = this.createAttachment(root);

		const rope = new Instance("RopeConstraint");
		rope.Parent = this.Player.Character!;
		rope.Name = "ServerRope";
		rope.Attachment0 = anchorAttachment;
		rope.Color = this.ropeColor;
		rope.Attachment1 = rootAttachment;
		rope.Attachment1.CFrame = new CFrame(-0.4, -0.5, 1); //bit lower to the left
		rope.WinchEnabled = true;
		rope.Length = distance;
		rope.WinchForce = 0;
		rope.WinchSpeed = this.winchSpeed;
		rope.Visible = true;

		//server vars are separate from client vars
		this.activeRope = rope;
		this.setServerRopeVisibilityOnClient(rope.Name, false);
		this.activeAnchorPart = anchorPart;

		// store in a Map<Player, RopeData> so you can clean up later
	}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	setServerRopeVisibilityOnClient(rope: string, visibile: boolean) {
		const ropeconstraint = this.Player?.Character!.FindFirstChild(rope) as RopeConstraint;
		ropeconstraint.Visible = visibile;
	}

	@Message({
		Type: "Event",
		Destination: "Server",
	})
	serverDisconnectGrapple() {
		// Destroy local rope, keep server rope
		this.activeRope?.Destroy();
		this.activeAnchorAttachment?.Destroy();
		this.activeRootAttachment?.Destroy();
		this.activeAnchorPart?.Destroy();
	}

	private startItemPull(model: Model, hitpart: BasePart | undefined) {
		const player = this.Player!;
		const char = player.Character;
		if (!char) return;

		const root = char.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!root) return;

		const distance = root.Position.sub(hitpart!.Position).Magnitude;
		if (distance > this.maxDistance) return;

		const rootAttachment = this.createAttachment(root);

		const rope = new Instance("RopeConstraint");
		rope.Parent = char;

		rope.Attachment1 = rootAttachment;

		rope.Length = distance;
		rope.WinchEnabled = true;
		rope.WinchTarget = 3; // stops near player
		rope.WinchForce = 1e9;
		rope.WinchSpeed = this.winchSpeed;

		rope.Visible = this.ropeVisible;
		rope.Color = this.ropeColor;

		this.activeRope = rope;
		this.activeRootAttachment = rootAttachment;

		if (this.itemModel) {
			const handle = model.FindFirstChild("handle") as BasePart;
			if (!handle) return;
			const itemAttachment = this.createAttachment(handle);

			rope.Attachment0 = itemAttachment;
			this.activeAnchorAttachment = itemAttachment;
		} else if (this.ragdollModel) {
			const ragdollAttachment = this.createAttachment(hitpart!);

			rope.Attachment0 = ragdollAttachment;
			this.activeAnchorAttachment = ragdollAttachment;
		}
	}

	// ==============================
	// Optional Server Hooks (if later needed)
	// ==============================
	@Message({
		Type: "Event",
		Destination: "Server",
	})
	setNetworkOwnerFromServer(model: Model, owner: Player | undefined) {
		model.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				if (descendant.FindFirstAncestorOfClass("Accessory")) return;
				descendant.Anchored = false;
				descendant.SetNetworkOwner(owner);
			}
		});
	}

	@Message({
		Type: "Event",
		Destination: "Client",
	})
	serverExecuteClientCode() {}
}
