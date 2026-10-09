export function setDescendantCollisionGroup(model: Model, groupName: string): void {
	for (const descendant of model.GetDescendants()) {
		if (descendant.IsA("BasePart")) {
			descendant.CollisionGroup = groupName;
		}
	}
}

export function setDescendantLocalTransparency(model: Instance, localTransparency: number): void {
	for (const descendant of model.GetDescendants()) {
		if (descendant.IsA("BasePart") || descendant.IsA("MeshPart")) {
			if (descendant.Name === "HumanoidRootPart") continue;
			descendant.LocalTransparencyModifier = localTransparency;
		}
	}
}

export function setDescendantTransparency(model: Model | BasePart, Transparency: number): void {
	for (const descendant of model.GetDescendants()) {
		if (descendant.IsA("BasePart") || descendant.IsA("MeshPart")) {
			descendant.Transparency = Transparency;
		}
	}
}

export function setDescendantsNetworkOwner(instance: Instance, owner: Player | undefined) {
	for (const descendant of instance.GetDescendants()) {
		if (descendant.IsA("BasePart")) {
			descendant.Anchored = false; //prevent "Network Ownership API cannot be called on Anchored parts or parts welded to Anchored parts."
			descendant.CanCollide = true;
			descendant.SetNetworkOwner(undefined);
		}
	}
}
