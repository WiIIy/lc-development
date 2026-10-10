export function getThicknessFromFace(part: BasePart, face: Enum.NormalId): number {
	const size = part.Size;

	switch (face) {
		case Enum.NormalId.Left:
		case Enum.NormalId.Right:
			return size.X;

		case Enum.NormalId.Top:
		case Enum.NormalId.Bottom:
			return size.Y;

		case Enum.NormalId.Front:
		case Enum.NormalId.Back:
			return size.Z;

		default:
			return math.max(size.X, size.Y, size.Z);
	}
}
