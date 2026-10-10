import { Workspace, Debris } from "@rbxts/services";

export function debugDrawWaypoints(waypoints: PathWaypoint[]) {
	for (const wp of waypoints) {
		const part = new Instance("Part");
		part.Size = new Vector3(0.1, 0.1, 0.1);
		part.Color = new Color3(1, 0, 0); // red
		part.Anchored = true;
		part.CanCollide = false;
		part.CanQuery = false;
		part.CanTouch = false;
		part.Position = wp.Position;
		part.Parent = Workspace;

		Debris.AddItem(part, 2); // auto-delete after 2s
	}
}