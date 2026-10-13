export function changeLocalTransparencyModifier(parent: Instance, transparent: boolean) {
	let tnum;
	if (transparent) {
		tnum = 1;
	} else {
		tnum = 0;
	}

	for (const descendant of parent.GetDescendants()) {
		if (descendant.IsA("BasePart")) {
			descendant.LocalTransparencyModifier = tnum;
		}
	}
}
