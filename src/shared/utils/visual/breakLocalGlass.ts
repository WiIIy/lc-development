import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientContext } from "shared/ClientContext";
import { processGlassShatter } from "./processGlassShatter";

//breaks glas duplicate locally for responsiveness and then break the server's glass
export function breakLocalGlass(model: Model, origin: Vector3, hitPosition: Vector3) {
	const clone = model.Clone();
	const glassContainer = Workspace.FindFirstChild("GlassContainer");
	clone.Name = "GlassClone";
	clone.FindFirstChild("Fake1")?.Destroy(); //utilizing the fact that transparent things dont show through the glass material to hide the shards
	clone.FindFirstChild("Fake2")?.Destroy(); //the two fake baseparts (front n back) are to conceal the shards inside.
	clone.Parent = glassContainer;
	processGlassShatter(clone, hitPosition, origin);
	ReplicatedStorage["shared/network@GlobalEvents"].shatterGlass.FireServer(model, origin, hitPosition);
	if (model.Parent && model.Parent.Name === "Mirror") {
		const wall = model.Parent.FindFirstChild("WallInvis") as BasePart; //once the mirror is shattered, you only see the wall and no reflection
		wall.Transparency = 0;
	}
	if (model.Name === "Mirror" || model.Parent?.Name === "Mirror") {
		const mirrorController = ClientContext.MirrorController;
		if (mirrorController) {
			mirrorController.destroyMirror();
		}
	}
	model.Parent = undefined;
}

//TODO, make this connect to their respective mirrors in case there are multiple in the map
