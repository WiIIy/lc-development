export function serializeColor3(color: Color3) {
	return { r: color.R, g: color.G, b: color.B };
}

export function deserializeColor3(data: { r: number; g: number; b: number }) {
	return new Color3(data.r, data.g, data.b);
}
