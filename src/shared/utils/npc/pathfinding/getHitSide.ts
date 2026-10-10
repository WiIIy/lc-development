export function getHitSide(raycastResult: RaycastResult): Enum.NormalId | undefined {
	if (!raycastResult) return undefined;

	const hitPart = raycastResult.Instance;
	if (!hitPart || !hitPart.IsA("BasePart")) return undefined;

	// The Normal vector points directly out from the surface hit
	const normal = raycastResult.Normal;

	// Compare Normal to the 6 face normals in WORLD SPACE
	// We use VectorToWorldSpace to account for rotated parts
	const faces = [
		[Enum.NormalId.Top, Vector3.yAxis],
		[Enum.NormalId.Bottom, Vector3.yAxis.mul(-1)],
		[Enum.NormalId.Front, Vector3.zAxis.mul(-1)],
		[Enum.NormalId.Back, Vector3.zAxis],
		[Enum.NormalId.Right, Vector3.xAxis],
		[Enum.NormalId.Left, Vector3.xAxis.mul(-1)],
	] as const;

	for (const [face, faceNormal] of faces) {
		const worldFaceNormal = hitPart.CFrame.VectorToWorldSpace(faceNormal);
		// Check if vectors are parallel (Dot product approx 1)
		if (worldFaceNormal.Dot(normal) > 0.999) {
			return face;
		}
	}

	return undefined;
}
