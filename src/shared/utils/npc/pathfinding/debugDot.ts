import { Workspace, Debris } from "@rbxts/services";

export function debugDot(position: Vector3, color: Color3) {
	const p = new Instance("Part");
	p.Name = "debugDot";

	p.Shape = Enum.PartType.Ball;
	p.Size = new Vector3(0.6, 0.6, 0.6);
	p.Material = Enum.Material.Neon;
	p.Color = color;

	p.Anchored = true;
	p.CanCollide = false;
	p.Position = position;
	p.CanQuery = false;

	p.Parent = Workspace;

	Debris.AddItem(p, 6);
}
