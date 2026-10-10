import { Debris } from "@rbxts/services";

export function processGlassShatter(glassModel: Model, hitPosition: Vector3, origin: Vector3) {
	// The core direction the attack was moving
	const baseDirection = hitPosition.sub(origin).Unit;

	const MAX_FORCE = 120; // Tweak this for more/less explosive shattering
	const IMPACT_RADIUS = 8; // How far the "max force" reaches in studs

	for (const child of glassModel.GetChildren()) {
		if (child.IsA("BasePart")) {
			let shouldCleanup = true;

			// Edge handling
			if (child.Name.lower().match("edge")[0] !== undefined) {
				if (math.random() > 0.4) {
					// stays anchored → do NOT clean up
					shouldCleanup = false;
					continue;
				}
			}

			child.Anchored = false;
			child.CanCollide = true;

			const distance = child.Position.sub(hitPosition).Magnitude;
			const forceMultiplier = math.clamp(1 - distance / IMPACT_RADIUS, 0.1, 1);

			const randomSpread = new Vector3(
				(math.random() - 0.5) * 0.4,
				(math.random() - 0.5) * 0.4,
				(math.random() - 0.5) * 0.4,
			);

			const finalDirection = baseDirection.add(randomSpread).Unit;

			const impulse = finalDirection.mul(MAX_FORCE * forceMultiplier * child.AssemblyMass);
			child.ApplyImpulse(impulse);

			child.AssemblyAngularVelocity = new Vector3(
				math.random(-20, 20),
				math.random(-20, 20),
				math.random(-20, 20),
			);

			// Only cleanup moving shards
			if (shouldCleanup) {
				Debris.AddItem(child, 6);
			}
		}
	}
}
