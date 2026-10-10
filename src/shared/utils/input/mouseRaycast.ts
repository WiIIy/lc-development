import { Players, UserInputService, Workspace } from "@rbxts/services";

/**
 * Fires a ray from the client's mouse.
 * @param raycastLength length of ray in studs
 * @returns RaycastResult
 */
export function mouseRaycast(raycastLength: number): RaycastResult {
	const mousePos = UserInputService.GetMouseLocation() as Vector2;
	const mouseRay = Workspace.CurrentCamera!.ViewportPointToRay(mousePos.X, mousePos.Y) as Ray;
	const params = new RaycastParams();
	params.AddToFilter(Players.LocalPlayer.Character || Players.LocalPlayer.CharacterAdded.Wait()[0]);
	params.FilterType = Enum.RaycastFilterType.Exclude;
	const result = Workspace.Raycast(mouseRay.Origin, mouseRay.Direction.mul(raycastLength), params) as RaycastResult;
	return result;
}
