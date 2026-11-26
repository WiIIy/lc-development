// Hit detection only. Used by npc attacks AND player attacks.
const Workspace = game.GetService("Workspace");
const DEBUG_HITBOX = true;
const BACK_OFFSET = 0.5; // start behind the attacker so a target hugging it isn't missed

export type MeleeContact = { model: Model; part: BasePart };

export function meleeCast(
	from: CFrame,
	attackerModel: Instance | undefined,
	candidates: Instance[],
	blockcast: { size: Vector3; distance: number },
): MeleeContact | undefined {
	if (candidates.size() === 0) return undefined;
	const { size, distance } = blockcast;
	const origin = from.Position;
	const look = from.LookVector;
	const flatLook = new Vector3(look.X, 0, look.Z);
	const forward = flatLook.Magnitude > 0.001 ? flatLook.Unit : look;
	const castOrigin = origin.sub(forward.mul(BACK_OFFSET));
	const castCFrame = CFrame.lookAt(castOrigin, castOrigin.add(forward));
	const castLength = distance + BACK_OFFSET;

	const hitboxParams = new RaycastParams();
	hitboxParams.FilterType = Enum.RaycastFilterType.Include;
	hitboxParams.FilterDescendantsInstances = candidates;
	const result = Workspace.Blockcast(castCFrame, size, forward.mul(castLength), hitboxParams);

	const part = result?.Instance;
	const model = candidates.find((candidate) => part !== undefined && part.IsDescendantOf(candidate));

	let blocked = false;
	if (part !== undefined && model !== undefined) {
		const sightParams = new RaycastParams();
		sightParams.FilterType = Enum.RaycastFilterType.Exclude;
		sightParams.FilterDescendantsInstances = attackerModel !== undefined ? [attackerModel] : [];
		sightParams.RespectCanCollide = true;
		const root = model.FindFirstChild("HumanoidRootPart");
		const aim = root !== undefined && root.IsA("BasePart") ? root.Position : part.Position;
		const sight = Workspace.Raycast(origin, aim.sub(origin), sightParams);
		blocked = sight !== undefined && !sight.Instance.IsDescendantOf(model);
	}

	if (DEBUG_HITBOX) {
		const box = new Instance("Part");
		box.Anchored = true;
		box.CanCollide = false;
		box.CanQuery = false;
		box.CanTouch = false;
		box.Size = new Vector3(size.X, size.Y, size.Z + castLength);
		box.CFrame = castCFrame.mul(new CFrame(0, 0, -castLength / 2));
		box.Color =
			model === undefined
				? Color3.fromRGB(60, 255, 60)
				: blocked
					? Color3.fromRGB(255, 220, 60)
					: Color3.fromRGB(255, 60, 60);
		box.Transparency = 0.7;
		box.Parent = Workspace;
		task.delay(0.25, () => box.Destroy());
	}

	if (part === undefined || model === undefined || !model.IsA("Model") || blocked) return undefined;
	return { model, part: part as BasePart };
}
