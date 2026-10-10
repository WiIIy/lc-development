export function enableDisableParticlesLights(model: Model, enable: boolean) {
	const descendants = model.GetDescendants();
	if (!model || !descendants) {
		print("no models or descendants");
		return;
	}

	for (const obj of descendants) {
		if (obj.IsA("ParticleEmitter") || obj.IsA("PointLight") || obj.IsA("SpotLight")) {
			obj.Enabled = enable;
		}
	}
}
