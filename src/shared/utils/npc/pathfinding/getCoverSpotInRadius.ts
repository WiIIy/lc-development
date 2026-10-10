import { Workspace } from "@rbxts/services";
import { debugDot } from "./debugDot";
import { generateFrontDirections } from "./generateFrontDirections";
import { getHitSide } from "./getHitSide";
import { getThicknessFromFace } from "./getThicknessFromFace";

//1. shoot single ray to wall. straight forward from where humanoidrootpart/torso is facing
//if result meets wall. get the normal.
//if left/right -> thickness is Size.X
//if top/bottom -> thickness is Size.Y
//if front/back -> thickness is Size.Z

//2. draw a straight line from the rayhit point. added by the thickness of the part.
//3. add 1 stud offset still in the same direction. in one line.
// so origin (character torso), rayhit, rayhitlength + thickness in stud, rayhit length + thickness + 1 offset is in ONE line. one line crosses each one of those points. every point is indicated by a red yellow green blue dot part respectively. youre essentially extending the length of the rayhit point by the thickness and the 1 stud offset
// once the final point (rayhit length + thickness + 1 stud offset) is obtained. raycast directly DOWNwards to find a floor. if the floor raycast is less than 2 studs. mark it as valid and return it in the list. print each "valid cover spot" list member and the part name for debugging.

const RAY_LENGTH = 30; // Increased slightly so it can find thicker walls

export function getCoverSpotsInRadius(player: Player, enemyModel?: Model): Vector3[] {
	const char = player.Character;
	if (!char) return [];

	const root = char.FindFirstChild("HumanoidRootPart") ?? char.FindFirstChild("Torso");

	if (!root || !root.IsA("BasePart")) return [];

	const origin = root.Position;

	const params = new RaycastParams();
	params.FilterDescendantsInstances = [char, Workspace.FindFirstChild("EnemyContainer") as Folder];
	params.FilterType = Enum.RaycastFilterType.Exclude;
	if (enemyModel){
		params.FilterDescendantsInstances = [char, enemyModel]; //no you cannot hide behind yourself
	}

	const coverSpots: Vector3[] = [];

	const directions = generateFrontDirections(root.CFrame); // 36 directions

	for (const dir of directions) {
		const rayDir = dir.Unit.mul(RAY_LENGTH);

		/* ORIGIN DOT */
		debugDot(origin, Color3.fromRGB(255, 0, 0)); //red dot is origin point

		/* STEP 1: forward ray */

		const hit = Workspace.Raycast(origin, rayDir, params);
		if (!hit) continue;

		const hitPoint = hit.Position;
		const hitPart = hit.Instance as BasePart;

		debugDot(hitPoint, Color3.fromRGB(255, 255, 0)); //ylw dot is rayhit point

		const face = getHitSide(hit);
		if (!face) continue;

		const thickness = getThicknessFromFace(hitPart, face);

		const dirUnit = rayDir.Unit;

		/* STEP 2: thickness point */

		const thicknessPoint = hitPoint.add(dirUnit.mul(thickness));

		debugDot(thicknessPoint, Color3.fromRGB(0, 255, 0)); //grn dot is rayhit point + thickness

		/* STEP 3: 1 stud offset */

		const offsetPoint = thicknessPoint.add(dirUnit.mul(1));

		debugDot(offsetPoint, Color3.fromRGB(0, 120, 255)); //blu dot is rayhit point + thickness + 1 stud offset

		/* STEP 4: downward floor test */

		const floorHit = Workspace.Raycast(offsetPoint, new Vector3(0, -10, 0), params);

		if (!floorHit) continue;

		const floorPos = floorHit.Position;

		const purplePoint = new Vector3(offsetPoint.X, floorPos.Y, offsetPoint.Z);

		debugDot(purplePoint, Color3.fromRGB(180, 0, 255)); //purple is blue projected onto the floor

		const clearance = Workspace.Raycast(purplePoint, new Vector3(0, 5, 0));

		if (clearance?.Instance) {
			// print("CLEARANCE", clearance.Instance, clearance.Instance.Parent, clearance.Distance)
			//means point doesnt have enough height for a player
			debugDot(purplePoint.add(new Vector3(0, 5, 0)), Color3.fromRGB(0, 0, 0));
			continue;
		}

		coverSpots.push(purplePoint);

		// print("Valid cover spot:", purplePoint, "Wall:", hitPart.Name);
	}

	print(coverSpots);
	return coverSpots;
}
